import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './FrameBackground.css';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES_1 = 120; // frames2 folder
const START_FRAME_1 = 1;

const TOTAL_FRAMES_2 = 235; // frames folder
const START_FRAME_2 = 6;

const FrameBackground = () => {
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);

  useEffect(() => {
    const canvas1 = canvas1Ref.current;
    const canvas2 = canvas2Ref.current;
    if (!canvas1 || !canvas2) return;

    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    if (!ctx1 || !ctx2) return;

    const images1 = [];
    const images2 = [];

    let currentImg1 = null;
    let currentImg2 = null;
    let renderRequested1 = false;
    let renderRequested2 = false;

    const renderFrame1 = () => {
      renderRequested1 = false;
      if (currentImg1 && currentImg1.complete && currentImg1.naturalWidth !== 0) {
        if (canvas1.width !== currentImg1.width || canvas1.height !== currentImg1.height) {
          canvas1.width = currentImg1.width;
          canvas1.height = currentImg1.height;
        }
        ctx1.clearRect(0, 0, canvas1.width, canvas1.height);
        ctx1.drawImage(currentImg1, 0, 0);
      }
    };

    const renderFrame2 = () => {
      renderRequested2 = false;
      if (currentImg2 && currentImg2.complete && currentImg2.naturalWidth !== 0) {
        if (canvas2.width !== currentImg2.width || canvas2.height !== currentImg2.height) {
          canvas2.width = currentImg2.width;
          canvas2.height = currentImg2.height;
        }
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx2.drawImage(currentImg2, 0, 0);
      }
    };

    const requestRender1 = (img) => {
      if (!img) return;
      currentImg1 = img;
      if (!renderRequested1) {
        renderRequested1 = true;
        requestAnimationFrame(renderFrame1);
      }
    };

    const requestRender2 = (img) => {
      if (!img) return;
      currentImg2 = img;
      if (!renderRequested2) {
        renderRequested2 = true;
        requestAnimationFrame(renderFrame2);
      }
    };

    // Preload Sequence 1
    for (let i = 0; i < TOTAL_FRAMES_1; i++) {
      const img = new Image();
      const frameNum = String(START_FRAME_1 + i).padStart(3, '0');
      img.src = `frames2/ezgif-frame-${frameNum}.jpg`;
      img.onload = () => {
        if (i === 0 && !currentImg1) requestRender1(img);
      };
      images1.push(img);
    }

    // Preload Sequence 2
    for (let i = 0; i < TOTAL_FRAMES_2; i++) {
      const img = new Image();
      const frameNum = String(START_FRAME_2 + i).padStart(3, '0');
      img.src = `frames/ezgif-frame-${frameNum}.webp`;
      img.onload = () => {
        // Draw the first frame of sequence 2 immediately so it's ready when fading in
        if (i === 0 && !currentImg2) requestRender2(img);
      };
      images2.push(img);
    }

    // --- SETUP SCROLL TRIGGERS ---

    // Trigger 1: #video -> #photo (Scrubs sequence 1)
    const trigger1 = ScrollTrigger.create({
      trigger: '#video',
      endTrigger: '#photo',
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        const frameIndex = Math.min(
          TOTAL_FRAMES_1 - 1,
          Math.floor(self.progress * TOTAL_FRAMES_1)
        );
        requestRender1(images1[frameIndex]);
      },
    });

    // Trigger 2: #web -> bottom of .app__content (Scrubs sequence 2)
    // We start it scrubbing as soon as #web comes into view.
    const trigger2 = ScrollTrigger.create({
      trigger: '#web',
      endTrigger: '.app__content',
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        const frameIndex = Math.min(
          TOTAL_FRAMES_2 - 1,
          Math.floor(self.progress * TOTAL_FRAMES_2)
        );
        requestRender2(images2[frameIndex]);
      },
    });

    // Trigger 3: Crossfade Canvas Opacity
    // Fades between the two canvases exactly as the user transitions from #photo to #web
    const fadeTrigger = gsap.to(canvas2, {
      opacity: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '#web',
        start: 'top bottom', // Start fading when #web enters viewport
        end: 'top top',      // Finish fading when #web hits top of viewport
        scrub: true,
      }
    });

    // Handle ResizeObserver
    const appContent = document.querySelector('.app__content');
    let resizeObserver;
    if (appContent && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        ScrollTrigger.refresh();
      });
      resizeObserver.observe(appContent);
    }

    return () => {
      trigger1.kill();
      trigger2.kill();
      if (fadeTrigger.scrollTrigger) fadeTrigger.scrollTrigger.kill();
      fadeTrigger.kill();
      if (resizeObserver && appContent) {
        resizeObserver.unobserve(appContent);
      }
    };
  }, []);

  return (
    <div className="frame-background-wrapper">
      <canvas ref={canvas1Ref} className="frame-background frame-background--seq1" />
      <canvas ref={canvas2Ref} className="frame-background frame-background--seq2" />
    </div>
  );
};

export default FrameBackground;
