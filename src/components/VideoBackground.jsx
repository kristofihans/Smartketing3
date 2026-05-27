import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './VideoBackground.css';

gsap.registerPlugin(ScrollTrigger);

const VideoBackground = () => {
  const videoRef = useRef(null);

  // Detect screen size on load
  const isMobile = window.innerWidth < 768;
  const videoSrc = `${import.meta.env.BASE_URL}${isMobile ? 'videoafterheromobile.mp4' : 'videoafterhero.mp4'}`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure the video does not auto-play on its own timer
    video.pause();

    const initScrollTrigger = () => {
      const duration = video.duration;
      if (!duration || isNaN(duration)) return;

      // Bind ScrollTrigger directly to a GSAP tween of the currentTime property
      // This enables GSAP to smoothly interpolate the frames with the scrub delay
      const tweenInstance = gsap.to(video, {
        currentTime: duration,
        ease: 'none',
        scrollTrigger: {
          trigger: '.app__content',
          start: 'top bottom', // Start scrubbing when portfolio content enters viewport
          end: 'bottom bottom', // End when footer reaches bottom
          scrub: 1.2, // Smooth catch-up lag (in seconds)
        }
      });

      return tweenInstance;
    };

    let scrollTriggerInstance;

    // If metadata is already loaded, init immediately; otherwise wait for loadedmetadata event
    if (video.readyState >= 1) {
      scrollTriggerInstance = initScrollTrigger();
    } else {
      const handleLoadedMetadata = () => {
        scrollTriggerInstance = initScrollTrigger();
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        if (scrollTriggerInstance) scrollTriggerInstance.kill();
      };
    }

    return () => {
      if (scrollTriggerInstance) scrollTriggerInstance.kill();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={videoSrc}
      muted
      playsInline
      preload="auto"
      className="video-background"
    />
  );
};

export default VideoBackground;
