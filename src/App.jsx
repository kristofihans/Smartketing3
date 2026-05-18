import './App.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import VideoPortfolio from './components/VideoPortfolio';
import PhotoPortfolio from './components/PhotoPortfolio';
import WebPortfolio from './components/WebPortfolio';
import Outro from './components/Outro';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import FrameBackground from './components/FrameBackground';

function App() {
  return (
    <div className="app">

      <Navbar />
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
      <WhatsAppButton />
    </div>
  );
}

export default App;

