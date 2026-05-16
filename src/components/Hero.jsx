import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Slow down the hero video for a cinematic feel
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.85;
      
      // Check if video is already loaded (from cache)
      if (videoRef.current.readyState >= 3) {
        setIsVideoReady(true);
      }
    }
  }, []);

  const handleVideoLoad = () => {
    setIsVideoReady(true);
  };

  const videoSrc = 'herobackgroundvideo.mp4';

  return (
    <section className={`hero ${isVideoReady ? 'hero--loaded' : ''}`} id="hero">
      {/* Video Background */}
      <div className="hero__video-wrapper">
        <video
          ref={videoRef}
          className="hero__video"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={handleVideoLoad}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="hero__overlay" />

      {/* Center Logo */}
      <motion.div 
        className="hero__logo-container"
        initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        transition={{ delay: 0.2, duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src="logo.png" alt="Smartketing" className="hero__logo" />
      </motion.div>

      {/* Scroll Suggestion */}
      <motion.div
        className="hero__scroll-suggestion"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <a href="#contact" className="hero__contact-link">
          <div className="hero__scroll-icon">
            <span className="hero__chevron" style={{ '--chevron-base-opacity': 0.3 }} />
            <span className="hero__chevron" style={{ '--chevron-base-opacity': 0.6 }} />
            <span className="hero__chevron" style={{ '--chevron-base-opacity': 1 }} />
          </div>
        </a>
      </motion.div>

    </section>
  );
};

export default Hero;
