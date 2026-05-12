import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useMemo } from 'react';
import './FrameAnimation.css';

const FrameAnimation = ({ children }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const frameCount = 236;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["-100vh start", "end end"]
  });

  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, frameCount]);

  // Preload images into a ref to avoid React state lag
  useEffect(() => {
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      const frameNum = String(i + 5).padStart(3, '0');
      img.src = `frames/ezgif-frame-${frameNum}.jpg`;
      imagesRef.current[i] = img;
    }
  }, []);

  // Drawing logic with performance optimizations
  const drawImage = (index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Performance optimization
    const img = imagesRef.current[index];
    
    if (img && img.complete) {
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const imgWidth = img.width;
      const imgHeight = img.height;
      
      const ratio = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
      const newWidth = imgWidth * ratio;
      const newHeight = imgHeight * ratio;
      const x = (canvasWidth - newWidth) / 2;
      const y = (canvasHeight - newHeight) / 2;

      ctx.drawImage(img, x, y, newWidth, newHeight);
    }
  };

  // Handle Canvas Resizing - Use a lower internal resolution for speed
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Render at 0.75x resolution for better performance on high-DPI screens
        const scale = 0.75; 
        canvasRef.current.width = window.innerWidth * scale;
        canvasRef.current.height = window.innerHeight * scale;
        drawImage(Math.floor(frameIndex.get()));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [frameIndex]);

  // Direct drawing on scroll change
  useEffect(() => {
    const unsubscribe = frameIndex.on("change", (latest) => {
      // Use requestAnimationFrame to sync with display refresh rate
      requestAnimationFrame(() => drawImage(Math.floor(latest)));
    });
    return () => unsubscribe();
  }, [frameIndex]);

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
