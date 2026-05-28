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
    const folderName = isMobile ? 'huhmobile' : 'huh';
    const totalFrames = 209;

    const supportsImageBitmap = typeof createImageBitmap === 'function';

    // Store decoded frames — ImageBitmap (Chrome/FF) or HTMLImageElement (Safari)
    const frames = new Array(totalFrames);
    let canvasReady = false;
    let isDestroyed = false;

    // Cap canvas to viewport × DPR for performance (no need for raw 4K)
    const setupCanvasSize = (srcWidth, srcHeight) => {
      if (canvasReady) return;
      // Cap DPR to 1 on mobile to save pixel processing power (huge GPU boost)
      const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      const screenW = window.innerWidth * dpr;
      const screenH = window.innerHeight * dpr;

      const srcAspect = srcWidth / srcHeight;
      const screenAspect = screenW / screenH;
      let drawW, drawH;

      if (srcAspect > screenAspect) {
        drawH = Math.min(srcHeight, screenH);
        drawW = drawH * srcAspect;
      } else {
        drawW = Math.min(srcWidth, screenW);
        drawH = drawW / srcAspect;
      }

      canvas.width = Math.round(drawW);
      canvas.height = Math.round(drawH);
      canvasReady = true;
    };

    const getFrameUrl = (index) => {
      const frameNum = String(index + 1).padStart(3, '0');
      return `${import.meta.env.BASE_URL}${folderName}/ezgif-frame-${frameNum}.jpg`;
    };

    // Darken via canvas compositing (NOT CSS filter — that kills perf)
    const DARKEN_ALPHA = isMobile ? 0.40 : 0.30;

    const getNearestLoadedFrame = (index) => {
      if (frames[index]) return frames[index];
      for (let offset = 1; offset < totalFrames; offset++) {
        const before = index - offset;
        const after = index + offset;
        if (before >= 0 && frames[before]) return frames[before];
        if (after < totalFrames && frames[after]) return frames[after];
        if (before < 0 && after >= totalFrames) break;
      }
      return null;
    };

    // Draw with crossfade blending between adjacent frames (desktop) or snap to nearest frame (mobile).
    // Accepts a fractional frame index (e.g. 34.7).
    const drawFrame = (fractionalIndex) => {
      if (isMobile) {
        // Mobile Optimization: snap to nearest frame and skip crossfade logic (cuts draw calls in half)
        const frameIdx = Math.max(0, Math.min(totalFrames - 1, Math.round(fractionalIndex)));
        const img = frames[frameIdx] || getNearestLoadedFrame(frameIdx);
        if (!img) return;

        const w = img.width || img.naturalWidth;
        const h = img.height || img.naturalHeight;
        if (!w || !h) return;
        setupCanvasSize(w, h);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        const floorIdx = Math.max(0, Math.min(totalFrames - 1, Math.floor(fractionalIndex)));
        const ceilIdx = Math.min(totalFrames - 1, floorIdx + 1);
        const blend = fractionalIndex - floorIdx; // 0..1 blend factor

        const imgA = frames[floorIdx];
        const imgB = frames[ceilIdx];

        // Need at least one frame to draw. Fallback to nearest loaded if both are missing.
        if (!imgA && !imgB) {
          const fallback = getNearestLoadedFrame(floorIdx);
          if (!fallback) return;
          
          const w = fallback.width || fallback.naturalWidth;
          const h = fallback.height || fallback.naturalHeight;
          if (!w || !h) return;
          setupCanvasSize(w, h);
          
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.drawImage(fallback, 0, 0, canvas.width, canvas.height);
        } else {
          const primary = imgA || imgB;
          const w = primary.width || primary.naturalWidth;
          const h = primary.height || primary.naturalHeight;
          if (!w || !h) return;
          setupCanvasSize(w, h);

          ctx.globalCompositeOperation = 'source-over';

          // 1. Draw base frame (frame A) at full opacity
          if (imgA) {
            ctx.globalAlpha = 1;
            ctx.drawImage(imgA, 0, 0, canvas.width, canvas.height);
          }

          // 2. Crossfade: overlay frame B with blend opacity
          if (imgB && imgA !== imgB && blend > 0.01) {
            ctx.globalAlpha = imgA ? blend : 1;
            ctx.drawImage(imgB, 0, 0, canvas.width, canvas.height);
          } else if (!imgA && imgB) {
            ctx.globalAlpha = 1;
            ctx.drawImage(imgB, 0, 0, canvas.width, canvas.height);
          }
        }
      }

      // 3. Darken overlay (replaces CSS filter: brightness)
      ctx.globalAlpha = DARKEN_ALPHA;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Reset composite state
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };

    const triggerRedrawIfRelevant = (index) => {
      const floorIdx = Math.floor(currentFrame);
      const ceilIdx = Math.ceil(currentFrame);
      if (index === floorIdx || index === ceilIdx) {
        drawFrame(currentFrame);
      }
    };

    // Image loading with off-thread decode where possible
    const loadImage = (index) => {
      if (frames[index]) return Promise.resolve(frames[index]);

      return new Promise((resolve) => {
        if (supportsImageBitmap) {
          fetch(getFrameUrl(index))
            .then(r => r.blob())
            .then(blob => createImageBitmap(blob))
            .then(bitmap => {
              if (isDestroyed) { bitmap.close(); return resolve(null); }
              frames[index] = bitmap;
              triggerRedrawIfRelevant(index);
              resolve(bitmap);
            })
            .catch(() => resolve(null));
        } else {
          const img = new Image();
          img.src = getFrameUrl(index);
          const onReady = () => {
            if (isDestroyed) return resolve(null);
            frames[index] = img;
            triggerRedrawIfRelevant(index);
            resolve(img);
          };
          if (img.decode) {
            img.decode().then(onReady).catch(() => resolve(null));
          } else {
            img.onload = onReady;
            img.onerror = () => resolve(null);
          }
        }
      });
    };

    let scrollTargetFrame = 0;
    let targetFrame = 0;
    let currentFrame = 0;
    let lastDrawnFrame = -1;

    // Track GSAP instances for cleanup
    let opacityTween = null;
    let scrollTimeline = null;
    let animationFrameId = null;

    // Start the scroll-driven animation (called only after all frames are loaded)
    const startAnimation = () => {
      if (isDestroyed) return;

      const scrollTarget = document.querySelector('.app__content');

      // Opacity fade-in on scroll
      opacityTween = gsap.to(canvas, {
        scrollTrigger: {
          trigger: scrollTarget || document.documentElement,
          start: () => isMobile ? `top ${document.getElementById('hero')?.offsetHeight || 0}px` : 'top 90%',
          end: () => isMobile ? `top ${(document.getElementById('hero')?.offsetHeight || 0) * 0.2}px` : 'top 20%',
          scrub: true,
        },
        opacity: 1,
        ease: 'power1.inOut'
      });

      let isTicking = false;
      const startTicking = () => {
        if (!isTicking && !isDestroyed) {
          isTicking = true;
          tick();
        }
      };

      // Map scroll progress to frame index
      scrollTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: scrollTarget || document.documentElement,
          start: () => isMobile ? `top ${document.getElementById('hero')?.offsetHeight || 0}px` : 'top bottom',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            scrollTargetFrame = self.progress * (totalFrames - 1);
            startTicking(); // Wake up animation loop on scroll
          }
        }
      });

      // Animation tick with lerp for fluid inertia
      const lerpFactor = 0.07;

      const tick = () => {
        if (isDestroyed) {
          isTicking = false;
          return;
        }

        targetFrame = scrollTargetFrame;
        const diff = targetFrame - currentFrame;

        if (Math.abs(diff) > 0.001) {
          currentFrame += diff * lerpFactor;
          animationFrameId = requestAnimationFrame(tick);
        } else {
          currentFrame = targetFrame;
          isTicking = false; // Stop ticking when we catch up
        }

        // Redraw check: on mobile, snap checks to whole numbers (no sub-frame calculations needed).
        // On desktop, compare with 2 decimal places of precision for smooth blending.
        const quantized = isMobile ? Math.round(currentFrame) : Math.round(currentFrame * 100);
        if (quantized !== lastDrawnFrame) {
          drawFrame(currentFrame);
          lastDrawnFrame = quantized;
        }
      };
    };

    // --- Progressive Preload strategy ---
    // 1. Load frame 0 immediately, draw it, and START animation immediately.
    // 2. Download a sparse pass (every 10th frame) to quickly cover the timeline.
    // 3. Download the remaining frames to fill in all the details.
    // This makes the page interactive immediately, smoothly resolving details in the background.
    const CONCURRENCY = 8; // Concurrency limit for background loading to keep thread clear

    const preloadAllFrames = async () => {
      // Step 1: Load and draw frame 0 immediately
      await loadImage(0);
      if (isDestroyed) return;
      drawFrame(0);
      lastDrawnFrame = 0;

      // Start the animation scroll trigger immediately so scroll feels responsive right away
      startAnimation();

      // Step 2: Sparse pass (every 10th frame) to quickly get coarse frame coverage
      const sparseIndices = [];
      for (let i = 10; i < totalFrames; i += 10) {
        sparseIndices.push(i);
      }
      for (let i = 0; i < sparseIndices.length; i += CONCURRENCY) {
        if (isDestroyed) return;
        await Promise.all(
          sparseIndices.slice(i, i + CONCURRENCY).map(idx => loadImage(idx))
        );
      }

      // Step 3: Fill pass (all other remaining frames)
      const remaining = [];
      for (let i = 1; i < totalFrames; i++) {
        if (i % 10 !== 0) {
          remaining.push(i);
        }
      }
      for (let i = 0; i < remaining.length; i += CONCURRENCY) {
        if (isDestroyed) return;
        await Promise.all(
          remaining.slice(i, i + CONCURRENCY).map(idx => loadImage(idx))
        );
      }
    };

    preloadAllFrames();

    return () => {
      isDestroyed = true;
      if (animationFrameId != null) cancelAnimationFrame(animationFrameId);
      if (opacityTween) {
        if (opacityTween.scrollTrigger) opacityTween.scrollTrigger.kill();
        opacityTween.kill();
      }
      if (scrollTimeline) {
        if (scrollTimeline.scrollTrigger) scrollTimeline.scrollTrigger.kill();
        scrollTimeline.kill();
      }
      ScrollTrigger.getAll().forEach(st => st.kill());
      for (let i = 0; i < frames.length; i++) {
        if (frames[i]) {
          if (frames[i].close) frames[i].close();
          frames[i] = null;
        }
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" style={{ opacity: 0 }} />;
};

export default FrameBackground;
