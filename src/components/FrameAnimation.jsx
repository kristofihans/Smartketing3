import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import './FrameAnimation.css';

const FrameAnimation = ({ children }) => {
  const containerRef = useRef(null);
  const frameCount = 241;
  const [currentFrame, setCurrentFrame] = useState(1);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map scroll progress to frame index (1 to 241)
  const frameIndex = useTransform(scrollYProgress, [0, 1], [1, frameCount]);

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
        const frameNum = String(i).padStart(3, '0');
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
            src={`frames/ezgif-frame-${String(currentFrame).padStart(3, '0')}.jpg`} 
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
