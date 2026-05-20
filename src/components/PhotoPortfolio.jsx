import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Portfolio.css';

const PhotoPortfolio = () => {
  const navigate = useNavigate();

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
          style={{ cursor: 'pointer' }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          onClick={() => navigate('/gallery?tab=foto')}
        >
          <img src={`${import.meta.env.BASE_URL}productimage1.jpg`} alt="Photography Hero" />
        </motion.div>

        <div className="show-more-container">
          <button 
            className="btn-show-more"
            onClick={() => navigate('/gallery?tab=foto')}
          >
            Deschide Galeria
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
