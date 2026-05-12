import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import './FrameAnimation.css';

const FrameAnimation = ({ children }) => {
  const containerRef = useRef(null);
  const frameCount = 236;
  const [currentFrame, setCurrentFrame] = useState(1);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["-100vh start", "end end"]
  });

  // Smooth the scroll progress for a high-end feel
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 40,
    damping: 20,
    restDelta: 0.0001
  });

  // Map smooth progress to frame index with "stops" (plateaus) at section boundaries
  const frameIndex = useTransform(
    smoothProgress, 
    [0, 0.18, 0.22, 0.43, 0.47, 0.68, 0.72, 0.93, 1],
    [1, 60, 60, 120, 120, 180, 180, 236, 236]
  );

  useEffect(() => {
    const unsubscribe = frameIndex.on("change", (latest) => {
      setCurrentFrame(Math.floor(latest));
    });
    return () => unsubscribe();
  }, [frameIndex]);

  // Preload images for better performance
  useEffect(() => {
    const preloadImages = () => {
      for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        const frameNum = String(i + 5).padStart(3, '0');
        img.src = `frames/ezgif-frame-${frameNum}.jpg`;
      }
    };
    preloadImages();
  }, []);

  return (
    <section className="frame-animation" ref={containerRef}>
      <div className="frame-animation__sticky">
        <div className="frame-animation__canvas-container">
          <img 
            src={`frames/ezgif-frame-${String(currentFrame + 5).padStart(3, '0')}.jpg`} 
            alt="Animation Frame" 
            className="frame-animation__image"
          />
        </div>
        {/* Dark overlay for text readability */}
        <div className="frame-animation__overlay" />
      </div>
      <div className="frame-animation__content">
        {children}
      </div>
    </section>
  );
};

export default FrameAnimation;
