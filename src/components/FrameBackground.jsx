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
    const folderName = isMobile ? 'trymobile' : 'try';
    const totalFrames = isMobile ? 193 : 192;

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

    const drawFrame = (frameIndex) => {
      let img = frames[frameIndex];

      // Bidirectional expanding search for nearest loaded frame
      if (!img) {
        for (let offset = 1; offset < totalFrames; offset++) {
          const before = frameIndex - offset;
          const after = frameIndex + offset;
          if (before >= 0 && frames[before]) { img = frames[before]; break; }
          if (after < totalFrames && frames[after]) { img = frames[after]; break; }
          if (before < 0 && after >= totalFrames) break;
        }
      }

      if (!img) return;

      const w = img.width || img.naturalWidth;
      const h = img.height || img.naturalHeight;
      if (!w || !h) return;

      setupCanvasSize(w, h);

      ctx.globalAlpha = 1;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Darken overlay replaces CSS filter: brightness()
      ctx.globalAlpha = DARKEN_ALPHA;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
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
              if (Math.round(currentFrame) === index) drawFrame(index);
              resolve(bitmap);
            })
            .catch(() => resolve(null));
        } else {
          const img = new Image();
          img.src = getFrameUrl(index);
          const onReady = () => {
            if (isDestroyed) return resolve(null);
            frames[index] = img;
            if (Math.round(currentFrame) === index) drawFrame(index);
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

    // Progressive loading: first frame → sparse → fill
    const loadProgressively = async () => {
      await loadImage(0);
      drawFrame(0);
      lastDrawnFrame = 0;

      if (isDestroyed) return;

      // Sparse pass: every 10th frame for quick timeline coverage
      const sparseIndices = [];
      for (let i = 10; i < totalFrames; i += 10) sparseIndices.push(i);

      for (let i = 0; i < sparseIndices.length; i += 6) {
        if (isDestroyed) return;
        await Promise.all(sparseIndices.slice(i, i + 6).map(idx => loadImage(idx)));
      }

      if (isDestroyed) return;

      // Fill pass: all remaining frames
      const remaining = [];
      for (let i = 0; i < totalFrames; i++) {
        if (i % 10 !== 0) remaining.push(i);
      }

      for (let i = 0; i < remaining.length; i += 8) {
        if (isDestroyed) return;
        await Promise.all(remaining.slice(i, i + 8).map(idx => loadImage(idx)));
        await new Promise(r => setTimeout(r, 30));
      }
    };

    loadProgressively();

    const scrollTarget = document.querySelector('.app__content');

    // Opacity fade-in on scroll
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

    // Map scroll progress to frame index
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

    // Animation tick with lerp for fluid inertia
    let animationFrameId;
    const lerpFactor = 0.07;

    const tick = () => {
      if (isDestroyed) return;

      targetFrame = scrollTargetFrame;
      const diff = targetFrame - currentFrame;

      if (Math.abs(diff) > 0.01) {
        currentFrame += diff * lerpFactor;
      } else {
        currentFrame = targetFrame;
      }

      // Only redraw when the frame actually changes
      const roundedFrame = Math.round(currentFrame);
      if (roundedFrame !== lastDrawnFrame) {
        drawFrame(roundedFrame);
        lastDrawnFrame = roundedFrame;
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

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
          if (frames[i].close) frames[i].close();
          frames[i] = null;
        }
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
