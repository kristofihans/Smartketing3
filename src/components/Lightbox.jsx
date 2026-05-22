import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Lightbox.css';

const Lightbox = ({ isOpen, onClose, mediaItems = [], currentIndex = 0, setCurrentIndex }) => {
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Sync index and reset loading state on item change during render
  const [prevIndex, setPrevIndex] = useState(currentIndex);
  if (currentIndex !== prevIndex) {
    setPrevIndex(currentIndex);
    setLoading(true);
  }

  const handlePrev = useCallback(() => {
    if (mediaItems.length <= 1) return;
    const newIndex = currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, mediaItems, setCurrentIndex]);

  const handleNext = useCallback(() => {
    if (mediaItems.length <= 1) return;
    const newIndex = currentIndex === mediaItems.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }, [currentIndex, mediaItems, setCurrentIndex]);

  // Focus trap and previous focus restorer
  useEffect(() => {
    if (!isOpen) return;

    // Record the element that had focus before Lightbox opened
    previousFocusRef.current = document.activeElement;

    // Focus the close button or first element in the modal with a small delay for mounting/rendering
    const focusTimeout = setTimeout(() => {
      if (containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          const closeBtn = containerRef.current.querySelector('.lightbox__close-btn');
          if (closeBtn) {
            closeBtn.focus();
          } else {
            focusableElements[0].focus();
          }
        }
      }
    }, 50);

    return () => {
      clearTimeout(focusTimeout);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  // Handle keyboard navigation and body class/styles
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowRight' && mediaItems.length > 1) handleNext();
      if (e.key === 'ArrowLeft' && mediaItems.length > 1) handlePrev();

      if (e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Disable body scroll and add class when lightbox is open
    document.body.style.overflow = 'hidden';
    document.body.classList.add('lightbox-open');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.classList.remove('lightbox-open');
    };
  }, [isOpen, mediaItems, handleNext, handlePrev, onClose]);

  if (!isOpen || mediaItems.length === 0) return null;

  const currentItem = mediaItems[currentIndex];

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
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Galerie media"
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
