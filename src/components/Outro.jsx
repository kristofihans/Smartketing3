import { useState } from 'react';
import { motion } from 'framer-motion';
import './Outro.css';
import './Contact.css';

const clients = [
  'LUXE STUDIO',
  'VELOCITY MEDIA',
  'ECHO VIBES',
  'URBAN PULSE',
  'PURE ESSENCE',
  'GLOBAL REACH',
];

const Outro = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const name = document.getElementById('outro-contact-name')?.value;
    const email = document.getElementById('outro-contact-email')?.value;
    const message = document.getElementById('outro-contact-message')?.value;

    try {
      await fetch('https://script.google.com/macros/s/AKfycbzD3fl_xESWUMNNjiabC6Wp18FbE_UJ6RzzqWcE0gkRA0KWHylJcK9jk2bAMei1m9qT9A/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ name, email, message })
      });
      setSubmitted(true);
      e.target.reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('A apărut o eroare la trimiterea mesajului. Te rugăm să încerci din nou.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="outro">
      <div className="credits">
        <div className="credits__grid">
          {clients.map((client, i) => (
            <motion.span 
              key={i}
              className="client-logo"
              initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ 
                duration: 1.2, 
                delay: i * 0.15,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ opacity: 1, scale: 1.08, color: '#ef4444' }}
            >
              {client}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="outro__separator" />

      <motion.div
        className="contact__container"
        id="contact"
        initial={{ opacity: 0, y: 50, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="contact__title">
          Ești gata să creștem?
        </h2>
        <p className="contact__subtitle">
          Contactează-ne acum și hai să dăm viață ideilor tale.
        </p>

        {submitted ? (
          <motion.div 
            className="contact__success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3>Mesaj Trimis!</h3>
            <p>Echipa noastră a primit solicitarea ta. Te vom contacta în curând.</p>
          </motion.div>
        ) : (
          <form className="contact__form" onSubmit={handleSubmit} id="outro-contact-form">
            <div className="contact__row">
              <input
                className="contact__input"
                type="text"
                placeholder="Numele tău"
                id="outro-contact-name"
                aria-label="Numele tău"
                required
              />
              <input
                className="contact__input"
                type="email"
                placeholder="Email"
                id="outro-contact-email"
                aria-label="Email"
                required
              />
            </div>
            <textarea
              className="contact__textarea"
              placeholder="Mesajul tău..."
              id="outro-contact-message"
              aria-label="Mesajul tău..."
              required
            />
            <button 
              className="contact__submit" 
              type="submit" 
              id="outro-contact-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Se trimite...' : 'Trimite Cererea'}
            </button>
          </form>
        )}
      </motion.div>
    </section>
  );
};

export default Outro;
