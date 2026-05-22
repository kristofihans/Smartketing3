import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCard from '../components/VideoCard';
import Lightbox from '../components/Lightbox';
import './Gallery.css';

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab = (tabParam && ['foto', 'video', 'web'].includes(tabParam)) ? tabParam : 'video';

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Scroll to top when searchParams change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const allVideos = [
    'video.mp4',
    'video2.mp4',
    'video3.mp4',
    'video4.mp4',
    'video5.mp4',
  ];

  const galleryImages = [
    'productimage1.webp',
    'productimage2.webp',
    'productimage3.webp',
  ];

  const webCases = [
    'web1.webp',
    'web2.webp',
  ];

  // Map elements to Lightbox media format
  const videoMediaItems = allVideos.map(src => ({
    type: 'video',
    src: `${import.meta.env.BASE_URL}${src}`
  }));

  const fotoMediaItems = galleryImages.map(src => ({
    type: 'image',
    src: `${import.meta.env.BASE_URL}${src}`
  }));

  const webMediaItems = webCases.map(src => ({
    type: 'image',
    src: `${import.meta.env.BASE_URL}${src}`
  }));

  return (
    <div className="gallery-page">
      {/* Background Video */}
      <div className="gallery-bg-video-wrapper">
        <video
          className="gallery-bg-video"
          src={`${import.meta.env.BASE_URL}portfoliopagebackgroundvideo.mp4`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="gallery-bg-overlay" />
      </div>

      <div className="gallery__header">
        <h1 className="gallery__title">Portofoliu</h1>
      </div>

      <div className="gallery__tabs">
        {['video', 'foto', 'web'].map((tab) => (
          <button
            key={tab}
            className={`gallery__tab ${activeTab === tab ? 'gallery__tab--active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="gallery__content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`gallery__grid ${activeTab === 'web' ? 'gallery__grid--web' : ''}`}
          >
            {activeTab === 'video' && allVideos.map((src, i) => (
              <motion.div 
                key={i} 
                className="gallery__item gallery__item--video"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <VideoCard 
                  src={`${import.meta.env.BASE_URL}${src}`} 
                  onClick={() => {
                    setLightboxItems(videoMediaItems);
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }}
                />
              </motion.div>
            ))}

            {activeTab === 'foto' && galleryImages.map((src, i) => (
              <motion.div 
                key={i} 
                className="gallery__item gallery__item--clickable"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  setLightboxItems(fotoMediaItems);
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
              >
                <img src={`${import.meta.env.BASE_URL}${src}`} alt={`Gallery Foto ${i + 1}`} loading="lazy" />
              </motion.div>
            ))}

            {activeTab === 'web' && webCases.map((src, i) => (
              <motion.div 
                key={i} 
                className="gallery__item gallery__item--web gallery__item--clickable"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  setLightboxItems(webMediaItems);
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
              >
                <img src={`${import.meta.env.BASE_URL}${src}`} alt={`Web Case ${i + 1}`} loading="lazy" />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <Lightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        mediaItems={lightboxItems}
        currentIndex={lightboxIndex}
        setCurrentIndex={setLightboxIndex}
      />
    </div>
  );
};

export default Gallery;
