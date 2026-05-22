import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './Hero.css';

const Hero = ({ onVideoLoad }) => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const videoRef = useRef(null);

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
          width="1920"
          height="1080"
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
          aria-hidden="true"
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
        <img 
          src={`${import.meta.env.BASE_URL}logo.webp`} 
          alt="Smartketing Logo" 
          width="280"
          height="70"
          className="hero__logo" 
        />
      </div>

      {/* Scroll Suggestion */}
      <div className="hero__scroll-suggestion">
        <a href="#video" className="hero__contact-link" aria-label="Derulează în jos la portofoliu">
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
