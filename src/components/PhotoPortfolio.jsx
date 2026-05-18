import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Portfolio.css';

const PhotoPortfolio = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const galleryImages = [
    'productimage2.jpg',
    'productimage3.jpg',
  ];

  return (
    <section className="portfolio-section portfolio-section--elevated" id="photo">
      <div className="section-container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Branding & Product</h2>
        </motion.div>

        {/* Hero Photograph */}
        <motion.div 
          className="feature-media feature-media--portrait"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img src="productimage1.jpg" alt="Photography Hero" />
        </motion.div>

        {/* Expandable Gallery */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="expand-container"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                {galleryImages.map((src, i) => (
                  <motion.div 
                    key={i}
                    className="feature-media feature-media--full"
                    style={{ flex: '0 1 30%', minWidth: '200px', maxWidth: '300px' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <img src={src} alt={`Gallery item ${i + 1}`} loading="lazy" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="show-more-container">
          <button 
            className={`btn-show-more ${isExpanded ? 'btn-show-more--active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Arată Mai Puțin' : 'Deschide Galeria'}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
            </svg>
          </button>
        </div>

        <div className="scroll-next-wrapper">
          <a href="#web" className="scroll-next-link">
            <div className="scroll-chevron-icon">
              <span className="scroll-chevron" />
              <span className="scroll-chevron" />
              <span className="scroll-chevron" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
};

export default PhotoPortfolio;
