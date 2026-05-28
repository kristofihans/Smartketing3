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
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    const DARKEN_ALPHA = 0.55;

    // --- Film grain system ---
    // Pre-generate a small noise texture on an offscreen canvas, then tile it
    // over the main canvas with 'overlay' blend mode. Regenerated periodically
    // for a living, cinematic grain effect.
    const GRAIN_SIZE = 256; // Small texture, tiled across the canvas
    const GRAIN_OPACITY = 0.06; // Subtle — cinematic, not distracting
    const GRAIN_REFRESH_MS = 80; // Refresh grain pattern every ~80ms

    const grainCanvas = document.createElement('canvas');
    grainCanvas.width = GRAIN_SIZE;
    grainCanvas.height = GRAIN_SIZE;
    const grainCtx = grainCanvas.getContext('2d', { alpha: true });

    const generateGrain = () => {
      const imageData = grainCtx.createImageData(GRAIN_SIZE, GRAIN_SIZE);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;       // R
        data[i + 1] = v;   // G
        data[i + 2] = v;   // B
        data[i + 3] = 255; // A
      }
      grainCtx.putImageData(imageData, 0, 0);
    };

    // Generate initial grain
    generateGrain();

    // Refresh grain on an interval for the "living" effect
    let grainDirty = false;
    let grainIntervalId = setInterval(() => {
      if (!isDestroyed) {
        generateGrain();
        grainDirty = true; // Signal the tick loop to redraw
      }
    }, GRAIN_REFRESH_MS);

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

    // Draw with crossfade blending between adjacent frames.
    // Accepts a fractional frame index (e.g. 34.7 → blend frame 34 & 35).
    const drawFrame = (fractionalIndex) => {
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
        //    When blend = 0 → pure frame A, blend = 1 → pure frame B
        if (imgB && imgA !== imgB && blend > 0.01) {
          ctx.globalAlpha = imgA ? blend : 1;
          ctx.drawImage(imgB, 0, 0, canvas.width, canvas.height);
        } else if (!imgA && imgB) {
          ctx.globalAlpha = 1;
          ctx.drawImage(imgB, 0, 0, canvas.width, canvas.height);
        }
      }

      // 3. Darken overlay (replaces CSS filter: brightness)
      ctx.globalAlpha = DARKEN_ALPHA;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. Film grain overlay — tile the small noise texture across the canvas
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = GRAIN_OPACITY;
      for (let gx = 0; gx < canvas.width; gx += GRAIN_SIZE) {
        for (let gy = 0; gy < canvas.height; gy += GRAIN_SIZE) {
          ctx.drawImage(grainCanvas, gx, gy);
        }
      }

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
          start: isMobile ? 'top 30%' : 'top bottom',
          end: isMobile ? 'top -10%' : 'top top',
          scrub: true,
        },
        opacity: 1,
        ease: 'power1.inOut'
      });

      // Map scroll progress to frame index
      scrollTimeline = gsap.timeline({
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

      // Animation tick with lerp for fluid inertia
      const lerpFactor = 0.07;

      const tick = () => {
        if (isDestroyed) return;

        targetFrame = scrollTargetFrame;
        const diff = targetFrame - currentFrame;

        if (Math.abs(diff) > 0.001) {
          currentFrame += diff * lerpFactor;
        } else {
          currentFrame = targetFrame;
        }

        // Redraw whenever the fractional position changes enough to be
        // visible (sub-frame blending) OR when grain texture has refreshed.
        // We compare with 2 decimal places of precision for smooth blending.
        const quantized = Math.round(currentFrame * 100);
        if (quantized !== lastDrawnFrame || grainDirty) {
          drawFrame(currentFrame);
          lastDrawnFrame = quantized;
          grainDirty = false;
        }

        animationFrameId = requestAnimationFrame(tick);
      };

      animationFrameId = requestAnimationFrame(tick);
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
      clearInterval(grainIntervalId);
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

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
