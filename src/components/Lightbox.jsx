import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Lightbox.css';

const Lightbox = ({ isOpen, onClose, mediaItems = [], currentIndex = 0, setCurrentIndex }) => {
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && mediaItems.length > 1) handleNext();
      if (e.key === 'ArrowLeft' && mediaItems.length > 1) handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Disable body scroll when lightbox is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentIndex, mediaItems]);

  // Reset loading state on item change
  useEffect(() => {
    setLoading(true);
  }, [currentIndex]);

  if (!isOpen || mediaItems.length === 0) return null;

  const currentItem = mediaItems[currentIndex];

  const handlePrev = () => {
    if (mediaItems.length <= 1) return;
    const newIndex = currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    if (mediaItems.length <= 1) return;
    const newIndex = currentIndex === mediaItems.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].screenX;
    const threshold = 50; // swipe threshold in px
    const diff = touchStartX.current - touchEndX.current;

    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          // Close if clicking outside the media container
          if (e.target.classList.contains('lightbox__content-wrapper')) {
            onClose();
          }
        }}
      >
        {/* Top bar with count & close button */}
        <div className="lightbox__top-bar">
          <span className="lightbox__counter">
            {mediaItems.length > 1 ? `${currentIndex + 1} / ${mediaItems.length}` : ''}
          </span>
          <button className="lightbox__close-btn" onClick={onClose} aria-label="Close lightbox">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Previous Button */}
        {mediaItems.length > 1 && (
          <button className="lightbox__nav-btn lightbox__nav-btn--prev" onClick={handlePrev} aria-label="Previous item">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        {/* Content Wrapper */}
        <div className="lightbox__content-wrapper">
          <motion.div
            key={currentIndex}
            className="lightbox__media-container"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {loading && (
              <div className="lightbox__loader">
                <div className="lightbox__spinner" />
              </div>
            )}

            {currentItem.type === 'video' ? (
              <video
                className="lightbox__video"
                src={currentItem.src}
                controls
                autoPlay
                playsInline
                onLoadedData={() => setLoading(false)}
              />
            ) : (
              <img
                className="lightbox__image"
                src={currentItem.src}
                alt={`Lightbox item ${currentIndex + 1}`}
                onLoad={() => setLoading(false)}
                style={{ display: loading ? 'none' : 'block' }}
              />
            )}
          </motion.div>
        </div>

        {/* Next Button */}
        {mediaItems.length > 1 && (
          <button className="lightbox__nav-btn lightbox__nav-btn--next" onClick={handleNext} aria-label="Next item">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default Lightbox;
