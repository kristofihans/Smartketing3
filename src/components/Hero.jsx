import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const videoSrc = 'herobackgroundvideo.mp4';

  return (
    <section className="hero" id="hero">
      {/* Video Background */}
      <div className="hero__video-wrapper">
        <video
          className="hero__video"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>

      {/* Gradient Overlay */}
      <div className="hero__overlay" />

      {/* Center Logo */}
      <motion.div 
        className="hero__logo-container"
        initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-50%" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
        transition={{ delay: 0.5, duration: 3, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src="logo.png" alt="Smartketing" className="hero__logo" />
      </motion.div>

      {/* Scroll Suggestion */}
      <motion.div
        className="hero__scroll-suggestion"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
