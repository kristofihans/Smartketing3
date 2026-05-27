import { useState, useRef, useCallback, useEffect } from 'react';
import './Portfolio.css';

const VideoCard = ({ src, autoPlay = false, onClick }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const seekFillRef = useRef(null);
  const seekThumbRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef(null);

  // Synchronize playing state with actual video element events
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    vid.addEventListener('play', handlePlay);
    vid.addEventListener('pause', handlePause);

    return () => {
      vid.removeEventListener('play', handlePlay);
      vid.removeEventListener('pause', handlePause);
    };
  }, []);

  // Handle programmatic play/pause when autoPlay prop updates dynamically
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (autoPlay) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [autoPlay]);

  // Update progress bar styling directly (avoid React re-render cycles)
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const onTime = () => {
      if (!isSeeking && vid.duration) {
        const pct = (vid.currentTime / vid.duration) * 100;
        if (seekFillRef.current) {
          seekFillRef.current.style.width = `${pct}%`;
        }
        if (seekThumbRef.current) {
          seekThumbRef.current.style.left = `${pct}%`;
        }
        if (progressRef.current) {
          progressRef.current.setAttribute('aria-valuenow', Math.round(pct).toString());
        }
      }
    };
    vid.addEventListener('timeupdate', onTime);
    return () => vid.removeEventListener('timeupdate', onTime);
  }, [isSeeking]);

  const togglePlay = useCallback((e) => {
    // Don't toggle play when interacting with the seek bar
    if (e.target.closest('.video-card__seek')) return;
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
    } else {
      vid.pause();
    }
  }, []);

  // Seek to position from a mouse/touch event on the progress bar
  const seekTo = useCallback((clientX) => {
    const vid = videoRef.current;
    const bar = progressRef.current;
    if (!vid || !bar || !vid.duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    vid.currentTime = ratio * vid.duration;
    const pct = ratio * 100;
    if (seekFillRef.current) {
      seekFillRef.current.style.width = `${pct}%`;
    }
    if (seekThumbRef.current) {
      seekThumbRef.current.style.left = `${pct}%`;
    }
    if (bar) {
      bar.setAttribute('aria-valuenow', Math.round(pct).toString());
    }
  }, []);

  const onSeekStart = useCallback((e) => {
    e.stopPropagation();
    setIsSeeking(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    seekTo(clientX);

    const onMove = (ev) => {
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      seekTo(cx);
    };
    const onEnd = () => {
      setIsSeeking(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }, [seekTo]);

  // Support seek bar keyboard controls
  const handleSliderKeyDown = useCallback((e) => {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    let newTime = vid.currentTime;
    const step = 5; // seek step in seconds
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      newTime = Math.min(vid.duration, vid.currentTime + step);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      newTime = Math.max(0, vid.currentTime - step);
      e.preventDefault();
    } else if (e.key === 'Home') {
      newTime = 0;
      e.preventDefault();
    } else if (e.key === 'End') {
      newTime = vid.duration;
      e.preventDefault();
    }
    
    if (newTime !== vid.currentTime) {
      vid.currentTime = newTime;
      const pct = (newTime / vid.duration) * 100;
      if (seekFillRef.current) seekFillRef.current.style.width = `${pct}%`;
      if (seekThumbRef.current) seekThumbRef.current.style.left = `${pct}%`;
      if (progressRef.current) {
        progressRef.current.setAttribute('aria-valuenow', Math.round(pct).toString());
      }
    }
  }, []);

  // Show controls on interaction, auto-hide after delay
  const flashControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  return (
    <div
      className="video-card"
      onClick={(e) => {
        if (onClick) {
          onClick(e);
        } else {
          togglePlay(e);
        }
      }}
      onMouseEnter={flashControls}
      onMouseMove={flashControls}
      onTouchStart={flashControls}
      tabIndex="0"
      role="button"
      aria-label="Video Player"
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (onClick) {
            onClick(e);
          } else {
            togglePlay(e);
          }
        }
      }}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        muted
        loop
        playsInline
      />

      {/* Play / Pause overlay icon */}
      <div className={`video-card__overlay ${isPlaying && !showControls ? 'video-card__overlay--hidden' : ''}`}>
        <div className="video-card__play-btn">
          {isPlaying ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </div>
      </div>

      {/* Seek / Progress bar */}
      <div
        className={`video-card__seek ${showControls || !isPlaying ? 'video-card__seek--visible' : ''}`}
        ref={progressRef}
        onMouseDown={onSeekStart}
        onTouchStart={onSeekStart}
        role="slider"
        aria-label="Seek video"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="0"
        tabIndex="0"
        onKeyDown={handleSliderKeyDown}
      >
        <div className="video-card__seek-track">
          <div ref={seekFillRef} className="video-card__seek-fill" style={{ width: '0%' }} />
          <div ref={seekThumbRef} className="video-card__seek-thumb" style={{ left: '0%' }} />
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
