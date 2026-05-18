import { useState, useEffect } from 'react';
import '../components/Hero.css';
import Hero from '../components/Hero';
import Services from '../components/Services';
import VideoPortfolio from '../components/VideoPortfolio';
import PhotoPortfolio from '../components/PhotoPortfolio';
import WebPortfolio from '../components/WebPortfolio';
import Outro from '../components/Outro';
import Footer from '../components/Footer';
import FrameBackground from '../components/FrameBackground';

const Home = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ opacity: isVideoLoaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}>
      <Hero onVideoLoad={() => setIsVideoLoaded(true)} isVideoLoaded={isVideoLoaded} />
      <div className="app__content">
        <FrameBackground />
        <div className="portfolio-wrapper">
          <VideoPortfolio />
          <PhotoPortfolio />
          <WebPortfolio />
          <Services />
          <Outro />
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Home;
