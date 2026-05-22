import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);

const START_FRAME = 25;
const BATCH_SIZE = 10; // load remaining frames in batches of this size

const FrameBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const folderName = isMobile ? 'final_mobile' : 'final';
    const frameStep = isMobile ? 2 : 1;
    const totalFrames = isMobile ? Math.ceil(217 / 2) : 217;
    const priorityBatch = isMobile ? 15 : 30;
    const limit = isMobile ? 25 : 50;

    // Enable image smoothing based on device performance capability
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = isMobile ? 'low' : 'high';

    // Array to hold the preloaded Image objects
    const images = new Array(totalFrames);

    // Store the current frame index
    const animState = { frame: 0 };
    let canvasReady = false;
    let lastRenderedFrame = -1;
    let renderedFrame = 0;

    // Autoplay state
    let autoplayActive = false;
    let autoplayFrame = 0;
    let lastTime = performance.now();
    let tickActive = true;
    const fps = 24; // cinematic playback speed
    const frameInterval = 1000 / fps;

    // Helper to build frame URL
    const getFrameUrl = (index) => {
      const frameNum = String(START_FRAME + (index * frameStep)).padStart(3, '0');
      return `${import.meta.env.BASE_URL}${folderName}/ezgif-frame-${frameNum}.webp`;
    };

    // Function to render the current frame
    const renderFrame = (frameIndex) => {
      const img = images[frameIndex];
      if (img && img.complete && img.naturalWidth !== 0) {
        // Set canvas dimensions once to match the image
        if (!canvasReady) {
          canvas.width = img.width;
          canvas.height = img.height;
          canvasReady = true;
        }
        ctx.drawImage(img, 0, 0);

        // Apply a smooth dark overlay near the end to transition to black
        const fadeStartFrame = totalFrames - (isMobile ? 10 : 20);
        if (frameIndex >= fadeStartFrame) {
          const fadeProgress = Math.min(1, (frameIndex - fadeStartFrame) / (isMobile ? 10 : 20));
          ctx.fillStyle = `rgba(0, 0, 0, ${fadeProgress * 0.7})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    // Animation tick loop running at cinematic 24fps
    const tick = (now) => {
      if (!tickActive) return;

      const scrollFrame = animState.frame;

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
        // If autoplay is not active (e.g. scrolling up or reset above trigger),
        // let autoplayFrame follow the GSAP scrubbed scrollFrame exactly.
        autoplayFrame = scrollFrame;
      }

      // Ensure autoplayFrame never exceeds the total frames count
      if (autoplayFrame > totalFrames - 1) {
        autoplayFrame = totalFrames - 1;
      }

      const targetFrame = autoplayFrame;

      // Smoothly ease the rendered frame towards the target frame (adds momentum / inertia)
      const easeAmount = isMobile ? 0.12 : 0.2;
      if (Math.abs(targetFrame - renderedFrame) < 0.05) {
        renderedFrame = targetFrame;
      } else {
        renderedFrame = renderedFrame + (targetFrame - renderedFrame) * easeAmount;
      }

      const displayFrame = Math.floor(renderedFrame);

      if (lastRenderedFrame !== displayFrame) {
        lastRenderedFrame = displayFrame;
        renderFrame(displayFrame);
      }

      requestAnimationFrame(tick);
    };

    // Start the tick loop
    requestAnimationFrame((now) => {
      lastTime = now;
      tick(now);
    });

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
              .then(() => resolve())
              .catch(() => resolve());
          } else {
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
        await Promise.all(batch);
      }
    };

    // Start loading: priority frames first, then the rest in background
    const startLoading = async () => {
      // Phase 1: Load the first batch with high priority (needed for initial scroll)
      const priorityEnd = Math.min(priorityBatch, totalFrames);
      await loadFramesBatched(0, priorityEnd, priorityEnd);

      // Force render frame 0 as soon as priority batch is done
      lastRenderedFrame = -1;

      // Phase 2: Load the remaining frames in small batches in the background
      await loadFramesBatched(priorityEnd, totalFrames, BATCH_SIZE);
    };

    startLoading();

    // Set up a GSAP ScrollTrigger timeline to scrub the frames with easing
    const scrollTarget = document.querySelector('.app__content');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollTarget || document.documentElement,
        start: () => window.innerWidth < 768 ? 'top 20%' : 'top 80%', // Start later on mobile, early on desktop
        end: 'bottom bottom', // Run animation all the way to the bottom of the page
        scrub: 1.5, // Catch up over 1.5 seconds for a smoother glide
        onEnter: () => {
          autoplayActive = true;
          lastTime = performance.now();
        },
        onLeaveBack: () => {
          // Reset when scrolling back above the trigger (to the Hero)
          autoplayActive = false;
          autoplayFrame = 0;
          animState.frame = 0;
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
        }
      }
    });

    tl.to(animState, {
      frame: totalFrames - 1,
      ease: 'none', // Linear frame progression for consistent scroll speed
      duration: 1
    });

    // Handle ResizeObserver for dynamic heights (debounced)
    let resizeObserver;
    let resizeTimeout;
    if (scrollTarget && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 200);
      });
      resizeObserver.observe(scrollTarget);
    }

    // Cleanup
    return () => {
      tl.kill();
      tickActive = false; // Stop the animation loop
      clearTimeout(resizeTimeout);
      if (resizeObserver && scrollTarget) {
        resizeObserver.unobserve(scrollTarget);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
