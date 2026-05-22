import { useState } from 'react';
import { motion } from 'framer-motion';
import './Contact.css';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Auto-reset after a delay for demo purposes
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section className="contact" id="contact">
      <div className="contact__glow" />

      <motion.div
        className="contact__container"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="contact__title">
          Hai să vorbim
        </h2>
        <p className="contact__subtitle">
          Ai un proiect în minte? Completează formularul și revenim cu un plan personalizat.
        </p>

        {submitted ? (
          <motion.div 
            className="contact__success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              padding: '3rem 2rem', 
              background: 'rgba(255, 255, 255, 0.02)', 
              borderRadius: '16px', 
              border: '1px solid rgba(255, 255, 255, 0.05)', 
              backdropFilter: 'blur(10px)',
              marginTop: '2rem'
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3 style={{ color: '#ef4444', fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'Oxanium, sans-serif' }}>Mesaj Trimis!</h3>
            <p style={{ color: '#a1a1aa', maxWidth: '400px', fontSize: '0.95rem' }}>Îți mulțumim pentru interes. Echipa noastră te va contacta în cel mai scurt timp posibil.</p>
          </motion.div>
        ) : (
          <form className="contact__form" onSubmit={handleSubmit} id="contact-form">
            <div className="contact__row">
              <input
                className="contact__input"
                type="text"
                placeholder="Numele tău"
                id="contact-name"
                aria-label="Numele tău"
                required
              />
              <input
                className="contact__input"
                type="email"
                placeholder="Email"
                id="contact-email"
                aria-label="Email"
                required
              />
            </div>
            <input
              className="contact__input"
              type="text"
              placeholder="Subiect"
              id="contact-subject"
              aria-label="Subiect"
            />
            <textarea
              className="contact__textarea"
              placeholder="Spune-ne mai multe despre proiectul tău..."
              id="contact-message"
              aria-label="Spune-ne mai multe despre proiectul tău..."
              required
            />
            <button className="contact__submit" type="submit" id="contact-submit">
              Trimite mesajul
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
};

export default Contact;
