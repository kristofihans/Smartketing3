import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);

const BATCH_SIZE = 15;

const FrameBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const folderName = isMobile ? 'Donemobile' : 'Donedesktop';
    const ext = 'webp';
    const frameStep = 1;
    const startFrame = 1;
    const totalFrames = 240;
    const priorityBatch = 40;

    // Enable/disable image smoothing based on device
    ctx.imageSmoothingEnabled = !isMobile;
    ctx.imageSmoothingQuality = isMobile ? 'low' : 'high';

    const images = new Array(totalFrames);
    const decoded = new Array(totalFrames).fill(false);

    const animState = { frame: 0 };
    let canvasReady = false;
    let lastRenderedFrame = -1;
    let renderScheduled = false;
    let isDestroyed = false;

    const getFrameUrl = (index) => {
      const frameNum = String(startFrame + (index * frameStep)).padStart(3, '0');
      return `${import.meta.env.BASE_URL}${folderName}/ezgif-frame-${frameNum}.${ext}`;
    };

    const isFrameReady = (index) => {
      const img = images[index];
      return img && img.complete && img.naturalWidth !== 0 && decoded[index];
    };

    // Find nearest loaded frame as fallback
    const findNearestLoadedFrame = (targetIndex) => {
      for (let offset = 0; offset < totalFrames; offset++) {
        if (targetIndex - offset >= 0 && isFrameReady(targetIndex - offset)) {
          return targetIndex - offset;
        }
        if (targetIndex + offset < totalFrames && isFrameReady(targetIndex + offset)) {
          return targetIndex + offset;
        }
      }
      return -1;
    };

    // Render a single frame to canvas
    const drawFrame = (frameIndex) => {
      const img = images[frameIndex];
      if (!canvasReady) {
        canvas.width = img.width;
        canvas.height = img.height;
        canvasReady = true;
      }
      ctx.drawImage(img, 0, 0);
      lastRenderedFrame = frameIndex;
    };

    // Schedule a render on the next animation frame (coalesces multiple scroll events)
    const scheduleRender = () => {
      if (renderScheduled || isDestroyed) return;
      renderScheduled = true;

      requestAnimationFrame(() => {
        renderScheduled = false;
        if (isDestroyed) return;

        const currentFrame = Math.max(0, Math.min(totalFrames - 1, Math.round(animState.frame)));

        // Skip if same frame already drawn
        if (currentFrame === lastRenderedFrame) return;

        if (isFrameReady(currentFrame)) {
          drawFrame(currentFrame);
        } else {
          // Fallback to nearest available frame
          const nearest = findNearestLoadedFrame(currentFrame);
          if (nearest >= 0 && nearest !== lastRenderedFrame) {
            drawFrame(nearest);
          }
        }
      });
    };

    // Load a single frame and return a promise
    const loadFrame = (index) => {
      return new Promise((resolve) => {
        if (images[index] && decoded[index]) {
          resolve();
          return;
        }
        const img = new Image();
        img.decoding = 'async';
        img.src = getFrameUrl(index);
        images[index] = img;

        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode()
              .then(() => { decoded[index] = true; resolve(); })
              .catch(() => { decoded[index] = true; resolve(); });
          } else {
            decoded[index] = true;
            resolve();
          }
        };
        img.onerror = () => {
          decoded[index] = false;
          resolve();
        };
      });
    };

    // Load frames in sequential batches
    const loadFramesBatched = async (startIdx, endIdx, batchSize) => {
      for (let i = startIdx; i < endIdx; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, endIdx); j++) {
          if (!images[j]) {
            batch.push(loadFrame(j));
          }
        }
        await Promise.all(batch);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };

    const startLoading = async () => {
      const priorityEnd = Math.min(priorityBatch, totalFrames);
      await loadFramesBatched(0, priorityEnd, priorityEnd);

      // Render frame 0 as soon as priority batch is loaded
      if (!isDestroyed && isFrameReady(0) && lastRenderedFrame === -1) {
        drawFrame(0);
      }

      if (!isDestroyed) {
        await loadFramesBatched(priorityEnd, totalFrames, BATCH_SIZE);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startLoading();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(canvas);

    // GSAP ScrollTrigger — scrub: true = direct 1:1 scroll mapping, no autoplay catch-up
    const scrollTarget = document.querySelector('.app__content');

    let opacityTween;
    if (isMobile) {
      opacityTween = gsap.to(canvas, {
        scrollTrigger: {
          trigger: scrollTarget || document.documentElement,
          start: 'top 35%',
          end: 'top 10%',
          scrub: true,
        },
        opacity: 1,
        ease: 'power1.out'
      });
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: scrollTarget || document.documentElement,
        start: () => window.innerWidth < 768 ? 'top 20%' : 'top 80%',
        end: 'bottom bottom',
        scrub: true, // Direct 1:1 — no autoplay, stops instantly when scrolling stops
        onUpdate: scheduleRender,
      }
    });

    tl.to(animState, {
      frame: totalFrames - 1,
      ease: 'none',
      duration: 1
    });

    // --- Dynamic 3D Parallax Layering ---
    const parallaxTweens = [];
    const sections = gsap.utils.toArray('.portfolio-section, .services, .outro');

    sections.forEach((section) => {
      const header = section.querySelector('.section-header, .services__header');
      if (header) {
        const tween = gsap.fromTo(header, 
          { y: 40 },
          {
            y: -40,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2
            }
          }
        );
        parallaxTweens.push(tween);
      }

      const media = section.querySelector('.feature-media, .services__grid, .contact__container');
      if (media) {
        const tween = gsap.fromTo(media,
          { y: 80, scale: 0.96 },
          {
            y: -80,
            scale: 1.02,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5
            }
          }
        );
        parallaxTweens.push(tween);
      }
    });

    // Cleanup
    return () => {
      isDestroyed = true;
      observer.disconnect();
      tl.kill();
      if (opacityTween) {
        if (opacityTween.scrollTrigger) opacityTween.scrollTrigger.kill();
        opacityTween.kill();
      }
      parallaxTweens.forEach((tween) => {
        if (tween.scrollTrigger) tween.scrollTrigger.kill();
        tween.kill();
      });

      for (let i = 0; i < images.length; i++) {
        if (images[i]) {
          images[i].onload = null;
          images[i].onerror = null;
          images[i].src = '';
          images[i] = null;
        }
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;

