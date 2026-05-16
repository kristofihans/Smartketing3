import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 235;
const START_FRAME = 6;

const FrameBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Array to hold the preloaded Image objects
    const images = [];
    let loadedCount = 0;

    // We'll store the current frame index here
    const animState = { frame: 0 };

    // Function to render the current frame
    const renderFrame = () => {
      const img = images[animState.frame];
      if (img && img.complete && img.naturalWidth !== 0) {
        // Set canvas internal resolution to match the image exactly
        if (canvas.width !== img.width || canvas.height !== img.height) {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };

    // Preload all frames
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      // Format: ezgif-frame-006.webp to 240.webp
      const frameNum = String(START_FRAME + i).padStart(3, '0');
      img.src = `frames/ezgif-frame-${frameNum}.webp`;

      img.onload = () => {
        loadedCount++;
        // As soon as the first frame loads, render it initially
        if (i === 0) {
          renderFrame();
        }
      };

      images.push(img);
    }

    // Set up GSAP ScrollTrigger
    // We target `.app__content` so the animation only scrubs while scrolling through that section
    const scrollTarget = document.querySelector('.app__content');
    
    const trigger = ScrollTrigger.create({
      trigger: scrollTarget,
      start: 'top bottom', // Start animating when app__content enters the viewport from bottom
      end: 'bottom bottom',   // End when the bottom of app__content reaches the bottom of viewport
      scrub: 0.5, // Adding a tiny bit of smoothing to the scrub for extreme smoothness without lag
      onUpdate: (self) => {
        // Calculate which frame we should be on based on scroll progress
        const nextFrame = Math.min(
          TOTAL_FRAMES - 1,
          Math.floor(self.progress * TOTAL_FRAMES)
        );
        
        // Update state and request a render
        if (animState.frame !== nextFrame) {
          animState.frame = nextFrame;
          requestAnimationFrame(renderFrame);
        }
      },
    });

    // Cleanup
    return () => {
      trigger.kill();
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
