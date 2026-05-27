import { memo } from 'react';
import './Footer.css';

const Footer = memo(() => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" id="footer">
      <div className="footer__container">
        <img src={`${import.meta.env.BASE_URL}logo.webp`} alt="Smartketing Logo" className="footer__logo" />

        <p className="footer__copy">&copy; {year} Smartketing. Toate drepturile rezervate.</p>

        <ul className="footer__socials">
          <li>
            <a href="#" className="footer__social-link" aria-label="Instagram">Instagram</a>
          </li>
          <li>
            <a href="#" className="footer__social-link" aria-label="TikTok">TikTok</a>
          </li>
          <li>
            <a href="#" className="footer__social-link" aria-label="Facebook">Facebook</a>
          </li>
          <li>
            <a href="#" className="footer__social-link" aria-label="LinkedIn">LinkedIn</a>
          </li>
        </ul>
      </div>

      <div className="footer__divider" />

      <div className="footer__bottom">
        <ul className="footer__bottom-links">
          <li><a href="#" className="footer__bottom-link">Politica de confidențialitate</a></li>
          <li><a href="#" className="footer__bottom-link">Termeni și condiții</a></li>
        </ul>
        <span className="footer__credit">Crafted with 🔥 by Smartketing</span>
      </div>
    </footer>
  );
});

export default Footer;
