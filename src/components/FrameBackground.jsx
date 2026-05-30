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

    const totalFrames = 523;
    const frames = [];
    let loadedCount = 0;

    const isMobile = window.innerWidth < 768;
    const folderName = isMobile ? 'ultimatemobile' : 'ultimatedesktop';

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
      img.src = `${import.meta.env.BASE_URL}${folderName}/frame_${frameNum}.webp`;
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

    const sections = [
      { id: '#hero', frame: 0 },
      { id: '#video', frame: 120 },
      { id: '#photo', frame: 220 },
      { id: '#web', frame: 320 },
      { id: '#services', frame: 420 },
      { id: '.outro', frame: 522 }
    ];

    let currentTween = null;

    const playToFrame = (target) => {
      if (currentTween) currentTween.kill();

      const dist = Math.abs(animationObj.frame - target);
      if (dist === 0) return;

      // Cinematic velocity: 200 frames per second.
      // Cap duration between 0.25s and 0.8s for a balanced snappy feel.
      const duration = Math.min(0.8, Math.max(0.25, dist / 200));

      currentTween = gsap.to(animationObj, {
        frame: target,
        duration: duration,
        ease: 'power1.out',
        onUpdate: () => {
          drawFrame(animationObj.frame);
        }
      });
    };

    const triggers = [];

    sections.forEach((sec) => {
      const el = document.querySelector(sec.id);
      if (!el) return;

      let start = 'top 50%';
      let end = 'bottom 50%';

      if (isMobile) {
        if (sec.id === '#hero') {
          start = 'top 0%';
          end = 'bottom 30%';
        } else if (sec.id === '#video') {
          start = 'top 30%';
          end = 'bottom 50%';
        }
      }

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: start,
        end: end,
        onToggle: (self) => {
          if (self.isActive) {
            playToFrame(sec.frame);
          }
        }
      });
      triggers.push(trigger);
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      triggers.forEach(t => t.kill());
      if (currentTween) currentTween.kill();
    };
  }, []);

  return <canvas ref={canvasRef} className="frame-background" />;
};

export default FrameBackground;
