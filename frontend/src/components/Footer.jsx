import { Link } from 'react-router-dom';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🎓 Uniora</h3>
            <p>
              La plateforme SaaS de gestion universitaire nouvelle génération.
              Simplifiez l'administration de votre université avec nos outils modernes.
            </p>
            <div className="footer-social">
              <a href="#">FB</a>
              <a href="#">X</a>
              <a href="#">IN</a>
              <a href="#">IG</a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Menu</h4>
            <a href="/#home">Accueil</a>
            <a href="/#about">À Propos</a>
            <a href="/#features">Avantages</a>
            <a href="/#faq">FAQ</a>
          </div>

          <div className="footer-column">
            <h4>Plateforme</h4>
            <Link to="/register">Inscrire mon université</Link>
            <Link to="/login">Connexion</Link>
            <Link to="/forgot-password">Mot de passe oublié</Link>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <a href="#"><Mail size={14} style={{display:'inline', marginRight:6}} />contact@uniportal.dz</a>
            <a href="#"><Phone size={14} style={{display:'inline', marginRight:6}} />+213 55 88 62 07</a>
            <a href="#"><MapPin size={14} style={{display:'inline', marginRight:6}} />Tlemcen, Algérie</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Uniora. Tous droits réservés.</span>
          <span>Fait avec ❤️ en Algérie</span>
        </div>
      </div>
    </footer>
  );
}
