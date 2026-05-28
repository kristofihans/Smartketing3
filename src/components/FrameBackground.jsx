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
    const folderName = isMobile ? 'namobile' : 'na';
    const totalFrames = isMobile ? 299 : 566;

    const images = new Array(totalFrames);
    let canvasReady = false;
    let isDestroyed = false;

    const getFrameUrl = (index) => {
      const frameOffset = isMobile ? 71 : 1;
      const frameNum = String(frameOffset + index).padStart(5, '0');
      return `${import.meta.env.BASE_URL}${folderName}/scene${frameNum}.webp`;
    };

    // Render a single frame to canvas
    const drawFrame = (frameIndex) => {
      let img = images[frameIndex];
      
      // If the target frame is not loaded, find the nearest loaded frame
      if (!img || !img.complete || img.naturalWidth === 0) {
        let nearestIndex = -1;
        let minDiff = Infinity;
        for (let i = 0; i < totalFrames; i++) {
          if (images[i] && images[i].complete && images[i].naturalWidth !== 0) {
            const diff = Math.abs(i - frameIndex);
            if (diff < minDiff) {
              minDiff = diff;
              nearestIndex = i;
            }
          }
        }
        if (nearestIndex !== -1) {
          img = images[nearestIndex];
        }
      }

      if (img && img.complete && img.naturalWidth !== 0) {
        if (!canvasReady) {
          canvas.width = img.width;
          canvas.height = img.height;
          canvasReady = true;
        }
        ctx.drawImage(img, 0, 0);
      }
    };

    // Helper to load a single image
    const loadImage = (index) => {
      if (images[index]) return Promise.resolve(images[index]);
      
      return new Promise((resolve) => {
        const img = new Image();
        img.src = getFrameUrl(index);
        img.onload = () => {
          images[index] = img;
          if (Math.round(currentFrame) === index) {
            drawFrame(index);
          }
          resolve(img);
        };
        img.onerror = () => {
          resolve(null);
        };
      });
    };

    let scrollTargetFrame = 0;
    let targetFrame = 0;
    let currentFrame = 0;

    // Progressive loading sequence
    const loadProgressively = async () => {
      // 1. Load frame 0 immediately and draw it
      await loadImage(0);
      drawFrame(0);

      if (isDestroyed) return;

      // 2. Load sparse frames (every 10th frame) to build quick timeline coverage
      const sparseIndices = [];
      for (let i = 0; i < totalFrames; i += 10) {
        if (i !== 0) sparseIndices.push(i);
      }
      
      const sparseChunkSize = 10;
      for (let i = 0; i < sparseIndices.length; i += sparseChunkSize) {
        if (isDestroyed) return;
        const chunk = sparseIndices.slice(i, i + sparseChunkSize);
        await Promise.all(chunk.map(idx => loadImage(idx)));
      }

      if (isDestroyed) return;

      // 3. Load all other frames sequentially in the background in slightly larger chunks
      const remainingIndices = [];
      for (let i = 0; i < totalFrames; i++) {
        if (i % 10 !== 0) {
          remainingIndices.push(i);
        }
      }

      const fillChunkSize = 15;
      for (let i = 0; i < remainingIndices.length; i += fillChunkSize) {
        if (isDestroyed) return;
        const chunk = remainingIndices.slice(i, i + fillChunkSize);
        await Promise.all(chunk.map(idx => loadImage(idx)));
        // Brief pause to prevent freezing the network loop
        await new Promise(r => setTimeout(r, 25));
      }
    };

    loadProgressively();

    const scrollTarget = document.querySelector('.app__content');

    // Smooth opacity fade-in as we scroll past the Hero section (delayed on mobile)
    const opacityTween = gsap.to(canvas, {
      scrollTrigger: {
        trigger: scrollTarget || document.documentElement,
        start: isMobile ? 'top 30%' : 'top bottom',
        end: isMobile ? 'top -10%' : 'top top',
        scrub: true,
      },
      opacity: 1,
      ease: 'power1.inOut'
    });

    // Timeline to map progress
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollTarget || document.documentElement,
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          scrollTargetFrame = self.progress * (totalFrames - 1);
        }
      }
    });

    // Custom animation tick loop with fluid linear interpolation (lerp) for inertia
    let animationFrameId;
    const tick = () => {
      if (isDestroyed) return;

      targetFrame = scrollTargetFrame;

      // Fluid lerping catchup (inertia/damping effect)
      const lerpFactor = 0.07; // 0.07 gives a beautifully smooth, fluid lag/inertia
      const diff = targetFrame - currentFrame;
      
      if (Math.abs(diff) > 0.01) {
        currentFrame += diff * lerpFactor;
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
      if (opacityTween) {
        if (opacityTween.scrollTrigger) opacityTween.scrollTrigger.kill();
        opacityTween.kill();
      }
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
