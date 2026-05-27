import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './VideoBackground.css';

gsap.registerPlugin(ScrollTrigger);

const VideoBackground = () => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  // Detect screen size on load
  const isMobile = window.innerWidth < 768;
  const videoSrc = `${import.meta.env.BASE_URL}videoafterhero.mp4`;

  useEffect(() => {
    if (isMobile) {
      // ==========================================
      // MOBILE: Canvas Frame Animation Sequence
      // ==========================================
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      const ext = 'webp';
      const totalFrames = 240;

      const images = new Array(totalFrames);
      const animState = { frame: 0 };
      let canvasReady = false;
      let isDestroyed = false;
      let hasScrolledCanvas = false; // Block rendering/updating until user scrolls

      const getFrameUrl = (index) => {
        const frameNum = String(1 + index).padStart(3, '0');
        return `${import.meta.env.BASE_URL}Donemobile/ezgif-frame-${frameNum}.${ext}`;
      };

      // Render a single frame to canvas
      const drawFrame = (frameIndex) => {
        const img = images[frameIndex];
        if (img && img.complete && img.naturalWidth !== 0) {
          if (!canvasReady) {
            canvas.width = img.width;
            canvas.height = img.height;
            canvasReady = true;
          }
          ctx.drawImage(img, 0, 0);
        }
      };

      // Preload all WebP images simply (do not draw frame 0 on load)
      for (let i = 0; i < totalFrames; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        images[i] = img;
      }

      const scrollTarget = document.querySelector('.app__content');
      let scrollTargetFrame = 0;
      let targetFrame = 0;
      let currentFrame = 0;
      let lastScrollTargetFrame = 0;
      const baseCatchupSpeed = 2.0; // Max frames to advance/reverse per render tick
      const baseIdleSpeed = 0.0;    // Base autoplay speed when user is stationary

      // Fade in the canvas opacity on mobile scroll with smooth catch-up
      const opacityTween = gsap.to(canvas, {
        scrollTrigger: {
          trigger: scrollTarget || document.documentElement,
          start: 'top 90%',
          end: 'top -55%',
          scrub: 1.5,
        },
        opacity: 1,
        ease: 'power1.inOut'
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: scrollTarget || document.documentElement,
          start: 'top 20%',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            // Sync target frame to scroll progress
            scrollTargetFrame = self.progress * (totalFrames - 1);
            if (self.progress > 0.001) {
              hasScrolledCanvas = true;
            } else {
              hasScrolledCanvas = false;
              targetFrame = 0;
              currentFrame = 0;
              if (canvasReady) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
              }
            }
          }
        }
      });

      tl.to(animState, {
        frame: totalFrames - 1,
        ease: 'none',
        duration: 1
      });

      // Custom animation tick loop for constant-speed bidirectional catchup + idle autoplay + acceleration
      let animationFrameId;
      const tick = () => {
        if (isDestroyed) return;

        // Keep canvas blank (black) and do not update if the user hasn't scrolled yet
        if (!hasScrolledCanvas) {
          animationFrameId = requestAnimationFrame(tick);
          return;
        }

        // Calculate speed multiplier that scales up as the animation nears the end (after 60%)
        const accelerationStartFrame = totalFrames * 0.6;
        let speedMultiplier = 1.0;
        if (currentFrame > accelerationStartFrame) {
          const ratio = (currentFrame - accelerationStartFrame) / (totalFrames - 1 - accelerationStartFrame);
          speedMultiplier = 1.0 + ratio * 1.5; // Scales from 1.0 up to 2.5 at the end
        }

        const activeCatchupSpeed = baseCatchupSpeed * speedMultiplier;
        const activeIdleSpeed = baseIdleSpeed * speedMultiplier;

        // Check if user is actively scrolling
        const didScroll = scrollTargetFrame !== lastScrollTargetFrame;
        lastScrollTargetFrame = scrollTargetFrame;

        if (didScroll) {
          targetFrame = scrollTargetFrame;
        } else {
          // Idle autoplay forward
          if (targetFrame < totalFrames - 1) {
            targetFrame = Math.min(totalFrames - 1, targetFrame + activeIdleSpeed);
          }
        }

        // Smooth catchup (works both forward and backward)
        if (Math.abs(currentFrame - targetFrame) > 0.05) {
          const diff = targetFrame - currentFrame;
          const step = Math.sign(diff) * Math.min(activeCatchupSpeed, Math.abs(diff));
          currentFrame += step;
        } else {
          currentFrame = targetFrame;
        }

        drawFrame(Math.round(currentFrame));

        animationFrameId = requestAnimationFrame(tick);
      };
      animationFrameId = requestAnimationFrame(tick);

      // Cleanup Mobile Animation
      return () => {
        isDestroyed = true;
        cancelAnimationFrame(animationFrameId);
        tl.kill();
        if (opacityTween) {
          if (opacityTween.scrollTrigger) opacityTween.scrollTrigger.kill();
          opacityTween.kill();
        }
        for (let i = 0; i < images.length; i++) {
          if (images[i]) {
            images[i].onload = null;
            images[i].src = '';
            images[i] = null;
          }
        }
      };
    } else {
      // ==========================================
      // DESKTOP: Scroll-Scrubbed Background Video
      // ==========================================
      const video = videoRef.current;
      if (!video) return;

      // Ensure the video does not auto-play on its own timer
      video.pause();

      const initScrollTrigger = () => {
        const duration = video.duration;
        if (!duration || isNaN(duration)) return;

        // Bind ScrollTrigger directly to a GSAP tween of the currentTime property
        const tweenInstance = gsap.to(video, {
          currentTime: duration,
          ease: 'none',
          scrollTrigger: {
            trigger: '.app__content',
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: 1.2,
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

      // Cleanup Desktop Video
      return () => {
        if (scrollTriggerInstance) scrollTriggerInstance.kill();
      };
    }
  }, [isMobile]);

  if (isMobile) {
    return <canvas ref={canvasRef} className="video-background" />;
  }

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
