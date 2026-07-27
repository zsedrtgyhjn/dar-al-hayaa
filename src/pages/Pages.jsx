import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { FAQ_ITEMS } from '../data/products';
import { useState } from 'react';
import styles from './Pages.module.css';

// ── Contact Page ──
export function ContactPage() {
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <>
      <Helmet><title>Contact — Dar Al Hayaa</title></Helmet>
      <div className={styles.pageHero}>
        <div className="container">
          <span className="section-tag">Nous contacter</span>
          <h1 className={styles.heroTitle}>Parlons-en !</h1>
          <p className={styles.heroDesc}>Notre équipe est disponible 7j/7 pour vous aider.</p>
        </div>
      </div>

      <div className="container section-sm">
        <div className={styles.contactLayout}>
          <div className={styles.contactInfo}>
            {[
              { icon: <Phone size={20} />, label: 'Téléphone', value: '05 03 74 43 36', sub: 'Lun-Sam 9h-19h' },
              { icon: <Mail size={20} />, label: 'Email', value: 'contact@daralhayaa.com', sub: 'Réponse sous 24h' },
              { icon: <MapPin size={20} />, label: 'Adresse', value: 'Cocody, Abidjan', sub: 'France' },
              { icon: <Clock size={20} />, label: 'Horaires', value: 'Lun-Sam 9h-19h', sub: 'Dimanche fermé' },
            ].map((item, i) => (
              <div key={i} className={styles.infoCard}>
                <div className={styles.infoIcon}>{item.icon}</div>
                <div>
                  <div className={styles.infoLabel}>{item.label}</div>
                  <div className={styles.infoValue}>{item.value}</div>
                  <div className={styles.infoSub}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Envoyer un message</h2>
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label className={styles.label}>Prénom</label>
                <input type="text" className={styles.input} placeholder="Votre prénom" required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Nom</label>
                <input type="text" className={styles.input} placeholder="Votre nom" required />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input type="email" className={styles.input} placeholder="votre@email.com" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Sujet</label>
              <select className={styles.input}>
                <option>Commande & Livraison</option>
                <option>Retour & Remboursement</option>
                <option>Produit & Stock</option>
                <option>Autre</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Message</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Décrivez votre demande..."
                rows={5}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn}>
              {sent ? '✅ Message envoyé !' : <><Send size={16} /> Envoyer le message</>}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ── FAQ Page ──
export function FAQPage() {
  const [open, setOpen] = useState(null);

  return (
    <>
      <Helmet><title>FAQ — Dar Al Hayaa</title></Helmet>
      <div className={styles.pageHero}>
        <div className="container">
          <span className="section-tag">Questions fréquentes</span>
          <h1 className={styles.heroTitle}>FAQ</h1>
          <p className={styles.heroDesc}>Toutes les réponses à vos questions les plus fréquentes.</p>
        </div>
      </div>

      <div className="container-sm section">
        {FAQ_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className={`${styles.faqItem} ${open === i ? styles.faqOpen : ''}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <button className={styles.faqQuestion} onClick={() => setOpen(open === i ? null : i)}>
              {item.question}
              <span className={styles.faqToggle}>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && (
              <motion.div
                className={styles.faqAnswer}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {item.answer}
              </motion.div>
            )}
          </motion.div>
        ))}

        <div className={styles.faqCta}>
          <p>Vous n'avez pas trouvé votre réponse ?</p>
          <Link to="/contact" className={styles.faqCtaBtn}>Contacter notre équipe</Link>
        </div>
      </div>
    </>
  );
}

// ── About Page ──
export function AboutPage() {
  return (
    <>
      <Helmet><title>À Propos — Dar Al Hayaa</title></Helmet>
      <div className={styles.pageHero}>
        <div className="container">
          <span className="section-tag">Notre Histoire</span>
          <h1 className={styles.heroTitle}>À Propos de Dar Al Hayaa</h1>
          <p className={styles.heroDesc}>Une passion pour la mode islamique, une mission de qualité.</p>
        </div>
      </div>

      <div className="container-sm section">
        <div className={styles.aboutContent}>
          <div className={styles.aboutText}>
            <h2 className={styles.aboutTitle}>Notre Mission</h2>
            <p>
              Dar Al Hayaa est née d'une conviction simple : chaque femme et chaque homme mérite de s'habiller 
              avec élégance, qualité et dans le respect de ses valeurs islamiques. 
            </p>
            <p>
              Fondée en 2018, notre boutique propose une sélection rigoureuse de vêtements pudiques, 
              accessoires islamiques, parfums halal et équipements électroniques, le tout 
              dans un cadre de confiance et de qualité certifiée.
            </p>
            <h2 className={styles.aboutTitle} style={{ marginTop: 32 }}>Nos Valeurs</h2>
            <div className={styles.values}>
              {[
                { emoji: '✦', title: 'Qualité', desc: 'Chaque article est sélectionné avec soin pour sa durabilité et son authenticité.' },
                { emoji: '🌙', title: 'Confiance', desc: 'Certifications halal, paiement sécurisé et service client transparent.' },
                { emoji: '💛', title: 'Communauté', desc: '+15 000 familles nous font confiance à travers toute la Côte d\'Ivoire.' },
                { emoji: '🌿', title: 'Éthique', desc: 'Partenariats avec des artisans respectueux des traditions islamiques.' },
              ].map((v, i) => (
                <div key={i} className={styles.valueCard}>
                  <div className={styles.valueEmoji}>{v.emoji}</div>
                  <div>
                    <div className={styles.valueTitle}>{v.title}</div>
                    <div className={styles.valueDesc}>{v.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Legal Pages ──
export function PrivacyPage() {
  return (
    <>
      <Helmet><title>Politique de Confidentialité — Dar Al Hayaa</title></Helmet>
      <div className={styles.pageHero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Politique de Confidentialité</h1>
        </div>
      </div>
      <div className="container-sm section">
        <div className={styles.legalContent}>
          <h2>1. Données collectées</h2>
          <p>Nous collectons uniquement les données nécessaires : nom, email, adresse de livraison et historique de commandes.</p>
          <h2>2. Utilisation des données</h2>
          <p>Vos données sont utilisées exclusivement pour le traitement de vos commandes et l'amélioration de nos services. Elles ne sont jamais vendues à des tiers.</p>
          <h2>3. Vos droits</h2>
          <p>Vous disposez d'un droit d'accès, de modification et de suppression de vos données. Contactez-nous à privacy@daralhayaa.com.</p>
          <h2>4. Cookies</h2>
          <p>Nous utilisons des cookies techniques essentiels au fonctionnement du site et, avec votre consentement, des cookies analytiques anonymisés.</p>
        </div>
      </div>
    </>
  );
}

export function TermsPage() {
  return (
    <>
      <Helmet><title>Conditions Générales — Dar Al Hayaa</title></Helmet>
      <div className={styles.pageHero}>
        <div className="container">
          <h1 className={styles.heroTitle}>Conditions Générales de Vente</h1>
        </div>
      </div>
      <div className="container-sm section">
        <div className={styles.legalContent}>
          <h2>1. Objet</h2>
          <p>Les présentes CGV régissent les ventes effectuées sur Dar Al Hayaa.com entre la société Dar Al Hayaa SAS et tout acheteur.</p>
          <h2>2. Commandes</h2>
          <p>Toute commande vaut acceptation des présentes CGV. La commande est confirmée par email lors de la validation du paiement.</p>
          <h2>3. Prix</h2>
          <p>Les prix affichés sont en euros TTC. Dar Al Hayaa se réserve le droit de modifier ses prix à tout moment.</p>
          <h2>4. Livraison</h2>
          <p>Les délais de livraison sont de 3 à 5 jours ouvrables. La livraison est gratuite dès 80€ d'achat.</p>
          <h2>5. Droit de rétractation</h2>
          <p>Vous disposez de 30 jours pour retourner tout article non porté dans son emballage d'origine.</p>
        </div>
      </div>
    </>
  );
}

export function OrderTrackingPage() {
  const [trackingId, setTrackingId] = useState('');
  const [result, setResult] = useState(null);

  const handleTrack = (e) => {
    e.preventDefault();
    setResult({
      id: trackingId,
      status: 'En transit',
      steps: [
        { label: 'Commande validée', done: true, date: '27 Jan 2025' },
        { label: 'En préparation', done: true, date: '27 Jan 2025' },
        { label: 'Expédié', done: true, date: '28 Jan 2025' },
        { label: 'En transit', done: true, date: '28 Jan 2025' },
        { label: 'Livré', done: false, date: 'Prévu 30 Jan 2025' },
      ],
    });
  };

  return (
    <>
      <Helmet><title>Suivi de Commande — Dar Al Hayaa</title></Helmet>
      <div className={styles.pageHero}>
        <div className="container">
          <span className="section-tag">Tracking</span>
          <h1 className={styles.heroTitle}>Suivi de Commande</h1>
        </div>
      </div>
      <div className="container-sm section">
        <form className={styles.trackForm} onSubmit={handleTrack}>
          <input
            type="text"
            className={styles.trackInput}
            placeholder="Entrez votre numéro de commande (ex: #NF-001)"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            required
          />
          <button type="submit" className={styles.trackBtn}>Rechercher</button>
        </form>

        {result && (
          <motion.div
            className={styles.trackResult}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.trackHeader}>
              <div>
                <div className={styles.trackId}>Commande {result.id}</div>
                <div className={styles.trackStatus}>📦 {result.status}</div>
              </div>
            </div>
            <div className={styles.trackSteps}>
              {result.steps.map((step, i) => (
                <div key={i} className={`${styles.step} ${step.done ? styles.stepDone : ''}`}>
                  <div className={styles.stepDot} />
                  {i < result.steps.length - 1 && <div className={styles.stepLine} />}
                  <div className={styles.stepInfo}>
                    <div className={styles.stepLabel}>{step.label}</div>
                    <div className={styles.stepDate}>{step.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
