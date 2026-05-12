import { useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';
import './FrameAnimation.css';

const FrameAnimation = ({ children }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const ctxRef = useRef(null);
  const lastDrawnRef = useRef(-1); // Track last drawn fractional value
  const rafIdRef = useRef(null);
  const pendingValueRef = useRef(null);
  const frameCount = 236;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["-100vh start", "end end"]
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, frameCount]);

  // Preload all images eagerly with decode
  useEffect(() => {
    const imgs = [];
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameNum = String(i + 5).padStart(3, '0');
      img.src = `frames/ezgif-frame-${frameNum}.jpg`;
      img.decoding = 'async';
      imgs[i] = img;
    }
    imagesRef.current = imgs;

    // Pre-decode first batch for instant start
    const preDecodeCount = Math.min(40, frameCount);
    for (let i = 1; i <= preDecodeCount; i++) {
      if (imgs[i].decode) {
        imgs[i].decode().catch(() => {});
      }
    }
  }, []);

  // Cover-fit helper: computes draw params for an image on canvas
  const getCoverParams = (cw, ch, iw, ih) => {
    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    return { x: (cw - w) * 0.5, y: (ch - h) * 0.5, w, h };
  };

  // Draw with interpolation between two adjacent frames
  const drawFrame = (fractionalIndex) => {
    // Skip if value hasn't meaningfully changed (< 0.5% of a frame)
    if (Math.abs(fractionalIndex - lastDrawnRef.current) < 0.005) return;
    lastDrawnRef.current = fractionalIndex;

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    const floorIdx = Math.max(1, Math.min(frameCount, Math.floor(fractionalIndex)));
    const ceilIdx = Math.min(frameCount, floorIdx + 1);
    const t = fractionalIndex - floorIdx; // Fractional part (0-1) between frames

    const imgA = imagesRef.current[floorIdx];
    const imgB = imagesRef.current[ceilIdx];

    // If we can't blend (missing frame), just draw what we have
    if (!imgA || !imgA.complete || !imgA.naturalWidth) return;

    const pA = getCoverParams(cw, ch, imgA.naturalWidth, imgA.naturalHeight);

    // If fraction is tiny or next frame isn't ready, just draw frame A
    if (t < 0.01 || !imgB || !imgB.complete || !imgB.naturalWidth || floorIdx === ceilIdx) {
      ctx.globalAlpha = 1;
      ctx.drawImage(imgA, pA.x, pA.y, pA.w, pA.h);
      return;
    }

    // Draw frame A at full opacity
    ctx.globalAlpha = 1;
    ctx.drawImage(imgA, pA.x, pA.y, pA.w, pA.h);

    // Crossfade frame B on top with fractional alpha
    const pB = getCoverParams(cw, ch, imgB.naturalWidth, imgB.naturalHeight);
    ctx.globalAlpha = t;
    ctx.drawImage(imgB, pB.x, pB.y, pB.w, pB.h);
    ctx.globalAlpha = 1;
  };

  // Single rAF loop that batches scroll updates
  const scheduleFrame = (value) => {
    pendingValueRef.current = value;
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      if (pendingValueRef.current !== null) {
        drawFrame(pendingValueRef.current);
        pendingValueRef.current = null;
      }
    });
  };

  // Canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      lastDrawnRef.current = -1;
      drawFrame(frameIndex.get());
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Subscribe to scroll-driven frame changes — pass FRACTIONAL value
  useEffect(() => {
    const unsubscribe = frameIndex.on("change", (latest) => {
      scheduleFrame(latest); // Keep fractional part for interpolation
    });
    return () => {
      unsubscribe();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return (
    <section className="frame-animation" ref={containerRef}>
      <div className="frame-animation__sticky">
        <div className="frame-animation__canvas-container">
          <canvas 
            ref={canvasRef}
            className="frame-animation__canvas"
          />
        </div>
        <div className="frame-animation__overlay" />
      </div>
      <div className="frame-animation__content">
        {children}
      </div>
    </section>
  );
};

export default FrameAnimation;
