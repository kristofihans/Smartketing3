import { motion } from 'framer-motion';
import { React } from 'react';
import './Services.css';

const services = [
  {
    id: '01',
    title: 'Productie Video',
    desc: 'Cinematografie de înaltă clasă pentru branduri care vor să iasă în evidență.',
    size: 'span-2'
  },
  {
    id: '02',
    title: 'Fotografie Profitabilă',
    desc: 'Imagini care vând, de la catalog la lifestyle.',
    size: 'span-1'
  },
  {
    id: '03',
    title: 'Web Design Custom',
    desc: 'Interfețe arhitecturale construite pentru conversie.',
    size: 'span-1'
  },
  {
    id: '04',
    title: 'Strategie Social Media',
    desc: 'Planificare bazată pe date pentru creștere organică și viralitate.',
    size: 'span-2'
  },
  {
    id: '05',
    title: 'Performance Marketing',
    desc: 'Campanii PPC optimizate pentru cel mai bun ROI.',
    size: 'span-1'
  },
  {
    id: '06',
    title: 'Consultanță de Brand',
    desc: 'Definim vocea și identitatea afacerii tale în era digitală.',
    size: 'span-1'
  }
];

const Services = () => {
  return (
    <section className="services" id="services">
      {/* Content Layer */}
      <div className="services__content-wrapper">
        <div className="services__header">
          <h2 className="services__title">
            SERVICII
          </h2>
          <p className="services__subtitle">
            Tot ce ai nevoie pentru a domina digital-ul, sub un singur acoperiș.
          </p>
        </div>

        <div className="services__grid">
          {services.map((s, index) => (
            <motion.div 
              key={s.id} 
              className={`bento-card ${s.size}`}
              whileHover={{ y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
            >
              <h3 className="bento-card__title">{s.title}</h3>
              <p className="bento-card__desc">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="scroll-next-wrapper">
          <a href="#contact" className="scroll-next-link">
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

export default Services;
