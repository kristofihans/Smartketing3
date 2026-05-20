import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = ({ onVideoLoad }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleVideoActive = () => {
    setIsVideoActive(true);
    if (onVideoLoad) onVideoLoad();
  };

  // Slow down the hero video for a cinematic feel
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.85;
      if (videoRef.current.readyState >= 3 && !isVideoActive) {
        setIsVideoActive(true);
        if (onVideoLoad) onVideoLoad();
      }
    }
  }, [onVideoLoad, isVideoActive]);

  const videoSrc = `${import.meta.env.BASE_URL}herobackgroundvideo.mp4`;

  return (
    <section className="hero" id="hero">
      {/* Video Background */}
      <div className="hero__video-wrapper">
        <img 
          src={`${import.meta.env.BASE_URL}heroposter.webp`} 
          alt="Hero background" 
          className={`hero__poster ${isVideoActive ? 'hero__poster--hidden' : ''}`}
        />
        <video
          ref={videoRef}
          className={`hero__video ${isVideoActive ? 'hero__video--active' : ''}`}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={`${import.meta.env.BASE_URL}heroposter.webp`}
          onPlay={handleVideoActive}
          onPlaying={handleVideoActive}
          onLoadedData={handleVideoActive}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="hero__overlay" />

      {/* Center Logo */}
      <div className="hero__logo-container">
        <img src={`${import.meta.env.BASE_URL}logo.webp`} alt="Smartketing" className="hero__logo" />
      </div>

      {/* Scroll Suggestion */}
      <div className="hero__scroll-suggestion">
        <a href="#video" className="hero__contact-link">
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
