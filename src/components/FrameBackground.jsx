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

    let drawWidth = 0;
    let drawHeight = 0;
    let drawX = 0;
    let drawY = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Safe check to find the first loaded frame to read aspect ratio
      const loadedImg = frames.find(img => img.complete && img.naturalWidth > 0);
      const imgWidth = loadedImg ? loadedImg.naturalWidth : (isMobile ? 720 : 1920);
      const imgHeight = loadedImg ? loadedImg.naturalHeight : (isMobile ? 1280 : 1080);
      const imgAspect = imgWidth / imgHeight;
      const canvasAspect = canvas.width / canvas.height;

      if (canvasAspect > imgAspect) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgAspect;
        drawHeight = canvas.height;
        drawX = (canvas.width - drawWidth) / 2;
        drawY = 0;
      }

      drawFrame(animationObj.frame);
    };

    const drawFrame = (index) => {
      const imgIdx = Math.max(0, Math.min(totalFrames - 1, Math.floor(index)));
      const img = frames[imgIdx];
      if (img && img.complete) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
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

    const triggers = [];

    sections.forEach((sec, idx) => {
      if (idx === 0) return; // Hero is the starting frame (0)
      const prevSec = sections[idx - 1];
      const el = document.querySelector(sec.id);
      if (!el) return;

      let start = 'top bottom';
      if (isMobile && prevSec.id === '#hero') {
        start = 'top 37.5vh'; // Match mobile hero height
      }

      // Create scroll-scrubbed tween for each section transition
      const tween = gsap.fromTo(animationObj,
        { frame: prevSec.frame },
        {
          frame: sec.frame,
          ease: 'none',
          onUpdate: () => {
            drawFrame(animationObj.frame);
          }
        }
      );

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: start,
        end: 'top top',
        scrub: true, // Direct follow (play on swipe, snap to finish)
        animation: tween
      });
      triggers.push(trigger);
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      triggers.forEach(t => t.kill());
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="frame-background" />
      <div className="frame-background__overlay" />
    </>
  );
};

export default FrameBackground;
