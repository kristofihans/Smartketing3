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

    // Helper to build frame URL
    const getFrameUrl = (index) => {
      const frameNum = String(startFrame + (index * frameStep)).padStart(3, '0');
      return `${import.meta.env.BASE_URL}${folderName}/ezgif-frame-${frameNum}.${ext}`;
    };

    // Function to render the current frame. Returns true if successfully drawn.
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
        return true;
      }
      return false;
    };

    // Load a single frame and return a promise
    const loadFrame = (index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = getFrameUrl(index);
        
        const tryRender = () => {
          const currentFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(animState.frame)));
          if (currentFrame === index && lastRenderedFrame !== index) {
            if (renderFrame(index)) {
              lastRenderedFrame = index;
            }
          }
        };

        // Force asynchronous image decoding in the background before drawing it
        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode()
              .then(() => {
                tryRender();
                resolve();
              })
              .catch(() => {
                tryRender();
                resolve();
              });
          } else {
            tryRender();
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

      // Force render active frame as soon as priority batch is done
      lastRenderedFrame = -1;
      const currentFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(animState.frame)));
      if (renderFrame(currentFrame)) {
        lastRenderedFrame = currentFrame;
      }

      // Phase 2: Load the remaining frames in small batches in the background
      await loadFramesBatched(priorityEnd, totalFrames, BATCH_SIZE);
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
        onUpdate: () => {
          const currentFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(animState.frame)));
          if (lastRenderedFrame !== currentFrame) {
            if (renderFrame(currentFrame)) {
              lastRenderedFrame = currentFrame;
            }
          }
        }
      }
    });

    tl.to(animState, {
      frame: totalFrames - 1,
      ease: 'none', // Linear frame progression for consistent scroll speed
      duration: 1
    });

    // --- Dynamic 3D Parallax Layering (Option 2 & 4) ---
    const parallaxTweens = [];
    const sections = gsap.utils.toArray('.portfolio-section, .services, .outro');

    sections.forEach((section) => {
      // 1. Parallax for Section Headers
      const header = section.querySelector('.section-header, .services__header');
      if (header) {
        const tween = gsap.fromTo(header, 
          { y: 40 },
          {
            y: -40,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2
            }
          }
        );
        parallaxTweens.push(tween);
      }

      // 2. Parallax and Scale for Media Visual elements
      const media = section.querySelector('.feature-media, .services__grid, .contact__container');
      if (media) {
        const tween = gsap.fromTo(media,
          { y: 80, scale: 0.96 },
          {
            y: -80,
            scale: 1.02,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5
            }
          }
        );
        parallaxTweens.push(tween);
      }
    });

    // Cleanup
    return () => {
      tl.kill();
      if (opacityTween) {
        if (opacityTween.scrollTrigger) opacityTween.scrollTrigger.kill();
        opacityTween.kill();
      }
      // Clean up parallax tweens
      parallaxTweens.forEach((tween) => {
        if (tween.scrollTrigger) tween.scrollTrigger.kill();
        tween.kill();
      });

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
