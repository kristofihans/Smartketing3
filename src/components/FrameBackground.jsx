import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);

const FrameBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const folderName = isMobile ? 'Donemobile' : 'Donedesktop';
    const ext = 'webp';
    const totalFrames = 240;

    const images = new Array(totalFrames);
    const animState = { frame: 0 };
    let canvasReady = false;
    let isDestroyed = false;

    const getFrameUrl = (index) => {
      const frameNum = String(1 + index).padStart(3, '0');
      return `${import.meta.env.BASE_URL}${folderName}/ezgif-frame-${frameNum}.${ext}`;
    };

    // Render a single frame to canvas
    const drawFrame = (frameIndex) => {
      const img = images[frameIndex];
      if (img && img.complete && img.naturalWidth !== 0) {
        if (!canvasReady) {
          canvas.width = img.width;
          canvas.height = img.height;
          canvasReady = true;
        }
        ctx.drawImage(img, 0, 0);
      }
    };

    // Preload all images simply
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        if (i === 0 && animState.frame === 0) {
          drawFrame(0);
        }
      };
      images[i] = img;
    }

    const scrollTarget = document.querySelector('.app__content');
    let scrollTargetFrame = 0;
    let targetFrame = 0;
    let currentFrame = 0;
    let lastScrollTargetFrame = 0;
    const baseCatchupSpeed = 2.0; // Max frames to advance/reverse per render tick
    const baseIdleSpeed = 0.35;    // Base autoplay speed when user is stationary

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollTarget || document.documentElement,
        start: () => window.innerWidth < 768 ? 'top 20%' : 'top 80%',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          // Sync target frame to scroll progress
          scrollTargetFrame = self.progress * (totalFrames - 1);
        }
      }
    });

    tl.to(animState, {
      frame: totalFrames - 1,
      ease: 'none',
      duration: 1
    });

    // Custom animation tick loop for constant-speed bidirectional catchup + idle autoplay + acceleration
    let animationFrameId;
    const tick = () => {
      if (isDestroyed) return;

      // Calculate speed multiplier that scales up as the animation nears the end
      // Starts accelerating after 60% of the animation (frame 144)
      const accelerationStartFrame = totalFrames * 0.6;
      let speedMultiplier = 1.0;
      if (currentFrame > accelerationStartFrame) {
        const ratio = (currentFrame - accelerationStartFrame) / (totalFrames - 1 - accelerationStartFrame);
        speedMultiplier = 1.0 + ratio * 1.5; // Scales from 1.0 up to 2.5 at the end
      }

      const activeCatchupSpeed = baseCatchupSpeed * speedMultiplier;
      const activeIdleSpeed = baseIdleSpeed * speedMultiplier;

      // Check if user is actively scrolling
      const didScroll = scrollTargetFrame !== lastScrollTargetFrame;
      lastScrollTargetFrame = scrollTargetFrame;

      if (didScroll) {
        targetFrame = scrollTargetFrame;
      } else {
        // Idle autoplay forward
        if (targetFrame < totalFrames - 1) {
          targetFrame = Math.min(totalFrames - 1, targetFrame + activeIdleSpeed);
        }
      }

      // Smooth catchup (works both forward and backward)
      if (Math.abs(currentFrame - targetFrame) > 0.05) {
        const diff = targetFrame - currentFrame;
        const step = Math.sign(diff) * Math.min(activeCatchupSpeed, Math.abs(diff));
        currentFrame += step;
      } else {
        currentFrame = targetFrame;
      }

      drawFrame(Math.round(currentFrame));

      animationFrameId = requestAnimationFrame(tick);
    };
    animationFrameId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
      tl.kill();
      for (let i = 0; i < images.length; i++) {
        if (images[i]) {
          images[i].onload = null;
          images[i].src = '';
          images[i] = null;
        }
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
