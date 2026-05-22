import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';

const Gallery = lazy(() => import('./pages/Gallery'));

function App() {
  return (
    <Router basename="/Smartketing2">
      <div className="app">
        <Navbar />
        <Suspense fallback={
          <div className="lazy-loader">
            <div className="lazy-spinner" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <WhatsAppButton />
      </div>
    </Router>
  );
}

export default App;

