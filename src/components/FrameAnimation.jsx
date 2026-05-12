import { useRef, useEffect } from 'react';
import './FrameAnimation.css';

const FRAME_COUNT = 236;
const LERP_SPEED = 0.3;        // How fast the display chases the scroll
const CANVAS_SCALE = 0.5;      // Render at half resolution for speed

const FrameAnimation = ({ children }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // All mutable state in a single ref — zero React re-renders
  const state = useRef({
    ctx: null,
    images: [],
    lastDrawn: -1,
    current: 1,       // Smoothly animated frame (float)
    target: 1,        // Instant target from scroll position
    running: false,
    cw: 0,
    ch: 0,
  });

  // ─── Preload all frame images ───────────────────────────────
  useEffect(() => {
    const s = state.current;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = `frames/ezgif-frame-${String(i + 5).padStart(3, '0')}.webp`;
      s.images[i] = img;
    }
    // Eagerly decode the first batch so frame 1 is ready instantly
    for (let i = 1; i <= Math.min(40, FRAME_COUNT); i++) {
      if (s.images[i].decode) s.images[i].decode().catch(() => {});
    }
  }, []);

  // ─── Draw a single frame to canvas ──────────────────────────
  const draw = (index) => {
    const s = state.current;
    const idx = Math.max(1, Math.min(FRAME_COUNT, Math.round(index)));
    if (idx === s.lastDrawn) return;
    s.lastDrawn = idx;

    const { ctx, cw, ch } = s;
    const img = s.images[idx];
    if (!ctx || !img || !img.complete || !img.naturalWidth) return;

    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, (cw - w) * 0.5, (ch - h) * 0.5, w, h);
  };

  // ─── Smooth animation loop (lerp toward target) ─────────────
  const tick = () => {
    const s = state.current;
    const diff = s.target - s.current;

    // Close enough — snap and stop
    if (Math.abs(diff) < 0.8) {
      s.current = s.target;
      draw(s.current);
      s.running = false;
      return;
    }

    // Lerp: smoothly chase the target frame
    s.current += diff * LERP_SPEED;
    draw(s.current);
    requestAnimationFrame(tick);
  };

  const ensureRunning = () => {
    const s = state.current;
    if (!s.running) {
      s.running = true;
      requestAnimationFrame(tick);
    }
  };

  // ─── Canvas setup + resize ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const s = state.current;
    s.ctx = canvas.getContext('2d', { alpha: false });

    const onResize = () => {
      s.cw = Math.round(window.innerWidth * CANVAS_SCALE);
      s.ch = Math.round(window.innerHeight * CANVAS_SCALE);
      canvas.width = s.cw;
      canvas.height = s.ch;
      s.lastDrawn = -1; // Force redraw
      draw(s.current);
    };

    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Scroll → target frame (raw listener, no framer-motion) ─
  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress 0 → 1 as you scroll through the section
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / el.offsetHeight));

      state.current.target = 1 + progress * (FRAME_COUNT - 1);
      ensureRunning();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial position
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="frame-animation" ref={containerRef}>
      <div className="frame-animation__sticky">
        <div className="frame-animation__canvas-container">
          <canvas ref={canvasRef} className="frame-animation__canvas" />
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
