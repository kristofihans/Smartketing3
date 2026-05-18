import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = ({ onVideoLoad }) => {
  const [isMobile, setIsMobile] = useState(false);
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
      if (videoRef.current.readyState >= 3) {
        onVideoLoad();
      }
    }
  }, [onVideoLoad]);

  const videoSrc = 'herobackgroundvideo.mp4';

  return (
    <section className="hero" id="hero">
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
          onLoadedData={onVideoLoad}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="hero__overlay" />

      {/* Center Logo */}
      <div className="hero__logo-container">
        <img src="logo.png" alt="Smartketing" className="hero__logo" />
      </div>

      {/* Scroll Suggestion */}
      <div className="hero__scroll-suggestion">
        <a href="#contact" className="hero__contact-link">
          <div className="hero__scroll-icon">
            <span className="hero__chevron" style={{ '--chevron-base-opacity': 0.3 }} />
            <span className="hero__chevron" style={{ '--chevron-base-opacity': 0.6 }} />
            <span className="hero__chevron" style={{ '--chevron-base-opacity': 1 }} />
          </div>
        </a>
      </div>

    </section>
  );
};

export default Hero;
