import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCard from '../components/VideoCard';
import './Gallery.css';

const Gallery = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('video');

  // Sync tab with URL
  useEffect(() => {
    window.scrollTo(0, 0);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['foto', 'video', 'web'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
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
    'productimage1.jpg',
    'productimage2.jpg',
    'productimage3.jpg',
  ];

  const webCases = [
    'web1.png',
    'web2.png',
  ];

  const bgStyle = {
    backgroundImage: `radial-gradient(circle at center, rgba(10, 10, 12, 0.45) 0%, rgba(10, 10, 12, 0.95) 100%), url(${import.meta.env.BASE_URL}portfolio_bg.jpg)`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundAttachment: 'fixed',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div className="gallery-page" style={bgStyle}>
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
                className="gallery__item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <VideoCard src={`${import.meta.env.BASE_URL}${src}`} />
              </motion.div>
            ))}

            {activeTab === 'foto' && galleryImages.map((src, i) => (
              <motion.div 
                key={i} 
                className="gallery__item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <img src={`${import.meta.env.BASE_URL}${src}`} alt={`Gallery Foto ${i + 1}`} loading="lazy" />
              </motion.div>
            ))}

            {activeTab === 'web' && webCases.map((src, i) => (
              <motion.div 
                key={i} 
                className="gallery__item gallery__item--web"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <img src={`${import.meta.env.BASE_URL}${src}`} alt={`Web Case ${i + 1}`} loading="lazy" />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Gallery;
