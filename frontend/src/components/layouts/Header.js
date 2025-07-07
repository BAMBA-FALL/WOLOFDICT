import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Menu, 
  X, 
  Globe, 
  BookOpen, 
  Shield, 
  LogIn, 
  UserPlus, 
  LogOut,
  Compass,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  Settings,
  User,
  HelpCircle,
  Home,
  MessageCircle,
  Calendar,
  Users,
  Heart,
  Book,
  SunMoon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ darkMode, toggleDarkMode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  // Effet pour détecter le défilement
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Effet de fermeture du menu mobile lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermeture des menus lors d'un clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fonction pour mettre le focus sur la recherche mobile
  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Fonction pour basculer le menu mobile
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Fonction pour basculer les notifications
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
  };

  // Gestion de la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
      searchInputRef.current?.blur();
      setIsMenuOpen(false);
    }
  };

  // Fonction pour vérifier si un lien est actif
  const isLinkActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Classes conditionnelles selon le mode
  const getThemeClass = (lightClass, darkClass) => {
    return darkMode ? darkClass : lightClass;
  };

  // Animation du menu mobile
  const menuVariants = {
    hidden: { 
      opacity: 0, 
      y: -20,
      transition: {
        type: 'tween',
        duration: 0.2
      }
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'tween',
        duration: 0.2
      }
    }
  };

  // Notifications de démonstration
  const notifications = [
    { id: 1, text: "Votre contribution a été approuvée", time: "Il y a 1 heure", isNew: true },
    { id: 2, text: "Nouveau commentaire sur votre définition", time: "Il y a 3 heures", isNew: true },
    { id: 3, text: "Bienvenue dans WolofDict!", time: "Il y a 2 jours", isNew: false }
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-2 shadow-md' : 'py-4'} ${getThemeClass('bg-white/95 backdrop-blur-sm', 'bg-gray-800/95 backdrop-blur-sm')}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo et navigation principale */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Book className={`w-8 h-8 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
              <span className={`text-xl font-bold ${getThemeClass('text-gray-900', 'text-white')}`}>WolofDict</span>
            </Link>
            
            <div className="hidden md:flex space-x-6 items-center">
              <Link to="/dictionary" className={`${getThemeClass('text-gray-700 hover:text-blue-600', 'text-gray-300 hover:text-blue-400')} transition-colors`}>
                Dictionnaire
              </Link>
              <Link to="/alphabet/:letter" className={`${getThemeClass('text-gray-700 hover:text-blue-600', 'text-gray-300 hover:text-blue-400')} transition-colors`}>
                Alphabet
              </Link>
              <Link to="/phrases" className={`${getThemeClass('text-gray-700 hover:text-blue-600', 'text-gray-300 hover:text-blue-400')} transition-colors`}>
                Phrases
              </Link>
              <Link to="/community" className={`${getThemeClass('text-gray-700 hover:text-blue-600', 'text-gray-300 hover:text-blue-400')} transition-colors`}>
                Communauté
              </Link>
            </div>
          </div>
          
          {/* Actions utilisateur */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={focusSearch}
              className={`p-2 rounded-full ${getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-700 text-gray-300 hover:bg-gray-600')} md:hidden`}
            >
              <Search className="w-5 h-5" />
            </button>
            
            <div className="hidden md:flex items-center space-x-2">
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className="relative" ref={notificationsRef}>
                <button 
                  onClick={toggleNotifications}
                  className={`p-2 rounded-full ${getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
                </button>
                
                {/* Panneau de notifications */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute right-0 mt-2 w-72 ${getThemeClass('bg-white shadow-xl', 'bg-gray-800 shadow-2xl')} rounded-xl overflow-hidden`}
                    >
                      <div className={`p-3 ${getThemeClass('bg-blue-50', 'bg-blue-900/30')} flex justify-between items-center`}>
                        <h3 className={`font-semibold ${getThemeClass('text-blue-800', 'text-blue-300')}`}>Notifications</h3>
                        <button className={`text-xs ${getThemeClass('text-blue-600', 'text-blue-400')}`}>Tout marquer comme lu</button>
                      </div>
                      <div className={`max-h-60 overflow-y-auto ${getThemeClass('', '')}`}>
                        {notifications.map((notification, index) => (
                          <div 
                            key={index} 
                            className={`p-3 border-b last:border-b-0 ${getThemeClass(
                              notification.isNew ? 'bg-blue-50' : 'bg-white', 
                              notification.isNew ? 'bg-blue-900/10' : 'bg-gray-800'
                            )} ${getThemeClass('border-gray-100', 'border-gray-700')}`}
                          >
                            <p className={`text-sm ${getThemeClass('text-gray-800', 'text-gray-200')}`}>{notification.text}</p>
                            <p className={`text-xs mt-1 ${getThemeClass('text-gray-500', 'text-gray-400')}`}>{notification.time}</p>
                          </div>
                        ))}
                      </div>
                      <div className={`p-2 text-center ${getThemeClass('bg-gray-50', 'bg-gray-900/30')}`}>
                        <Link to="/notifications" className={`text-sm ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}>
                          Voir toutes les notifications
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <Link 
                to="/login" 
                className={`py-2 px-4 rounded-lg font-medium ${getThemeClass('text-gray-700 hover:bg-gray-100', 'text-gray-300 hover:bg-gray-700')} transition-colors`}
              >
                Connexion
              </Link>
              
              <Link 
                to="/register" 
                className={`py-2 px-4 rounded-lg font-medium ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-600 text-white hover:bg-blue-700')} transition-colors`}
              >
                Inscription
              </Link>
            </div>
            
            <button 
              onClick={toggleMobileMenu}
              className={`p-2 rounded-full ${getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-700 text-gray-300 hover:bg-gray-600')} md:hidden`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`md:hidden ${getThemeClass('bg-white shadow-lg', 'bg-gray-800 shadow-2xl')}`}
          >
            <div className="container mx-auto px-4 py-3">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="relative">
                  <input 
                    type="text"
                    ref={searchInputRef}
                    placeholder="Rechercher un mot"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-xl ${getThemeClass(
                      'border border-gray-300 bg-gray-50', 
                      'border border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                    )}`}
                  />
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${getThemeClass('text-gray-400', 'text-gray-500')}`} />
                </div>
              </form>
              
              {/* Mobile Navigation */}
              <nav className="space-y-3">
                <Link 
                  to="/" 
                  className={`flex items-center space-x-3 p-3 rounded-xl ${getThemeClass(
                    isLinkActive('/') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50', 
                    isLinkActive('/') ? 'bg-blue-900/20 text-blue-300' : 'text-gray-300 hover:bg-gray-700'
                  )}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="w-5 h-5" />
                  <span>Accueil</span>
                </Link>
                
                <Link 
                  to="/dictionary" 
                  className={`flex items-center space-x-3 p-3 rounded-xl ${getThemeClass(
                    isLinkActive('/dictionary') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50', 
                    isLinkActive('/dictionary') ? 'bg-blue-900/20 text-blue-300' : 'text-gray-300 hover:bg-gray-700'
                  )}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Globe className="w-5 h-5" />
                  <span>Dictionnaire</span>
                </Link>
                
                <Link 
                  to="/alphabet/:letter" 
                  className={`flex items-center space-x-3 p-3 rounded-xl ${getThemeClass(
                    isLinkActive('/alphabet') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50', 
                    isLinkActive('/alphabet') ? 'bg-blue-900/20 text-blue-300' : 'text-gray-300 hover:bg-gray-700'
                  )}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Alphabet</span>
                </Link>
                
                <Link 
                  to="/phrases" 
                  className={`flex items-center space-x-3 p-3 rounded-xl ${getThemeClass(
                    isLinkActive('/phrases') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50', 
                    isLinkActive('/phrases') ? 'bg-blue-900/20 text-blue-300' : 'text-gray-300 hover:bg-gray-700'
                  )}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Phrases</span>
                </Link>
                
                <Link 
                  to="/community" 
                  className={`flex items-center space-x-3 p-3 rounded-xl ${getThemeClass(
                    isLinkActive('/community') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50', 
                    isLinkActive('/community') ? 'bg-blue-900/20 text-blue-300' : 'text-gray-300 hover:bg-gray-700'
                  )}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Users className="w-5 h-5" />
                  <span>Communauté</span>
                </Link>
                
                <div className="flex items-center justify-between p-3 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span>Mode {darkMode ? 'clair' : 'sombre'}</span>
                  </div>
                  <button 
                    onClick={toggleDarkMode}
                    className={`w-11 h-6 ${darkMode ? 'bg-blue-600' : 'bg-gray-300'} rounded-full p-1 transition-colors duration-300`}
                  >
                    <div 
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        darkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    ></div>
                  </button>
                </div>
              </nav>
              
              <div className="mt-4 mb-2 text-center">
                <Link 
                  to="/help" 
                  className={`text-sm ${getThemeClass('text-gray-500 hover:text-blue-600', 'text-gray-400 hover:text-blue-400')} flex items-center justify-center`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Besoin d'aide?
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;