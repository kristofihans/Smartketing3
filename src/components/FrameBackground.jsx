import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 240; // frames from ultimate folder
const START_FRAME = 1;

const FrameBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Array to hold the preloaded Image objects
    const images = [];

    // Store the current frame index
    const animState = { frame: 0 };
    let renderRequested = false;

    // Function to render the current frame
    const renderFrame = () => {
      renderRequested = false;
      const img = images[animState.frame];
      if (img && img.complete && img.naturalWidth !== 0) {
        // Match canvas internal resolution to the image
        if (canvas.width !== img.width || canvas.height !== img.height) {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Frame index 218 corresponds to ezgif-frame-219.jpg
        // Apply a smooth dark overlay from this frame onwards to transition to black
        if (animState.frame >= 218) {
          // Fade to 70% opacity over 20 frames for a smooth transition, avoiding an abrupt flicker
          const fadeProgress = Math.min(1, (animState.frame - 218) / 20);
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

    // Preload all frames from animationframes folder
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(START_FRAME + i).padStart(3, '0');
      img.src = `${import.meta.env.BASE_URL}ultimate/ezgif-frame-${frameNum}.jpg`;

      img.onload = () => {
        // As soon as the first frame loads, render it initially
        if (i === 0 && animState.frame === 0) {
          requestRender();
        }
      };

      images.push(img);
    }

    // Set up a single GSAP ScrollTrigger across the entire app__content
    const scrollTarget = document.querySelector('.app__content');
    
    const trigger = ScrollTrigger.create({
      trigger: scrollTarget,
      start: 'top top', // Start scrubbing when app__content reaches the top of the viewport
      end: 'bottom bottom',   // End when the bottom of app__content reaches bottom of viewport
      scrub: 0.5,
      onUpdate: (self) => {
        const nextFrame = Math.min(
          TOTAL_FRAMES - 1,
          Math.floor(self.progress * TOTAL_FRAMES)
        );
        
        if (animState.frame !== nextFrame) {
          animState.frame = nextFrame;
          requestRender();
        }
      },
    });

    // Handle ResizeObserver for dynamic heights
    let resizeObserver;
    if (scrollTarget && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });
      resizeObserver.observe(scrollTarget);
    }

    // Cleanup
    return () => {
      trigger.kill();
      if (resizeObserver && scrollTarget) {
        resizeObserver.unobserve(scrollTarget);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
