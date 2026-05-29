import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);

const FrameBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalFrames = 209;
    const frames = [];
    let loadedCount = 0;

    const isMobile = window.innerWidth < 768;
    const folderName = isMobile ? 'huhmobile' : 'huh';

    const animationObj = { frame: 0 };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(animationObj.frame);
    };

    const drawFrame = (index) => {
      const imgIdx = Math.max(0, Math.min(totalFrames - 1, Math.floor(index)));
      const img = frames[imgIdx];
      if (img && img.complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Aspect ratio cover logic
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const canvasAspect = canvas.width / canvas.height;
        let drawWidth, drawHeight, x, y;

        if (canvasAspect > imgAspect) {
          drawWidth = canvas.width;
          drawHeight = canvas.width / imgAspect;
          x = 0;
          y = (canvas.height - drawHeight) / 2;
        } else {
          drawWidth = canvas.height * imgAspect;
          drawHeight = canvas.height;
          x = (canvas.width - drawWidth) / 2;
          y = 0;
        }

        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        // Darken overlay
        const darkenAlpha = isMobile ? 0.40 : 0.30;
        ctx.fillStyle = `rgba(0, 0, 0, ${darkenAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    // Preload all frames
    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i + 1).padStart(3, '0');
      img.src = `${import.meta.env.BASE_URL}${folderName}/ezgif-frame-${frameNum}.webp`;
      img.onload = () => {
        loadedCount++;
        if (loadedCount === 1) {
          resizeCanvas();
        } else if (Math.floor(animationObj.frame) === i) {
          drawFrame(animationObj.frame);
        }
      };
      frames.push(img);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const scrollTarget = document.querySelector('.app__content');

    // Simple scroll-driven frame animation trigger
    const scrollTriggerInstance = ScrollTrigger.create({
      trigger: scrollTarget || document.documentElement,
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        animationObj.frame = self.progress * (totalFrames - 1);
        drawFrame(animationObj.frame);
      }
    });

    let mobileOpacityInstance = null;
    if (isMobile) {
      mobileOpacityInstance = ScrollTrigger.create({
        trigger: scrollTarget || document.documentElement,
        start: () => `top ${document.getElementById('hero')?.offsetHeight || window.innerHeight}px`,
        end: () => `top ${(document.getElementById('hero')?.offsetHeight || window.innerHeight) * 0.2}px`,
        scrub: true,
        onUpdate: (self) => {
          canvas.style.opacity = self.progress;
        }
      });
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      scrollTriggerInstance.kill();
      if (mobileOpacityInstance) {
        mobileOpacityInstance.kill();
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
