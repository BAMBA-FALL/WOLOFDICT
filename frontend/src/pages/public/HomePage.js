import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Book, 
  Search, 
  Globe, 
  Users, 
  ArrowRight, 
  BookOpen, 
  Mic, 
  Share2,
  UserPlus,
  Star,
  Play,
  Heart,
  Sparkles,
  SunMoon,
  Menu,
  X,
  Calendar,
  MessageCircle,
  ChevronRight,
  Bell,
  Bookmark,
  ThumbsUp,
  Headphones,
  Coffee,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage = () => {
  const [featuredWords, setFeaturedWords] = useState([]);
  const [trendingWords, setTrendingWords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeCategory, setActiveCategory] = useState('tous');
  const [userStats, setUserStats] = useState({ contributions: 342, streak: 12 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const searchInputRef = useRef(null);
  const notificationRef = useRef(null);
  
  // Détection du défilement pour animer la navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Fermer le menu des notifications lorsqu'on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Simulation de mots mis en vedette (à remplacer par un appel API réel)
  useEffect(() => {
    const mockFeaturedWords = [
      {
        id: 1,
        wolof: 'Teranga',
        français: 'Hospitalité',
        pronunciation: '/teʁanga/',
        description: 'Concept culturel sénégalais désignant l\'accueil chaleureux et la générosité envers les visiteurs, reflétant une valeur centrale de la société.',
        category: 'culture',
        likes: 328,
        saved: false
      },
      {
        id: 2,
        wolof: 'Jàmm',
        français: 'Paix',
        pronunciation: '/dʒàmm/',
        description: 'Un mot qui symbolise la tranquillité et l\'harmonie dans la culture wolof, souvent utilisé comme salutation et vœu pour autrui.',
        category: 'quotidien',
        likes: 245,
        saved: true
      },
      {
        id: 3,
        wolof: 'Dëgg',
        français: 'Vrai/Vérité',
        pronunciation: '/dɛg/',
        description: 'Expression fondamentale exprimant la vérité et l\'authenticité, essentielle dans la communication quotidienne et les traditions orales.',
        category: 'philosophie',
        likes: 189,
        saved: false
      },
      {
        id: 4,
        wolof: 'Nàmm',
        français: 'Habitude',
        pronunciation: '/nàmm/',
        description: 'Désigne une coutume ou une habitude, reflétant les comportements réguliers et les traditions dans la société wolof.',
        category: 'culture',
        likes: 156,
        saved: false
      },
      {
        id: 5,
        wolof: 'Ndank-ndank',
        français: 'Lentement',
        pronunciation: '/ndank-ndank/',
        description: 'Expression idiomatique signifiant "pas à pas" ou "petit à petit", symbolisant la patience dans la progression.',
        category: 'proverbe',
        likes: 217,
        saved: true
      },
      {
        id: 6,
        wolof: 'Mbokk',
        français: 'Famille/Parent',
        pronunciation: '/mbok:/',
        description: 'Terme désignant les membres de la famille ou de la parenté élargie, soulignant l\'importance des liens familiaux.',
        category: 'quotidien',
        likes: 198,
        saved: false
      }
    ];

    const mockTrendingWords = [
      {
        id: 7,
        wolof: 'Xarit',
        français: 'Ami',
        pronunciation: '/xaʁit/',
        category: 'quotidien'
      },
      {
        id: 8,
        wolof: 'Baaxal',
        français: 'Pardonner',
        pronunciation: '/ba:xal/',
        category: 'verbes'
      },
      {
        id: 9,
        wolof: 'Jigéen',
        français: 'Femme',
        pronunciation: '/dʒigé:n/',
        category: 'quotidien'
      },
      {
        id: 10,
        wolof: 'Làkk',
        français: 'Langue',
        pronunciation: '/làk:/',
        category: 'culture'
      },
      {
        id: 11,
        wolof: 'Liggéey',
        français: 'Travailler',
        pronunciation: '/lig:é:j/',
        category: 'verbes'
      }
    ];
    
    const mockRecentActivity = [
      {
        id: 1,
        type: 'comment',
        username: 'Fatou',
        word: 'Teranga',
        time: 'il y a 2 heures'
      },
      {
        id: 2,
        type: 'newWord',
        username: 'Ibrahim',
        word: 'Mbalax',
        time: 'il y a 5 heures'
      },
      {
        id: 3,
        type: 'translation',
        username: 'Sophie',
        word: 'Jàmm',
        time: 'hier'
      }
    ];
    
    const mockTestimonials = [
      {
        id: 1,
        name: 'Moussa',
        role: 'Étudiant en linguistique',
        text: 'Cette plateforme m\'a permis de redécouvrir ma langue maternelle avec une nouvelle perspective scientifique.',
        image: '/api/placeholder/48/48'
      },
      {
        id: 2,
        name: 'Marie',
        role: 'Chercheuse culturelle',
        text: 'Un outil indispensable pour documenter et préserver le patrimoine linguistique wolof pour les générations futures.',
        image: '/api/placeholder/48/48'
      },
      {
        id: 3,
        name: 'Jean',
        role: 'Professeur de langues',
        text: 'La richesse des définitions et des exemples contextuels facilite grandement l\'apprentissage pour mes étudiants.',
        image: '/api/placeholder/48/48'
      }
    ];

    setFeaturedWords(mockFeaturedWords);
    setTrendingWords(mockTrendingWords);
    setRecentActivity(mockRecentActivity);
    setTestimonials(mockTestimonials);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Redirection vers la page de recherche
      alert(`Recherche: ${searchTerm}`);
      // Dans une application réelle: window.location.href = `/search?q=${encodeURIComponent(searchTerm)}`;
    }
  };
  
  const toggleWordSave = (wordId) => {
    setFeaturedWords(
      featuredWords.map(word => 
        word.id === wordId ? {...word, saved: !word.saved} : word
      )
    );
  };
  
  const toggleWordLike = (wordId) => {
    setFeaturedWords(
      featuredWords.map(word => 
        word.id === wordId ? 
          {...word, likes: word.saved ? word.likes - 1 : word.likes + 1, saved: !word.saved} : 
          word
      )
    );
  };
  
  const filterWordsByCategory = (category) => {
    setActiveCategory(category);
  };

  // Utilitaire pour les classes conditionnelles basées sur le mode
  const getThemeClass = (lightClass, darkClass) => {
    return darkMode ? darkClass : lightClass;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getThemeClass('bg-gray-50', 'bg-gray-900')}`}> 
      {/* Menu mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`fixed top-16 left-0 right-0 z-40 ${getThemeClass('bg-white shadow-xl', 'bg-gray-800 shadow-2xl')} md:hidden`}
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                <Link 
                  to="/dictionary" 
                  className={`py-3 px-4 rounded-lg ${getThemeClass('hover:bg-gray-100', 'hover:bg-gray-700')} flex items-center`}
                  onClick={toggleMobileMenu}
                >
                  <BookOpen className="w-5 h-5 mr-3" />
                  <span>Dictionnaire</span>
                </Link>
                <Link 
                  to="/alphabet" 
                  className={`py-3 px-4 rounded-lg ${getThemeClass('hover:bg-gray-100', 'hover:bg-gray-700')} flex items-center`}
                  onClick={toggleMobileMenu}
                >
                  <Book className="w-5 h-5 mr-3" />
                  <span>Alphabet</span>
                </Link>
                <Link 
                  to="/phrases" 
                  className={`py-3 px-4 rounded-lg ${getThemeClass('hover:bg-gray-100', 'hover:bg-gray-700')} flex items-center`}
                  onClick={toggleMobileMenu}
                >
                  <MessageCircle className="w-5 h-5 mr-3" />
                  <span>Phrases</span>
                </Link>
                <Link 
                  to="/community" 
                  className={`py-3 px-4 rounded-lg ${getThemeClass('hover:bg-gray-100', 'hover:bg-gray-700')} flex items-center`}
                  onClick={toggleMobileMenu}
                >
                  <Users className="w-5 h-5 mr-3" />
                  <span>Communauté</span>
                </Link>
                
                <div className={`h-px my-2 ${getThemeClass('bg-gray-200', 'bg-gray-700')}`}></div>
                
                <button 
                  onClick={() => {
                    toggleDarkMode();
                    toggleMobileMenu();
                  }}
                  className={`py-3 px-4 rounded-lg ${getThemeClass('hover:bg-gray-100', 'hover:bg-gray-700')} flex items-center justify-between`}
                >
                  <div className="flex items-center">
                    <SunMoon className="w-5 h-5 mr-3" />
                    <span>Mode {darkMode ? 'Clair' : 'Sombre'}</span>
                  </div>
                  <div className={`w-10 h-6 ${getThemeClass('bg-gray-200', 'bg-gray-600')} rounded-full p-1 transition-colors`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </button>
                
                <Link 
                  to="/login" 
                  className={`py-3 px-4 rounded-lg ${getThemeClass('hover:bg-gray-100', 'hover:bg-gray-700')} flex items-center`}
                  onClick={toggleMobileMenu}
                >
                  <span>Connexion</span>
                </Link>
                
                <Link 
                  to="/register" 
                  className={`py-3 px-4 rounded-lg ${getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')} flex items-center`}
                  onClick={toggleMobileMenu}
                >
                  <UserPlus className="w-5 h-5 mr-3" />
                  <span>Inscription</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="pt-24 pb-16">
        {/* Section Héro */}
        <section className={`${getThemeClass('bg-gradient-to-br from-blue-50 to-blue-100', 'bg-gradient-to-br from-gray-800 to-gray-900')} py-16`}>
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className={`text-4xl md:text-6xl font-bold ${getThemeClass('text-gray-900', 'text-white')} mb-6 leading-tight`}>
                  Découvrez la Richesse de la <span className={`${getThemeClass('text-blue-600', 'text-blue-400')}`}>Langue Wolof</span>
                </h1>
                
                <p className={`text-xl ${getThemeClass('text-gray-600', 'text-gray-300')} max-w-3xl mx-auto mb-10`}>
                  Un dictionnaire collaboratif pour explorer, comprendre et préserver la langue wolof. 
                  Chaque mot raconte une histoire, chaque définition est un pont culturel.
                </p>
  
                {/* Barre de recherche */}
                <form 
                  onSubmit={handleSearch} 
                  className={`max-w-2xl mx-auto flex items-center ${getThemeClass('bg-white', 'bg-gray-800')} rounded-full shadow-2xl overflow-hidden`}
                >
                  <Search className={`ml-6 ${getThemeClass('text-gray-400', 'text-gray-500')}`} />
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Recherchez un mot wolof ou français..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`flex-grow px-4 py-4 text-lg focus:outline-none ${getThemeClass('bg-white text-gray-800', 'bg-gray-800 text-white')}`}
                  />
                  <button 
                    type="submit" 
                    className={`px-6 py-4 ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-600 text-white hover:bg-blue-700')} transition-colors`}
                  >
                    Rechercher
                  </button>
                </form>
                
                <div className="flex flex-wrap justify-center mt-6 gap-2">
                  <span className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>Recherches populaires:</span>
                  {["Teranga", "Jàmm", "Xarit", "Nit"].map((term, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchTerm(term)}
                      className={`text-sm px-3 py-1 rounded-full ${getThemeClass('bg-white/80 text-blue-600 hover:bg-white', 'bg-gray-700/80 text-blue-300 hover:bg-gray-700')}`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Statistiques rapides */}
        <div className={`${getThemeClass('bg-white', 'bg-gray-800')} py-8 border-b ${getThemeClass('border-gray-100', 'border-gray-700')}`}>
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {[
                { number: "5,420+", label: "Mots répertoriés", icon: BookOpen },
                { number: "12,800+", label: "Utilisateurs actifs", icon: Users },
                { number: "320+", label: "Contributeurs", icon: UserPlus },
                { number: "98%", label: "Satisfaction", icon: ThumbsUp },
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="text-center"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 mb-3 rounded-full ${getThemeClass('bg-blue-50 text-blue-600', 'bg-blue-900/30 text-blue-400')}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${getThemeClass('text-gray-900', 'text-white')}`}>
                    {stat.number}
                  </div>
                  <div className={`text-xs md:text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Mots en Vedette */}
        <section className={`${getThemeClass('bg-white', 'bg-gray-800')} py-16`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <div className="mb-4 md:mb-0">
                <h2 className={`text-3xl font-bold ${getThemeClass('text-gray-900', 'text-white')} flex items-center`}>
                  <Star className={`w-8 h-8 ${getThemeClass('text-amber-500', 'text-amber-400')} mr-2`} />
                  <span>Mots du Jour</span>
                </h2>
                <p className={`mt-2 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                  Plongez dans la richesse linguistique du wolof avec notre sélection.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => filterWordsByCategory('tous')}
                  className={`px-4 py-2 rounded-full text-sm ${
                    activeCategory === 'tous' 
                      ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/50 text-blue-300') 
                      : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-700 text-gray-300 hover:bg-gray-600')
                  }`}
                >
                  Tous
                </button>
                
                {['culture', 'quotidien', 'philosophie', 'proverbe'].map((category) => (
                  <button 
                    key={category}
                    onClick={() => filterWordsByCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm ${
                      activeCategory === category 
                        ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/50 text-blue-300') 
                        : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-700 text-gray-300 hover:bg-gray-600')
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredWords
                .filter(word => activeCategory === 'tous' || word.category === activeCategory)
                .map((word, index) => (
                  <motion.div 
                    key={word.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.1,
                      duration: 0.5 
                    }}
                    className={`${getThemeClass('bg-gray-50', 'bg-gray-900')} rounded-2xl p-6 shadow-md hover:shadow-xl transition-all flex flex-col`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className={`text-2xl font-bold ${getThemeClass('text-blue-800', 'text-blue-400')}`}>{word.wolof}</h3>
                        <span className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>{word.pronunciation}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs ${getThemeClass(
                        word.category === 'culture' ? 'bg-purple-100 text-purple-800' : 
                        word.category === 'quotidien' ? 'bg-green-100 text-green-800' :
                        word.category === 'philosophie' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800',
                        word.category === 'culture' ? 'bg-purple-900/30 text-purple-400' : 
                        word.category === 'quotidien' ? 'bg-green-900/30 text-green-400' :
                        word.category === 'philosophie' ? 'bg-amber-900/30 text-amber-400' :
                        'bg-blue-900/30 text-blue-400'
                      )}`}>
                        {word.category.charAt(0).toUpperCase() + word.category.slice(1)}
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-4 flex-grow ${getThemeClass('text-gray-700', 'text-gray-300')}`}>{word.description}</p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                      <span className={`text-lg font-semibold ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                        {word.français}
                      </span>
                      
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => toggleWordLike(word.id)}
                          className="flex items-center space-x-1"
                        >
                          <ThumbsUp className={`w-4 h-4 ${word.likes > 200 ? getThemeClass('text-blue-600', 'text-blue-400') : getThemeClass('text-gray-400', 'text-gray-500')}`} />
                          <span className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-400')}`}>{word.likes}</span>
                        </button>
                        
                        <button 
                          onClick={() => toggleWordSave(word.id)}
                          className={`p-1 rounded-full ${
                            word.saved 
                              ? getThemeClass('text-amber-500', 'text-amber-400') 
                              : getThemeClass('text-gray-400 hover:text-amber-500', 'text-gray-500 hover:text-amber-400')
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${word.saved ? 'fill-current' : ''}`} />
                        </button>
                        
                        <Link 
                          to={`/words/${word.id}`} 
                          className={`p-1 rounded-full ${getThemeClass('text-blue-600 hover:bg-blue-50', 'text-blue-400 hover:bg-blue-900/20')}`}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="mt-10 text-center">
                <Link 
                  to="/dictionary" 
                  className={`inline-flex items-center px-6 py-3 rounded-full ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-600 text-white hover:bg-blue-700')} transition-colors`}
                >
                  Explorer tout le dictionnaire
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </section>
  
          {/* Section Trending et Activités */}
          <section className={`${getThemeClass('bg-gray-50', 'bg-gray-900')} py-16`}>
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Mots tendance */}
                <div className={`${getThemeClass('bg-white', 'bg-gray-800')} rounded-2xl shadow-md overflow-hidden`}>
                  <div className={`p-4 ${getThemeClass('bg-rose-50', 'bg-rose-900/20')}`}>
                    <h3 className={`text-xl font-bold ${getThemeClass('text-gray-900', 'text-white')} flex items-center`}>
                      <Sparkles className={`w-5 h-5 ${getThemeClass('text-rose-500', 'text-rose-400')} mr-2`} />
                      Mots tendance
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    <ul className="space-y-3">
                      {trendingWords.map((word, index) => (
                        <li 
                          key={word.id}
                          className={`px-3 py-2 rounded-lg ${getThemeClass('hover:bg-gray-50', 'hover:bg-gray-700')} transition-colors`}
                        >
                          <Link to={`/words/${word.id}`} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`w-6 h-6 flex items-center justify-center rounded-full ${
                                index < 3 
                                  ? getThemeClass('bg-amber-100 text-amber-800', 'bg-amber-900/30 text-amber-400') 
                                  : getThemeClass('bg-gray-100 text-gray-600', 'bg-gray-700 text-gray-400')
                              } text-xs font-bold mr-3`}>
                                {index + 1}
                              </span>
                              <div>
                                <div className={`font-medium ${getThemeClass('text-gray-900', 'text-white')}`}>{word.wolof}</div>
                                <div className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>{word.français}</div>
                              </div>
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full ${getThemeClass(
                              word.category === 'culture' ? 'bg-purple-100 text-purple-800' : 
                              word.category === 'quotidien' ? 'bg-green-100 text-green-800' :
                              word.category === 'verbes' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800',
                              word.category === 'culture' ? 'bg-purple-900/30 text-purple-400' : 
                              word.category === 'quotidien' ? 'bg-green-900/30 text-green-400' :
                              word.category === 'verbes' ? 'bg-amber-900/30 text-amber-400' :
                              'bg-blue-900/30 text-blue-400'
                            )}`}>
                              {word.category}
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Activité récente */}
                <div className={`${getThemeClass('bg-white', 'bg-gray-800')} rounded-2xl shadow-md overflow-hidden`}>
                  <div className={`p-4 ${getThemeClass('bg-green-50', 'bg-green-900/20')}`}>
                    <h3 className={`text-xl font-bold ${getThemeClass('text-gray-900', 'text-white')} flex items-center`}>
                      <Calendar className={`w-5 h-5 ${getThemeClass('text-green-500', 'text-green-400')} mr-2`} />
                      Activité récente
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    <ul className="space-y-3">
                      {recentActivity.map((activity) => (
                        <li 
                          key={activity.id}
                          className={`px-3 py-2 rounded-lg ${getThemeClass('hover:bg-gray-50', 'hover:bg-gray-700')} transition-colors`}
                        >
                          <div className="flex items-start">
                            <div className={`p-2 rounded-full ${getThemeClass(
                              activity.type === 'comment' ? 'bg-blue-100 text-blue-600' : 
                              activity.type === 'newWord' ? 'bg-green-100 text-green-600' :
                              'bg-purple-100 text-purple-600',
                              activity.type === 'comment' ? 'bg-blue-900/30 text-blue-400' : 
                              activity.type === 'newWord' ? 'bg-green-900/30 text-green-400' :
                              'bg-purple-900/30 text-purple-400'
                            )} mt-1 mr-3`}>
                              {activity.type === 'comment' ? <MessageCircle className="w-4 h-4" /> : 
                               activity.type === 'newWord' ? <Book className="w-4 h-4" /> :
                               <Share2 className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className={`${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                                <span className="font-medium">{activity.username}</span> a 
                                {activity.type === 'comment' ? ' commenté sur ' : 
                                 activity.type === 'newWord' ? ' ajouté le mot ' :
                                 ' proposé une traduction pour '}
                                <Link to={`/words/${activity.word}`} className={`font-medium ${getThemeClass('text-blue-600', 'text-blue-400')}`}>
                                  {activity.word}
                                </Link>
                              </p>
                              <p className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-400')}`}>{activity.time}</p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    
                    <Link 
                      to="/activity" 
                      className={`mt-4 text-sm flex items-center justify-center ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}
                    >
                      Voir toute l'activité <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
                
                {/* Statistiques et contribution */}
                <div className={`${getThemeClass('bg-white', 'bg-gray-800')} rounded-2xl shadow-md overflow-hidden`}>
                  <div className={`p-4 ${getThemeClass('bg-blue-50', 'bg-blue-900/20')}`}>
                    <h3 className={`text-xl font-bold ${getThemeClass('text-gray-900', 'text-white')} flex items-center`}>
                      <Users className={`w-5 h-5 ${getThemeClass('text-blue-500', 'text-blue-400')} mr-2`} />
                      Rejoindre la communauté
                    </h3>
                  </div>
                  
                  <div className="p-6">
                    <div className={`p-4 rounded-xl ${getThemeClass('bg-blue-50', 'bg-blue-900/20')} mb-4`}>
                      <div className="flex justify-between items-center mb-3">
                        <div className={`text-sm font-medium ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                          <span className="font-bold">342</span> contributions
                        </div>
                        <div className={`text-sm font-medium ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                          <span className="font-bold">12</span> jours consécutifs
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`h-8 rounded-md ${i < 5 
                              ? getThemeClass(`bg-blue-${300 + i * 100}`, `bg-blue-${900 - i * 100}`) 
                              : getThemeClass('bg-gray-200', 'bg-gray-700')}`}
                          ></div>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-center text-gray-500">
                        Activité de la semaine
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-6">
                      {[
                        { icon: UserPlus, text: "Rejoignez plus de 12,000 membres" },
                        { icon: MessageCircle, text: "Participez aux discussions linguistiques" },
                        { icon: Book, text: "Contribuez à l'enrichissement du dictionnaire" }
                      ].map((item, i) => (
                        <li key={i} className="flex items-center">
                          <div className={`p-1 mr-3 rounded-full ${getThemeClass('bg-blue-100 text-blue-600', 'bg-blue-900/30 text-blue-400')}`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className={`text-sm ${getThemeClass('text-gray-700', 'text-gray-300')}`}>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link 
                      to="/register" 
                      className={`w-full py-3 px-6 rounded-xl flex items-center justify-center font-medium ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-600 text-white hover:bg-blue-700')} transition-colors`}
                    >
                      <UserPlus className="w-5 h-5 mr-2" /> Créer un compte
                    </Link>
                    
                    <div className="text-center mt-3">
                      <Link 
                        to="/login" 
                        className={`text-sm ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}
                      >
                        Déjà membre ? Se connecter
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Section Fonctionnalités */}
          <section className={`py-16 ${getThemeClass('bg-white', 'bg-gray-800')}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className={`text-3xl md:text-4xl font-bold ${getThemeClass('text-gray-900', 'text-white')} mb-4`}>
                  Comment Explorer le Dictionnaire
                </h2>
                <p className={`text-xl ${getThemeClass('text-gray-600', 'text-gray-400')} max-w-2xl mx-auto`}>
                  Un outil conçu pour les passionnés de langue, les étudiants et les amoureux de la culture wolof.
                </p>
              </div>
  
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  {
                    icon: Search,
                    title: 'Recherche Intuitive',
                    description: 'Trouvez des mots facilement en wolof ou en français grâce à notre moteur de recherche intelligent qui comprend les variations orthographiques.'
                  },
                  {
                    icon: BookOpen,
                    title: 'Alphabet Wolof',
                    description: 'Découvrez la prononciation et les particularités de chaque lettre de l\'alphabet wolof pour une meilleure compréhension phonétique.'
                  },
                  {
                    icon: Headphones,
                    title: 'Prononciation Audio',
                    description: 'Écoutez la prononciation correcte de chaque mot grâce à nos enregistrements audio réalisés par des locuteurs natifs.'
                  },
                  {
                    icon: Users,
                    title: 'Communauté Collaborative',
                    description: 'Contribuez et enrichissez le dictionnaire ensemble. Proposez des définitions, des exemples ou des corrections.'
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.1,
                      duration: 0.5 
                    }}
                    className={`${getThemeClass('bg-gray-50', 'bg-gray-900')} rounded-2xl p-6 border ${getThemeClass('border-gray-100', 'border-gray-700')} hover:shadow-lg transition-all`}
                  >
                    <div className={`rounded-full p-3 inline-block mb-4 ${getThemeClass('bg-blue-100 text-blue-600', 'bg-blue-900/30 text-blue-400')}`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className={`text-xl font-bold ${getThemeClass('text-gray-900', 'text-gray-100')} mb-3`}>{feature.title}</h3>
                    <p className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
          
          {/* Section Témoignages */}
          <section className={`py-16 ${getThemeClass('bg-blue-50', 'bg-blue-900/20')}`}>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className={`text-3xl font-bold ${getThemeClass('text-gray-900', 'text-white')} mb-4`}>
                  Ce que disent nos utilisateurs
                </h2>
                <p className={`text-lg ${getThemeClass('text-gray-600', 'text-gray-400')} max-w-2xl mx-auto`}>
                  Découvrez comment WolofDict aide des apprenants et des locuteurs natifs du monde entier.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={testimonial.id}
                    className={`${getThemeClass('bg-white', 'bg-gray-800')} p-6 rounded-2xl shadow-md`}
                  >
                    <div className="mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`inline-block w-5 h-5 ${getThemeClass('text-amber-400', 'text-amber-400')}`} 
                          fill="currentColor" 
                        />
                      ))}
                    </div>
                    <p className={`text-md italic mb-6 ${getThemeClass('text-gray-600', 'text-gray-300')}`}>
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="w-10 h-10 rounded-full mr-4"
                      />
                      <div>
                        <div className={`font-medium ${getThemeClass('text-gray-900', 'text-white')}`}>{testimonial.name}</div>
                        <div className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>{testimonial.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Appel à l'Action */}
          <section className={`${getThemeClass('bg-blue-600', 'bg-blue-900')} text-white py-16`}>
            <div className="container mx-auto px-4 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6 flex items-center justify-center">
                  <Globe className="w-10 h-10 mr-3" />
                  <span>Rejoignez Notre Communauté Linguistique</span>
                </h2>
                
                <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
                  Participez à la préservation et à la promotion de la langue wolof. 
                  Chaque contribution enrichit notre patrimoine linguistique commun.
                </p>
  
                <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
                  <Link 
                    to="/register" 
                    className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center"
                  >
                    <UserPlus className="mr-2 w-5 h-5" /> Créer un compte gratuitement
                  </Link>
                  <Link 
                    to="/learn" 
                    className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                  >
                    <Play className="mr-2 w-5 h-5" /> Découvrir les ressources d'apprentissage
                  </Link>
                  <Link 
                    to="/contribute" 
                    className="border border-white text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                  >
                    <Mic className="mr-2 w-5 h-5" /> Comment contribuer
                  </Link>
                </div>
                
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <a 
                    href="#" 
                    className="flex items-center text-blue-100 hover:text-white transition-colors"
                  >
                    <Coffee className="w-5 h-5 mr-2" />
                    <span>Soutenir le projet</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center text-blue-100 hover:text-white transition-colors"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    <span>Partager</span>
                  </a>
                  <a 
                    href="#" 
                    className="flex items-center text-blue-100 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 mr-2" />
                    <span>Ressources externes</span>
                  </a>
                </div>
              </motion.div>
            </div>
          </section>
        </main>
      </div>
    );
  };
  
  export default HomePage;