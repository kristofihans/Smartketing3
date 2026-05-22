import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 241; // frames from BestUltimateFrames folder
const START_FRAME = 1;
const PRIORITY_BATCH = 30; // first N frames to load with high priority
const BATCH_SIZE = 10; // load remaining frames in batches of this size

const FrameBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Enable high-quality image smoothing for smoother frame transitions
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Array to hold the preloaded Image objects
    const images = new Array(TOTAL_FRAMES);

    // Store the current frame index
    const animState = { frame: 0 };
    let renderRequested = false;
    let canvasReady = false;

    // Helper to build frame URL
    const getFrameUrl = (index) => {
      const frameNum = String(START_FRAME + index).padStart(3, '0');
      return `${import.meta.env.BASE_URL}BestUltimateFrames/ezgif-frame-${frameNum}.webp`;
    };

    // --- Prioritized frame loading ---
 
    // Load a single frame and return a promise
    const loadFrame = (index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        images[index] = img; // Assign immediately so it can be drawn if needed
        img.src = getFrameUrl(index);
        
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
      const priorityEnd = Math.min(PRIORITY_BATCH, TOTAL_FRAMES);
      await loadFramesBatched(0, priorityEnd, priorityEnd);
 
      // Render the first frame as soon as priority batch is done
      if (animState.frame === 0) {
        requestRender();
      }
 
      // Phase 2: Load the remaining frames in small batches in the background
      await loadFramesBatched(priorityEnd, TOTAL_FRAMES, BATCH_SIZE);
    };
 
    const renderFrame = () => {
      renderRequested = false;
      const frameFloat = animState.frame;
      const currentFrame = Math.floor(frameFloat);
      const nextFrame = Math.min(TOTAL_FRAMES - 1, currentFrame + 1);
      const progress = frameFloat - currentFrame;

      const img1 = images[currentFrame];
      const img2 = images[nextFrame];

      if (img1 && img1.complete && img1.naturalWidth !== 0) {
        // Set canvas dimensions once to match the image
        if (!canvasReady) {
          canvas.width = img1.width;
          canvas.height = img1.height;
          canvasReady = true;
        }

        // Draw the base frame
        ctx.drawImage(img1, 0, 0);

        // Blend the next frame if progress is significant and the image is ready
        if (progress > 0.01 && img2 && img2.complete && img2.naturalWidth !== 0) {
          ctx.globalAlpha = progress;
          ctx.drawImage(img2, 0, 0);
          ctx.globalAlpha = 1.0; // Reset alpha
        }

        // Apply a smooth dark overlay near the end to transition to black
        const fadeStartFrame = TOTAL_FRAMES - 20;
        if (frameFloat >= fadeStartFrame) {
          const fadeProgress = Math.min(1, (frameFloat - fadeStartFrame) / 20);
          ctx.fillStyle = `rgba(0, 0, 0, ${fadeProgress * 0.7})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
 
    const requestRender = () => {
      if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(renderFrame);
      }
    };

    startLoading();
 
    // Set up a GSAP ScrollTrigger timeline to scrub the frames with easing
    const scrollTarget = document.querySelector('.app__content');
 
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.0, // Catch up over 1 second for a smooth glide
      }
    });
 
    tl.to(animState, {
      frame: TOTAL_FRAMES - 1,
      ease: 'none', // Linear mapping aligns perfectly with scroll speed
      duration: 1,
      onUpdate: () => {
        requestRender();
      }
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
      clearTimeout(resizeTimeout);
      if (resizeObserver && scrollTarget) {
        resizeObserver.unobserve(scrollTarget);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
