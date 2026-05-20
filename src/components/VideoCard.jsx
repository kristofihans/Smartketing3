import { useState, useRef, useCallback, useEffect } from 'react';
import './Portfolio.css';

const VideoCard = ({ src, autoPlay = false, onClick }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef(null);

  // Update progress bar as video plays
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onTime = () => {
      if (!isSeeking && vid.duration) {
        setProgress((vid.currentTime / vid.duration) * 100);
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
      setIsPlaying(true);
    } else {
      vid.pause();
      setIsPlaying(false);
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
    setProgress(ratio * 100);
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
      >
        <div className="video-card__seek-track">
          <div className="video-card__seek-fill" style={{ width: `${progress}%` }} />
          <div className="video-card__seek-thumb" style={{ left: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
