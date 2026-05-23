import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VideoCard from './VideoCard';
import './Portfolio.css';

const VideoPortfolio = () => {
  const navigate = useNavigate();

  return (
    <section className="portfolio-section portfolio-section--first" id="video">
      <div className="section-container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="section-title">Visual Stories</h2>
        </motion.div>

        {/* Flagship Video */}
        <motion.div 
          className="feature-media feature-media--portrait"
          style={{ cursor: 'pointer' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <VideoCard 
            src={`${import.meta.env.BASE_URL}video.mp4`} 
            autoPlay={true} 
          />
        </motion.div>

        <div className="show-more-container">
          <button 
            className="btn-show-more"
            onClick={() => navigate('/gallery?tab=video')}
          >
            Vezi Mai Multe Proiecte
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
            </svg>
          </button>
        </div>

        <div className="scroll-next-wrapper">
          <a href="#photo" className="scroll-next-link" aria-label="Mergi la secțiunea Branding & Product">
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

export default VideoPortfolio;
