import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Portfolio.css';

const WebPortfolio = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const webCases = [
    'web2.png',
  ];

  return (
    <section className="portfolio-section" id="web">
      <div className="section-container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title">Digital Experiences</h2>
        </motion.div>

        {/* Mockup Display */}
        <motion.div 
          className="feature-media feature-media--portrait"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img src="web1.png" alt="Web Design Mockup" />
        </motion.div>

        {/* Expandable Case Studies */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="expand-grid"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="expand-grid" style={{ paddingTop: '2rem' }}>
                {webCases.map((src, i) => (
                  <motion.div 
                    key={i}
                    className="grid-item grid-item--landscape"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <img src={src} alt={`Web Case ${i + 1}`} loading="lazy" />
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
            {isExpanded ? 'Arată Mai Puțin' : 'Vezi Studii de Caz'}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default WebPortfolio;
