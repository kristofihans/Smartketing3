import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);


const BATCH_SIZE = 10; // load remaining frames in batches of this size

const FrameBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const folderName = isMobile ? 'Donemobile' : 'Donedesktop';
    const ext = 'jpg';
    const frameStep = 1;
    const startFrame = 1;
    const totalFrames = 240;
    const priorityBatch = 30;
    const limit = isMobile ? 30 : 50;

    // Enable/disable image smoothing based on device performance capability
    ctx.imageSmoothingEnabled = !isMobile;
    ctx.imageSmoothingQuality = isMobile ? 'low' : 'high';

    // Array to hold the preloaded Image objects
    const images = new Array(totalFrames);

    // Store the current frame index
    const animState = { frame: 0 };
    let canvasReady = false;
    let lastRenderedFrame = -1;
    let renderedFrame = 0;
    let lastScrollFrame = 0;

    // Autoplay state
    let autoplayActive = false;
    let autoplayFrame = 0;
    let lastTime = performance.now();
    let tickActive = true;
    let tickRunning = false;
    const fps = 24; // cinematic playback speed
    const frameInterval = 1000 / fps;

    // Helper to build frame URL
    const getFrameUrl = (index) => {
      const frameNum = String(startFrame + (index * frameStep)).padStart(3, '0');
      return `${import.meta.env.BASE_URL}${folderName}/ezgif-frame-${frameNum}.${ext}`;
    };

    // Function to render the current frame
    const renderFrame = (frameIndex) => {
      const img = images[frameIndex];
      if (img && img.complete && img.naturalWidth !== 0) {
        // Set canvas dimensions once to match image dimensions
        if (!canvasReady) {
          canvas.width = img.width;
          canvas.height = img.height;
          canvasReady = true;
        }
        ctx.drawImage(img, 0, 0);
      }
    };

    // Animation tick loop running at cinematic 24fps
    const tick = (now) => {
      if (!tickActive) return;

      const scrollFrame = animState.frame;
      const dScroll = scrollFrame - lastScrollFrame;
      lastScrollFrame = scrollFrame;

      if (dScroll < 0) {
        // User is scrolling up: subtract the scroll delta from autoplayFrame
        // so that the reverse animation is directly connected to the scroll distance
        autoplayFrame = autoplayFrame + dScroll;
        autoplayActive = false;
      } else if (dScroll > 0) {
        if (!autoplayActive) {
          autoplayActive = true;
          lastTime = now;
        }
      }

      if (autoplayActive && autoplayFrame < totalFrames - 1) {
        const delta = now - lastTime;
        if (delta >= frameInterval) {
          const framesToAdvance = Math.floor(delta / frameInterval);
          autoplayFrame = autoplayFrame + framesToAdvance;
          lastTime = now - (delta % frameInterval);
        }

        // Clamp autoplayFrame to a window relative to the scroll position.
        if (autoplayFrame < scrollFrame) {
          autoplayFrame = scrollFrame;
        } else if (autoplayFrame > scrollFrame + limit) {
          autoplayFrame = scrollFrame + limit;
        }
      } else {
        // Smoothly ease autoplayFrame down to scrollFrame when scrolling up or stopped
        const reverseEase = isMobile ? 0.15 : 0.12;
        autoplayFrame = autoplayFrame + (scrollFrame - autoplayFrame) * reverseEase;

        // Ensure it doesn't fall below the current scroll frame
        if (autoplayFrame < scrollFrame) {
          autoplayFrame = scrollFrame;
        }
      }

      // Ensure autoplayFrame never exceeds the total frames count
      if (autoplayFrame > totalFrames - 1) {
        autoplayFrame = totalFrames - 1;
      }

      const targetFrame = autoplayFrame;

      // Smoothly ease the rendered frame towards the target frame (adds momentum / inertia)
      const easeAmount = 0.08;
      if (Math.abs(targetFrame - renderedFrame) < 0.05) {
        renderedFrame = targetFrame;
      } else {
        renderedFrame = renderedFrame + (targetFrame - renderedFrame) * easeAmount;
      }

      const displayFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(renderedFrame)));

      if (lastRenderedFrame !== displayFrame) {
        lastRenderedFrame = displayFrame;
        renderFrame(displayFrame);


      }

      // Pause tick loop when idle to save CPU and GPU cycles
      const isLimitReached = autoplayFrame >= totalFrames - 1 || (autoplayActive && autoplayFrame >= scrollFrame + limit);
      const isIdle = Math.abs(targetFrame - renderedFrame) < 0.05 && dScroll === 0 && (!autoplayActive || isLimitReached);

      if (isIdle) {
        tickRunning = false;
      } else {
        requestAnimationFrame(tick);
      }
    };

    // Safely start or wake the tick loop
    const wakeTick = () => {
      if (!tickRunning && tickActive) {
        tickRunning = true;
        requestAnimationFrame((now) => {
          lastTime = now;
          tick(now);
        });
      }
    };

    // Start the tick loop initially
    wakeTick();

    // --- Prioritized frame loading ---

    // Load a single frame and return a promise
    const loadFrame = (index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = getFrameUrl(index);
        
        // Force asynchronous image decoding in the background before drawing it
        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode()
              .then(() => {
                wakeTick();
                resolve();
              })
              .catch(() => {
                wakeTick();
                resolve();
              });
          } else {
            wakeTick();
            resolve();
          }
        };
        img.onerror = () => resolve(); // don't block on errors
        images[index] = img;
      });
    };

    // Load frames in sequential batches to avoid overwhelming the browser
    const loadFramesBatched = async (startIdx, endIdx, batchSize) => {
      for (let i = startIdx; i < endIdx; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, endIdx); j++) {
          if (!images[j]) {
            batch.push(loadFrame(j));
          }
        }
        // Fire batch requests concurrently without awaiting to prevent slow requests from blocking the queue
        Promise.all(batch);
        // Small stagger delay before starting next batch
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    };

    // Start loading: priority frames first, then the rest in background
    const startLoading = async () => {
      // Phase 1: Load the first batch with high priority (needed for initial scroll)
      const priorityEnd = Math.min(priorityBatch, totalFrames);
      await loadFramesBatched(0, priorityEnd, priorityEnd);

      // Force render frame 0 as soon as priority batch is done
      lastRenderedFrame = -1;
      wakeTick();

      // Phase 2: Load the remaining frames in small batches in the background
      await loadFramesBatched(priorityEnd, totalFrames, BATCH_SIZE);
      wakeTick();
    };

    startLoading();

    // Set up a GSAP ScrollTrigger timeline to scrub the frames with easing
    const scrollTarget = document.querySelector('.app__content');

    let opacityTween;
    if (isMobile) {
      opacityTween = gsap.to(canvas, {
        scrollTrigger: {
          trigger: scrollTarget || document.documentElement,
          start: 'top 35%', // Start fading in as the user begins scrolling down
          end: 'top 10%',   // Fully visible once scrolled past the top portion
          scrub: 1,
        },
        opacity: 1,
        ease: 'power1.out'
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollTarget || document.documentElement,
        start: () => window.innerWidth < 768 ? 'top 20%' : 'top 80%', // Start later on mobile, early on desktop
        end: 'bottom bottom', // Run animation all the way to the bottom of the page
        scrub: isMobile ? 1.5 : 2.0, // Softened catch-up lag on scroll for fluid tracking
        onEnter: () => {
          autoplayActive = true;
          lastTime = performance.now();
          wakeTick();
        },
        onLeaveBack: () => {
          // Reset when scrolling back above the trigger (to the Hero)
          autoplayActive = false;
          autoplayFrame = 0;
          animState.frame = 0;
          lastScrollFrame = 0;
          wakeTick();
        },
        onUpdate: (self) => {
          if (self.direction === 1) {
            // Scrolling down: make sure autoplay is active
            if (!autoplayActive) {
              autoplayActive = true;
              lastTime = performance.now();
            }
          } else if (self.direction === -1) {
            // Scrolling up: disable autoplay so it doesn't drift forward when stopped
            autoplayActive = false;
          }
          wakeTick();
        }
      }
    });

    tl.to(animState, {
      frame: totalFrames - 1,
      ease: 'none', // Linear frame progression for consistent scroll speed
      duration: 1
    });



    // Cleanup
    return () => {
      tl.kill();
      if (opacityTween) {
        if (opacityTween.scrollTrigger) opacityTween.scrollTrigger.kill();
        opacityTween.kill();
      }
      tickActive = false; // Stop the animation loop


      // Release image references immediately to free up GPU and system memory
      for (let i = 0; i < images.length; i++) {
        if (images[i]) {
          images[i].onload = null;
          images[i].onerror = null;
          images[i].src = '';
          images[i] = null;
        }
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
