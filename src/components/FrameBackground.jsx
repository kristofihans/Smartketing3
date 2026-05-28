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

    // Use ImageBitmap when available (Chrome/FF) for off-thread decoding;
    // Safari doesn't support createImageBitmap from blob well, so fall back.
    const supportsImageBitmap = typeof createImageBitmap === 'function';

    // Store decoded frames — either ImageBitmap or HTMLImageElement
    const frames = new Array(totalFrames);
    let canvasReady = false;
    let isDestroyed = false;

    // --- Canvas sizing: cap to screen resolution × DPR for performance ---
    const setupCanvasSize = (srcWidth, srcHeight) => {
      if (canvasReady) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2×
      const screenW = window.innerWidth * dpr;
      const screenH = window.innerHeight * dpr;

      // Scale to cover the viewport while preserving aspect ratio
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
      const frameOffset = isMobile ? 71 : 1;
      const frameNum = String(frameOffset + index).padStart(5, '0');
      return `${import.meta.env.BASE_URL}${folderName}/scene${frameNum}.webp`;
    };

    // --- Brightness darkening via canvas compositing instead of CSS filter ---
    // CSS `filter: brightness(0.45)` on a canvas that repaints every frame is
    // extremely expensive. Instead we draw the image, then overlay a semi-transparent
    // black rectangle to darken it. This is done entirely on the GPU-backed canvas
    // and avoids the per-frame CSS filter recalculation.
    const DARKEN_ALPHA = 0.55; // 1 - 0.45 brightness

    // Render a single frame to canvas
    const drawFrame = (frameIndex) => {
      let img = frames[frameIndex];

      // If the target frame is not loaded, find the nearest loaded frame.
      // Use a bidirectional expanding search instead of scanning all frames.
      if (!img) {
        for (let offset = 1; offset < totalFrames; offset++) {
          const before = frameIndex - offset;
          const after = frameIndex + offset;
          if (before >= 0 && frames[before]) { img = frames[before]; break; }
          if (after < totalFrames && frames[after]) { img = frames[after]; break; }
          if (before < 0 && after >= totalFrames) break; // no more to check
        }
      }

      if (!img) return;

      // Determine source dimensions (works for both ImageBitmap and HTMLImageElement)
      const w = img.width || img.naturalWidth;
      const h = img.height || img.naturalHeight;
      if (!w || !h) return;

      setupCanvasSize(w, h);

      // Draw the frame
      ctx.globalAlpha = 1;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Darken overlay (replaces CSS filter: brightness)
      ctx.globalAlpha = DARKEN_ALPHA;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    };

    // --- Image loading with off-thread decode ---
    const loadImage = (index) => {
      if (frames[index]) return Promise.resolve(frames[index]);

      return new Promise((resolve) => {
        if (supportsImageBitmap) {
          // Fetch + createImageBitmap decodes off the main thread
          fetch(getFrameUrl(index))
            .then(r => r.blob())
            .then(blob => createImageBitmap(blob))
            .then(bitmap => {
              if (isDestroyed) { bitmap.close(); return resolve(null); }
              frames[index] = bitmap;
              // If this frame is the one we're currently displaying, redraw
              if (Math.round(currentFrame) === index) {
                drawFrame(index);
              }
              resolve(bitmap);
            })
            .catch(() => resolve(null));
        } else {
          // Fallback for Safari: use Image with decode()
          const img = new Image();
          img.src = getFrameUrl(index);
          const onReady = () => {
            if (isDestroyed) return resolve(null);
            frames[index] = img;
            if (Math.round(currentFrame) === index) {
              drawFrame(index);
            }
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
    let lastDrawnFrame = -1; // Track to avoid redundant draws

    // --- Progressive loading sequence ---
    const loadProgressively = async () => {
      // 1. Load frame 0 immediately and draw it
      await loadImage(0);
      drawFrame(0);
      lastDrawnFrame = 0;

      if (isDestroyed) return;

      // 2. Load sparse frames (every 10th) for quick timeline coverage
      const sparseIndices = [];
      for (let i = 10; i < totalFrames; i += 10) {
        sparseIndices.push(i);
      }

      // Load in small chunks to avoid network contention
      const sparseChunkSize = 6;
      for (let i = 0; i < sparseIndices.length; i += sparseChunkSize) {
        if (isDestroyed) return;
        const chunk = sparseIndices.slice(i, i + sparseChunkSize);
        await Promise.all(chunk.map(idx => loadImage(idx)));
      }

      if (isDestroyed) return;

      // 3. Fill in remaining frames in small chunks with micro-pauses
      const remainingIndices = [];
      for (let i = 0; i < totalFrames; i++) {
        if (i % 10 !== 0) {
          remainingIndices.push(i);
        }
      }

      const fillChunkSize = 8;
      for (let i = 0; i < remainingIndices.length; i += fillChunkSize) {
        if (isDestroyed) return;
        const chunk = remainingIndices.slice(i, i + fillChunkSize);
        await Promise.all(chunk.map(idx => loadImage(idx)));
        // Yield to main thread briefly between chunks
        await new Promise(r => setTimeout(r, 30));
      }
    };

    loadProgressively();

    const scrollTarget = document.querySelector('.app__content');

    // Smooth opacity fade-in as we scroll past the Hero section
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

    // Timeline to map scroll progress to frame index
    gsap.timeline({
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

    // --- Animation tick loop with lerp for fluid inertia ---
    let animationFrameId;
    const lerpFactor = 0.07;

    const tick = () => {
      if (isDestroyed) return;

      targetFrame = scrollTargetFrame;

      // Fluid lerp catchup (inertia/damping)
      const diff = targetFrame - currentFrame;

      if (Math.abs(diff) > 0.01) {
        currentFrame += diff * lerpFactor;
      } else {
        currentFrame = targetFrame;
      }

      // Only redraw when the rounded frame index actually changes
      const roundedFrame = Math.round(currentFrame);
      if (roundedFrame !== lastDrawnFrame) {
        drawFrame(roundedFrame);
        lastDrawnFrame = roundedFrame;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    // Cleanup
    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
      if (opacityTween) {
        if (opacityTween.scrollTrigger) opacityTween.scrollTrigger.kill();
        opacityTween.kill();
      }
      ScrollTrigger.getAll().forEach(st => st.kill());
      for (let i = 0; i < frames.length; i++) {
        if (frames[i]) {
          // ImageBitmap has .close(), HTMLImageElement doesn't
          if (frames[i].close) frames[i].close();
          frames[i] = null;
        }
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
