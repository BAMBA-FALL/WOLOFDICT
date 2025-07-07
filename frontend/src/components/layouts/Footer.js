import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Globe, 
  Send, 
  Facebook, 
  Twitter, 
  Instagram, 
  Mail,
  Heart,
  MapPin,
  Headphones,
  Book,
  MessageCircle,
  Users,
  ExternalLink,
  ArrowUp,
  ArrowRight,
  Smartphone,
  SunMoon,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const Footer = ({ darkMode, toggleDarkMode }) => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Classes conditionnelles selon le mode
  const getThemeClass = (lightClass, darkClass) => {
    return darkMode ? darkClass : lightClass;
  };

  // Fonction pour la gestion de l'abonnement à la newsletter
  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      // Simuler un appel API pour l'abonnement
      setTimeout(() => {
        setSubscribed(true);
        setEmail('');
      }, 500);
    }
  };

  return (
    <footer className={`${getThemeClass('bg-gray-100', 'bg-gray-900')} border-t ${getThemeClass('border-gray-200', 'border-gray-800')}`}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Book className={`w-8 h-8 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
              <span className={`text-xl font-bold ${getThemeClass('text-gray-900', 'text-white')}`}>WolofDict</span>
            </div>
            <p className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-400')} mb-4`}>
              La plus grande ressource en ligne pour l'apprentissage et la préservation de la langue wolof.
            </p>
            <div className="flex space-x-3">
              {[
                { icon: Facebook, label: 'facebook', url: '#' },
                { icon: Twitter, label: 'twitter', url: '#' },
                { icon: Instagram, label: 'instagram', url: '#' },
                { icon: ExternalLink, label: 'youtube', url: '#' }
              ].map((social) => (
                <a 
                  key={social.label}
                  href={social.url}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${getThemeClass('bg-gray-200 text-gray-700 hover:bg-blue-600 hover:text-white', 'bg-gray-800 text-gray-400 hover:bg-blue-600 hover:text-white')} transition-colors`}
                  aria-label={`Rejoignez-nous sur ${social.label}`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className={`text-md font-semibold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>Découvrir</h3>
            <ul className="space-y-3">
              {[
                { text: 'Dictionnaire complet', url: '/dictionary' },
                { text: 'Alphabet wolof', url: '/alphabet' },
                { text: 'Expressions courantes', url: '/expressions' },
                { text: 'Quiz et jeux', url: '/games' },
                { text: 'Ressources pédagogiques', url: '/resources' }
              ].map((link) => (
                <li key={link.text}>
                  <Link 
                    to={link.url}
                    className={`text-sm ${getThemeClass('text-gray-600 hover:text-blue-600', 'text-gray-400 hover:text-blue-400')} transition-colors`}
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className={`text-md font-semibold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>Communauté</h3>
            <ul className="space-y-3">
              {[
                { text: 'Comment contribuer', url: '/contribute' },
                { text: 'Forum de discussion', url: '/forum' },
                { text: 'Événements', url: '/events' },
                { text: 'Contributeurs', url: '/contributors' },
                { text: 'Partenaires', url: '/partners' }
              ].map((link) => (
                <li key={link.text}>
                  <Link 
                    to={link.url}
                    className={`text-sm ${getThemeClass('text-gray-600 hover:text-blue-600', 'text-gray-400 hover:text-blue-400')} transition-colors`}
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className={`text-md font-semibold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>Informations</h3>
            <ul className="space-y-3">
              {[
                { text: 'À propos de nous', url: '/about' },
                { text: 'Équipe', url: '/team' },
                { text: 'Politique de confidentialité', url: '/privacy' },
                { text: 'Conditions d\'utilisation', url: '/terms' },
                { text: 'Contact', url: '/contact' }
              ].map((link) => (
                <li key={link.text}>
                  <Link 
                    to={link.url}
                    className={`text-sm ${getThemeClass('text-gray-600 hover:text-blue-600', 'text-gray-400 hover:text-blue-400')} transition-colors`}
                  >
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className={`mt-6 p-4 rounded-xl ${getThemeClass('bg-blue-50', 'bg-blue-900/20')}`}>
              <h4 className={`text-sm font-medium mb-2 ${getThemeClass('text-blue-800', 'text-blue-300')}`}>
                Newsletter
              </h4>
              <p className={`text-xs mb-3 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                Recevez les dernières mises à jour et actualités.
              </p>
              <form className="flex" onSubmit={handleSubscribe}>
                <input 
                  type="email" 
                  placeholder="Votre email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`flex-grow px-3 py-2 text-sm rounded-l-lg focus:outline-none ${getThemeClass('bg-white border border-gray-300', 'bg-gray-700 border border-gray-600 text-white')}`}
                  required
                />
                <button 
                  type="submit" 
                  className={`px-3 py-2 rounded-r-lg ${getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')}`}
                >
                  OK
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className={`pt-6 border-t ${getThemeClass('border-gray-200', 'border-gray-800')} flex flex-col md:flex-row justify-between items-center`}>
          <div className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')} mb-4 md:mb-0`}>
            © {currentYear} WolofDict. Tous droits réservés.
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={toggleDarkMode}
              className={`flex items-center text-sm ${getThemeClass('text-gray-500 hover:text-gray-700', 'text-gray-400 hover:text-gray-300')} transition-colors`}
            >
              <SunMoon className="w-4 h-4 mr-1" />
              Mode {darkMode ? 'Clair' : 'Sombre'}
            </button>
            <Link 
              to="#top" 
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center text-sm ${getThemeClass('text-gray-500 hover:text-gray-700', 'text-gray-400 hover:text-gray-300')} transition-colors`}
            >
              Retour en haut
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;