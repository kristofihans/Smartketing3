import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const navLinks = [
  { label: 'Servicii', href: '/#services' },
  { label: 'Portofoliu', href: '/gallery' },
  { label: 'Contact', href: '/#contact' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isGallery = location.pathname.includes('/gallery');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <motion.nav
      className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${isGallery ? 'navbar--gallery' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to="/" className="navbar__logo">
        <img src="logo.png" alt="Smartketing" className="navbar__logo-img" />
      </Link>

      {/* Desktop Links */}
      <ul className="navbar__links">
        {navLinks.map((link) => (
          <li key={link.label}>
            {link.href.startsWith('/#') ? (
              <a className="navbar__link" href={link.href}>{link.label}</a>
            ) : (
              <Link className="navbar__link" to={link.href}>{link.label}</Link>
            )}
          </li>
        ))}
      </ul>

      {/* Desktop CTA */}
      <a href="#contact" className="navbar__cta navbar__cta-desktop">
        Hai să vorbim
      </a>

      {/* Mobile Hamburger */}
      <div
        className={`navbar__hamburger ${menuOpen ? 'navbar__hamburger--open' : ''}`}
        onClick={() => setMenuOpen(!menuOpen)}
        role="button"
        aria-label="Toggle menu"
        id="navbar-hamburger"
      >
        <span />
        <span />
        <span />
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.ul
            className="navbar__mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {navLinks.map((link, i) => (
              <motion.li
                key={link.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.5 }}
              >
                {link.href.startsWith('/#') ? (
                  <a
                    className="navbar__mobile-link"
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    className="navbar__mobile-link"
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </motion.li>
            ))}
            <motion.li
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <a
                className="navbar__mobile-cta"
                href="#contact"
                onClick={() => setMenuOpen(false)}
              >
                Hai să vorbim
              </a>
            </motion.li>
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
