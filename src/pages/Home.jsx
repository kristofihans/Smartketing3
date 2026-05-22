import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    if (hash) {
      const timer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <div>
      <Hero />
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
