import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Mic, 
  Globe, 
  Play, 
  Volume2, 
  Search, 
  Info, 
  Repeat2,
  Moon,
  Sun,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  Share2,
  Download,
  X,
  Filter,
  Heart
} from 'lucide-react';

const AlphabetPage = () => {
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAlphabet, setFilteredAlphabet] = useState([]);
  const [languageMode, setLanguageMode] = useState('wolof'); // 'wolof' ou 'français'
  const [darkMode, setDarkMode] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleLetters, setVisibleLetters] = useState([]);
  const scrollRef = useRef(null);
  const lettersPerPage = 12;

  // Définition complète de l'alphabet wolof avec toutes les lettres
  const wolofAlphabet = [
    { 
      letter: 'A', 
      examples: [
        { 
          wolof: 'Axam', 
          français: 'Écrire', 
          pronunciation: '/axam/', 
          description: 'Action de noter ou de marquer sur un support'
        },
        { 
          wolof: 'Añ', 
          français: 'Déjeuner/Dîner', 
          pronunciation: '/aɲ/', 
          description: 'Prendre un repas principal'
        }
      ]
    },
    { 
      letter: 'À', 
      examples: [
        { 
          wolof: 'Àll', 
          français: 'Brousse', 
          pronunciation: '/àll/', 
          description: 'Zone naturelle non cultivée'
        },
        { 
          wolof: 'Ànd', 
          français: 'Accompagner', 
          pronunciation: '/ànd/', 
          description: 'Aller quelque part avec quelqu\'un'
        }
      ]
    },
    { 
      letter: 'B', 
      examples: [
        { 
          wolof: 'Bañ', 
          français: 'Refuser', 
          pronunciation: '/baɲ/', 
          description: 'Ne pas accepter'
        },
        { 
          wolof: 'Bàyyi', 
          français: 'Laisser', 
          pronunciation: '/bàjji/', 
          description: 'Permettre, ne pas empêcher'
        }
      ]
    },
    { 
      letter: 'C', 
      examples: [
        { 
          wolof: 'Céy', 
          français: 'Être surpris', 
          pronunciation: '/céj/', 
          description: 'Expression de surprise'
        },
        { 
          wolof: 'Càmm', 
          français: 'Sentir', 
          pronunciation: '/càmm/', 
          description: 'Percevoir par l\'odorat ou ressentir émotionnellement'
        }
      ]
    },
    { 
      letter: 'D', 
      examples: [
        { 
          wolof: 'Def', 
          français: 'Faire', 
          pronunciation: '/def/', 
          description: 'Accomplir une action'
        },
        { 
          wolof: 'Dox', 
          français: 'Marcher', 
          pronunciation: '/dox/', 
          description: 'Se déplacer à pied'
        }
      ]
    },
    { 
      letter: 'E', 
      examples: [
        { 
          wolof: 'Ëmb', 
          français: 'Porter', 
          pronunciation: '/əmb/', 
          description: 'Tenir quelque chose'
        },
        { 
          wolof: 'Ëpp', 
          français: 'Être abondant', 
          pronunciation: '/əpp/', 
          description: 'Exister en grande quantité'
        }
      ]
    },
    { 
      letter: 'É', 
      examples: [
        { 
          wolof: 'Réy', 
          français: 'Tuer', 
          pronunciation: '/réj/', 
          description: 'Mettre fin à la vie'
        },
        { 
          wolof: 'Sér', 
          français: 'Être beau/belle', 
          pronunciation: '/sér/', 
          description: 'Avoir une belle apparence'
        }
      ]
    },
    { 
      letter: 'Ë', 
      examples: [
        { 
          wolof: 'Bëgg', 
          français: 'Vouloir', 
          pronunciation: '/bəgg/', 
          description: 'Désirer quelque chose'
        },
        { 
          wolof: 'Jënd', 
          français: 'Acheter', 
          pronunciation: '/dʒənd/', 
          description: 'Acquérir en échange d\'argent'
        }
      ]
    },
    { 
      letter: 'F', 
      examples: [
        { 
          wolof: 'Fas', 
          français: 'Attacher', 
          pronunciation: '/fas/', 
          description: 'Lier deux choses ensemble'
        },
        { 
          wolof: 'Feeñ', 
          français: 'Apparaître', 
          pronunciation: '/feeɲ/', 
          description: 'Devenir visible'
        }
      ]
    },
    { 
      letter: 'G', 
      examples: [
        { 
          wolof: 'Gis', 
          français: 'Voir', 
          pronunciation: '/gis/', 
          description: 'Percevoir par la vue'
        },
        { 
          wolof: 'Gaaw', 
          français: 'Être rapide', 
          pronunciation: '/gaaw/', 
          description: 'Aller vite'
        }
      ]
    },
    { 
      letter: 'I', 
      examples: [
        { 
          wolof: 'Indi', 
          français: 'Apporter', 
          pronunciation: '/indi/', 
          description: 'Amener quelque chose'
        },
        { 
          wolof: 'Indil', 
          français: 'Apporter pour', 
          pronunciation: '/indil/', 
          description: 'Amener quelque chose pour quelqu\'un'
        }
      ]
    },
    { 
      letter: 'J', 
      examples: [
        { 
          wolof: 'Jaay', 
          français: 'Vendre', 
          pronunciation: '/dʒaaj/', 
          description: 'Céder en échange d\'argent'
        },
        { 
          wolof: 'Jàng', 
          français: 'Apprendre/Étudier', 
          pronunciation: '/dʒàŋ/', 
          description: 'Acquérir des connaissances'
        }
      ]
    },
    { 
      letter: 'K', 
      examples: [
        { 
          wolof: 'Kaay', 
          français: 'Venir', 
          pronunciation: '/kaaj/', 
          description: 'Invitation à venir'
        },
        { 
          wolof: 'Këpp', 
          français: 'Verser', 
          pronunciation: '/kəpp/', 
          description: 'Faire couler un liquide'
        }
      ]
    },
    { 
      letter: 'L', 
      examples: [
        { 
          wolof: 'Làkk', 
          français: 'Langue', 
          pronunciation: '/làkk/', 
          description: 'Système de communication parlée'
        },
        { 
          wolof: 'Liggéey', 
          français: 'Travailler', 
          pronunciation: '/liggéej/', 
          description: 'Exercer une activité rémunérée'
        }
      ]
    },
    { 
      letter: 'M', 
      examples: [
        { 
          wolof: 'Mag', 
          français: 'Être grand', 
          pronunciation: '/mag/', 
          description: 'Avoir une grande taille ou être âgé'
        },
        { 
          wolof: 'Muñ', 
          français: 'Patienter', 
          pronunciation: '/muɲ/', 
          description: 'Attendre avec calme'
        }
      ]
    },
    { 
      letter: 'N', 
      examples: [
        { 
          wolof: 'Naan', 
          français: 'Boire', 
          pronunciation: '/naan/', 
          description: 'Avaler un liquide'
        },
        { 
          wolof: 'Nit', 
          français: 'Personne', 
          pronunciation: '/nit/', 
          description: 'Être humain'
        }
      ]
    },
    { 
      letter: 'Ñ', 
      examples: [
        { 
          wolof: 'Ñam', 
          français: 'Manger', 
          pronunciation: '/ɲam/', 
          description: 'Prendre de la nourriture'
        },
        { 
          wolof: 'Ñaw', 
          français: 'Coudre', 
          pronunciation: '/ɲaw/', 
          description: 'Assembler des tissus'
        }
      ]
    },
    { 
      letter: 'Ŋ', 
      examples: [
        { 
          wolof: 'Ŋàpp', 
          français: 'Mordre', 
          pronunciation: '/ŋàpp/', 
          description: 'Saisir avec les dents'
        },
        { 
          wolof: 'Ŋàngal', 
          français: 'Enseigner', 
          pronunciation: '/ŋàŋal/', 
          description: 'Transmettre un savoir'
        }
      ]
    },
    { 
      letter: 'O', 
      examples: [
        { 
          wolof: 'Ooñat', 
          français: 'Gémir', 
          pronunciation: '/ooɲat/', 
          description: 'Pousser des sons plaintifs'
        },
        { 
          wolof: 'Oor', 
          français: 'Jeûner', 
          pronunciation: '/oor/', 
          description: 'S\'abstenir de nourriture'
        }
      ]
    },
    { 
      letter: 'P', 
      examples: [
        { 
          wolof: 'Pare', 
          français: 'Être prêt', 
          pronunciation: '/pare/', 
          description: 'Être préparé'
        },
        { 
          wolof: 'Pase', 
          français: 'Passer', 
          pronunciation: '/pase/', 
          description: 'Aller d\'un endroit à un autre'
        }
      ]
    },
    { 
      letter: 'Q', 
      examples: [
        { 
          wolof: 'Qày', 
          français: 'Écailler', 
          pronunciation: '/qaj/', 
          description: 'Enlever les écailles d\'un poisson'
        },
        { 
          wolof: 'Qëb', 
          français: 'Couper', 
          pronunciation: '/qəb/', 
          description: 'Diviser avec un instrument tranchant'
        }
      ]
    },
    { 
      letter: 'R', 
      examples: [
        { 
          wolof: 'Ree', 
          français: 'Rire', 
          pronunciation: '/ree/', 
          description: 'Manifester sa joie par des sons'
        },
        { 
          wolof: 'Raw', 
          français: 'Échapper', 
          pronunciation: '/raw/', 
          description: 'S\'enfuir'
        }
      ]
    },
    { 
      letter: 'S', 
      examples: [
        { 
          wolof: 'Sàkk', 
          français: 'Voler', 
          pronunciation: '/sàkk/', 
          description: 'Prendre ce qui appartient à autrui'
        },
        { 
          wolof: 'Sopp', 
          français: 'Aimer', 
          pronunciation: '/sopp/', 
          description: 'Avoir de l\'affection pour'
        }
      ]
    },
    { 
      letter: 'T', 
      examples: [
        { 
          wolof: 'Tëdd', 
          français: 'Se coucher', 
          pronunciation: '/tədd/', 
          description: 'S\'étendre pour dormir'
        },
        { 
          wolof: 'Takk', 
          français: 'Attacher/Épouser', 
          pronunciation: '/takk/', 
          description: 'Lier ou se marier'
        }
      ]
    },
    { 
      letter: 'U', 
      examples: [
        { 
          wolof: 'Ubbi', 
          français: 'Ouvrir', 
          pronunciation: '/ubbi/', 
          description: 'Rendre accessible'
        },
        { 
          wolof: 'Ubbeeku', 
          français: 'S\'ouvrir', 
          pronunciation: '/ubbeeku/', 
          description: 'Devenir ouvert'
        }
      ]
    },
    { 
      letter: 'W', 
      examples: [
        { 
          wolof: 'Wax', 
          français: 'Parler', 
          pronunciation: '/wax/', 
          description: 'S\'exprimer oralement'
        },
        { 
          wolof: 'Wàññi', 
          français: 'Diminuer', 
          pronunciation: '/wàɲɲi/', 
          description: 'Réduire une quantité'
        }
      ]
    },
    { 
      letter: 'X', 
      examples: [
        { 
          wolof: 'Xaar', 
          français: 'Attendre', 
          pronunciation: '/xaar/', 
          description: 'Rester jusqu\'à l\'arrivée de quelqu\'un ou quelque chose'
        },
        { 
          wolof: 'Xàmme', 
          français: 'Reconnaître', 
          pronunciation: '/xàmme/', 
          description: 'Identifier quelqu\'un ou quelque chose'
        }
      ]
    },
    { 
      letter: 'Y', 
      examples: [
        { 
          wolof: 'Yeek', 
          français: 'Partager', 
          pronunciation: '/yeek/', 
          description: 'Diviser entre plusieurs personnes'
        },
        { 
          wolof: 'Yëkk', 
          français: 'Élever/Soulever', 
          pronunciation: '/yəkk/', 
          description: 'Porter vers le haut'
        }
      ]
    }
  ];

  // Gestion de la pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * lettersPerPage;
    const endIndex = startIndex + lettersPerPage;
    setVisibleLetters(filteredAlphabet.slice(startIndex, endIndex));
  }, [currentPage, filteredAlphabet]);

  // Fonction pour passer à la page précédente
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      scrollToTop();
    }
  };

  // Fonction pour passer à la page suivante
  const goToNextPage = () => {
    const maxPage = Math.ceil(filteredAlphabet.length / lettersPerPage);
    if (currentPage < maxPage) {
      setCurrentPage(currentPage + 1);
      scrollToTop();
    }
  };

  // Fonction pour remonter en haut
  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtrage dynamique de l'alphabet
  useEffect(() => {
    let filtered = [...wolofAlphabet];
    
    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(item => 
        // Filtrer par lettre
        item.letter.toLowerCase().includes(searchTerm.toLowerCase()) ||
        
        // Filtrer par exemples
        item.examples.some(example => 
          // Recherche dans le mot wolof
          example.wolof.toLowerCase().includes(searchTerm.toLowerCase()) ||
          
          // Recherche dans la traduction française
          example.français.toLowerCase().includes(searchTerm.toLowerCase()) ||
          
          // Recherche dans la description
          example.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          
          // Recherche dans la prononciation
          example.pronunciation.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Filtrage par favoris
    if (showFavorites) {
      filtered = filtered.filter(item => 
        favorites.includes(item.letter) || 
        item.examples.some(example => favorites.includes(example.wolof))
      );
    }
    
    setFilteredAlphabet(filtered);
    setCurrentPage(1); // Réinitialiser à la première page lors d'un filtrage
  }, [searchTerm, favorites, showFavorites]);

  // Initialisation de l'alphabet filtré
  useEffect(() => {
    setFilteredAlphabet(wolofAlphabet);
  }, []);

  // Fonction pour jouer la prononciation (simulation)
  const playPronunciation = (pronunciation, event) => {
    if (event) {
      event.stopPropagation();
    }
    // Dans un vrai projet, intégrez un lecteur audio
    alert(`Prononciation : ${pronunciation}`);
  };

  // Basculer entre wolof et français
  const toggleLanguageMode = () => {
    setLanguageMode(languageMode === 'wolof' ? 'français' : 'wolof');
  };

  // Basculer le mode sombre
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Gérer les favoris
  const toggleFavorite = (item, event) => {
    event.stopPropagation();
    if (favorites.includes(item)) {
      setFavorites(favorites.filter(fav => fav !== item));
    } else {
      setFavorites([...favorites, item]);
    }
  };

  // Afficher le modal avec le contenu spécifique
  const showExampleInModal = (example, event) => {
    event.stopPropagation();
    setModalContent(example);
    setShowModal(true);
  };

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredAlphabet.length / lettersPerPage);

  // Classe conditionelle basée sur le mode
  const getThemeClass = (lightClass, darkClass) => {
    return darkMode ? darkClass : lightClass;
  };

  return (
    <motion.div 
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`min-h-screen transition-colors duration-300 ${getThemeClass('bg-gray-50', 'bg-gray-900')}`}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Barre supérieure avec logo, changement de langue et mode sombre */}
        <div className={`flex justify-between items-center mb-8 ${getThemeClass('bg-white', 'bg-gray-800')} rounded-xl p-4 shadow-md`}>
          <div className="flex items-center">
            <Book className={`w-8 h-8 ${getThemeClass('text-blue-600', 'text-blue-400')} mr-3`} />
            <h2 className={`text-2xl font-bold ${getThemeClass('text-blue-800', 'text-blue-300')}`}>WolofLearn</h2>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={toggleLanguageMode}
              className={`p-2 rounded-full transition-colors ${getThemeClass('bg-blue-100 text-blue-600 hover:bg-blue-200', 'bg-blue-900 text-blue-300 hover:bg-blue-800')}`}
              aria-label="Changer de langue"
            >
              <Globe className="w-6 h-6" />
            </button>
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full transition-colors ${getThemeClass('bg-purple-100 text-purple-600 hover:bg-purple-200', 'bg-purple-900 text-purple-300 hover:bg-purple-800')}`}
              aria-label="Changer le mode"
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* En-tête */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-center mb-12 ${getThemeClass('', 'text-white')}`}
        >
          <h1 className={`text-5xl md:text-6xl font-bold ${getThemeClass('text-blue-800', 'text-blue-300')} mb-6`}>
            Alphabet {languageMode === 'wolof' ? 'Wolof' : 'Français'}
          </h1>
          <p className={`text-xl max-w-3xl mx-auto ${getThemeClass('text-gray-600', 'text-gray-300')}`}>
            {languageMode === 'wolof' 
              ? 'Découvrez les subtilités phonétiques et linguistiques de la langue wolof à travers son alphabet complet.' 
              : 'Explorez les lettres et leur utilisation dans le contexte wolof avec des exemples pratiques.'}
          </p>
        </motion.div>

        {/* Barre de recherche et filtres */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${getThemeClass('text-gray-400', 'text-gray-500')}`} />
              <input 
                type="text"
                placeholder="Rechercher une lettre, un mot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 border ${getThemeClass('border-gray-300 bg-white text-gray-800', 'border-gray-700 bg-gray-800 text-white')} rounded-xl focus:outline-none focus:ring-2 ${getThemeClass('focus:ring-blue-500', 'focus:ring-blue-400')}`}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${getThemeClass('text-gray-400 hover:text-gray-600', 'text-gray-500 hover:text-gray-300')}`}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilterOpen(!filterOpen)}
                className={`px-4 py-2 rounded-xl flex items-center ${getThemeClass('bg-gray-200 text-gray-800 hover:bg-gray-300', 'bg-gray-700 text-white hover:bg-gray-600')}`}
              >
                <Filter className="w-5 h-5 mr-2" />
                Filtres
              </button>
              <button 
                onClick={() => setShowFavorites(!showFavorites)}
                className={`px-4 py-2 rounded-xl flex items-center ${showFavorites 
                  ? getThemeClass('bg-red-100 text-red-600 hover:bg-red-200', 'bg-red-900 text-red-300 hover:bg-red-800') 
                  : getThemeClass('bg-gray-200 text-gray-800 hover:bg-gray-300', 'bg-gray-700 text-white hover:bg-gray-600')}`}
              >
                <Heart className={`w-5 h-5 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
                Favoris {favorites.length > 0 && `(${favorites.length})`}
              </button>
            </div>
          </div>
          
          {/* Panneau de filtres avancés */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={`mt-4 p-4 rounded-xl ${getThemeClass('bg-white shadow-md', 'bg-gray-800 shadow-xl')}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className={`font-semibold mb-2 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>Type de contenu</h3>
                    <div className="space-y-2">
                      {['Mots', 'Phrases', 'Expressions'].map((type, index) => (
                        <div key={index} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`type-${index}`}
                            className="rounded text-blue-600 mr-2"
                          />
                          <label htmlFor={`type-${index}`} className={getThemeClass('text-gray-600', 'text-gray-400')}>
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-2 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>Difficulté</h3>
                    <div className="space-y-2">
                      {['Débutant', 'Intermédiaire', 'Avancé'].map((level, index) => (
                        <div key={index} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`level-${index}`}
                            className="rounded text-blue-600 mr-2"
                          />
                          <label htmlFor={`level-${index}`} className={getThemeClass('text-gray-600', 'text-gray-400')}>
                            {level}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className={`font-semibold mb-2 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>Thématique</h3>
                    <div className="space-y-2">
                      {['Quotidien', 'Culturel', 'Business', 'Académique'].map((theme, index) => (
                        <div key={index} className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`theme-${index}`}
                            className="rounded text-blue-600 mr-2"
                          />
                          <label htmlFor={`theme-${index}`} className={getThemeClass('text-gray-600', 'text-gray-400')}>
                            {theme}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats de résultats */}
        <div className={`flex justify-between items-center mb-6 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
          <div>
            {filteredAlphabet.length} lettres trouvées
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={goToPreviousPage} 
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${currentPage === 1 
                ? getThemeClass('bg-gray-100 text-gray-400', 'bg-gray-800 text-gray-600') 
                : getThemeClass('bg-blue-100 text-blue-600 hover:bg-blue-200', 'bg-blue-900 text-blue-400 hover:bg-blue-800')}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className={`p-2 rounded-full ${currentPage === totalPages 
                ? getThemeClass('bg-gray-100 text-gray-400', 'bg-gray-800 text-gray-600') 
                : getThemeClass('bg-blue-100 text-blue-600 hover:bg-blue-200', 'bg-blue-900 text-blue-400 hover:bg-blue-800')}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grille de l'alphabet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {visibleLetters.map((letterData) => (
            <motion.div 
              key={letterData.letter}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`
                ${getThemeClass('bg-white', 'bg-gray-800')} rounded-2xl shadow-lg overflow-hidden 
                transition-all duration-300 cursor-pointer
                ${selectedLetter === letterData.letter 
                  ? getThemeClass('ring-4 ring-blue-500 ring-opacity-50', 'ring-4 ring-blue-400 ring-opacity-50') 
                  : getThemeClass('hover:shadow-xl', 'hover:shadow-2xl hover:shadow-gray-700/30')}
              `}
              onClick={() => setSelectedLetter(
                selectedLetter === letterData.letter ? null : letterData.letter
              )}
            >
              <div className={`p-5 flex justify-between items-center ${getThemeClass('bg-blue-50', 'bg-blue-900')}`}>
                <div className="flex flex-col">
                  <span className={`text-5xl font-bold ${getThemeClass('text-blue-800', 'text-blue-200')}`}>
                    {letterData.letter}
                  </span>
                  <span className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>
                    {letterData.letter.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={(e) => toggleFavorite(letterData.letter, e)}
                    className={`p-2 rounded-full transition-colors ${getThemeClass(
                      favorites.includes(letterData.letter) ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-gray-50 hover:bg-gray-100', 
                      favorites.includes(letterData.letter) ? 'text-red-400 bg-red-900' : 'text-gray-500 bg-gray-700 hover:bg-gray-600'
                    )}`}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(letterData.letter) ? 'fill-current' : ''}`} />
                  </button>
                  <Info 
                    className={`
                      w-6 h-6 
                      ${selectedLetter === letterData.letter 
                        ? getThemeClass('text-blue-600', 'text-blue-400') 
                        : getThemeClass('text-gray-400', 'text-gray-500')}
                    `} 
                  />
                </div>
              </div>

              <AnimatePresence>
                {selectedLetter === letterData.letter && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className={`p-5 ${getThemeClass('bg-white', 'bg-gray-800')}`}
                  >
                    <h3 className={`text-lg font-semibold ${getThemeClass('text-blue-800', 'text-blue-300')} mb-4 flex items-center`}>
                      <Book className="w-5 h-5 mr-2" />
                      Exemples
                    </h3>
                    {letterData.examples.map((example, index) => (
                      <motion.div 
                        key={index}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${getThemeClass('bg-gray-50', 'bg-gray-700')} rounded-xl p-4 mb-3 last:mb-0`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={`font-medium text-lg ${getThemeClass('text-gray-800', 'text-gray-100')}`}>
                              {languageMode === 'wolof' ? example.wolof : example.français}
                            </div>
                            <div className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-300')}`}>
                              {languageMode === 'wolof' ? example.français : example.wolof}
                            </div>
                            <div className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-400')} mt-1`}>
                              {example.pronunciation}
                            </div>
                            <div className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-400')} mt-1 italic`}>
                              {example.description}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button 
                              onClick={(e) => playPronunciation(example.pronunciation, e)}
                              className={`p-2 rounded-full ${getThemeClass('bg-blue-100 text-blue-600 hover:bg-blue-200', 'bg-blue-900 text-blue-400 hover:bg-blue-800')}`}
                            >
                              <Volume2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => toggleFavorite(example.wolof, e)}
                              className={`p-2 rounded-full ${
                                favorites.includes(example.wolof) 
                                  ? getThemeClass('bg-red-100 text-red-600', 'bg-red-900 text-red-400') 
                                  : getThemeClass('bg-gray-200 text-gray-600', 'bg-gray-600 text-gray-300')
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${favorites.includes(example.wolof) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => showExampleInModal(example, e)}
                              className={`p-2 rounded-full ${getThemeClass('bg-purple-100 text-purple-600 hover:bg-purple-200', 'bg-purple-900 text-purple-400 hover:bg-purple-800')}`}
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Pagination du bas */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mb-12">
            <button 
              onClick={goToPreviousPage} 
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg ${currentPage === 1 
                ? getThemeClass('bg-gray-100 text-gray-400', 'bg-gray-800 text-gray-600') 
                : getThemeClass('bg-blue-100 text-blue-600 hover:bg-blue-200', 'bg-blue-900 text-blue-400 hover:bg-blue-800')}`}
            >
              Précédent
            </button>
            
            {/* Affichage des numéros de page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className={`px-4 py-2 ${getThemeClass('text-gray-400', 'text-gray-500')}`}>...</span>
                  )}
                  <button 
                    onClick={() => {
                      setCurrentPage(page);
                      scrollToTop();
                    }}
                    className={`px-4 py-2 rounded-lg ${page === currentPage 
                      ? getThemeClass('bg-blue-600 text-white', 'bg-blue-500 text-white') 
                      : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-700 text-gray-300 hover:bg-gray-600')}`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))
            }
            
            <button 
              onClick={goToNextPage} 
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg ${currentPage === totalPages 
                ? getThemeClass('bg-gray-100 text-gray-400', 'bg-gray-800 text-gray-600') 
                : getThemeClass('bg-blue-100 text-blue-600 hover:bg-blue-200', 'bg-blue-900 text-blue-400 hover:bg-blue-800')}`}
            >
              Suivant
            </button>
          </div>
        )}

        {/* Bouton pour remonter */}
        {totalPages > 1 && (
          <button 
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-500 text-white hover:bg-blue-600')}`}
          >
            <ArrowUp className="w-6 h-6" />
          </button>
        )}

        {/* Ressources et Notes en design de cartes */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`${getThemeClass('bg-blue-50', 'bg-blue-900/40')} p-8 rounded-2xl shadow-md`}
          >
            <h2 className={`text-2xl font-bold ${getThemeClass('text-blue-800', 'text-blue-300')} mb-6 flex items-center`}>
              <Globe className={`mr-4 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
              Ressources Linguistiques
            </h2>
            <div className="space-y-6">
              {[
                { 
                  icon: Book, 
                  title: 'Guide de prononciation',
                  description: 'Apprenez à prononcer correctement tous les sons du wolof',
                  link: '#'
                },
                { 
                  icon: Mic, 
                  title: 'Vidéos d\'apprentissage',
                  description: 'Regardez des vidéos de locuteurs natifs pratiquant la langue',
                  link: '#'
                },
                { 
                  icon: Play, 
                  title: 'Ressources audio',
                  description: 'Écoutez des conversations réelles en wolof pour améliorer votre compréhension',
                  link: '#'
                }
              ].map((resource, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ x: 10 }}
                  className={`flex items-start space-x-4 ${getThemeClass('bg-white', 'bg-gray-800')} p-4 rounded-xl shadow-sm`}
                >
                  <div className={`p-3 rounded-full ${getThemeClass('bg-blue-100', 'bg-blue-800')}`}>
                    <resource.icon className={`w-6 h-6 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${getThemeClass('text-gray-800', 'text-gray-200')}`}>{resource.title}</h3>
                    <p className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>{resource.description}</p>
                    <a 
                      href={resource.link} 
                      className={`text-sm font-medium flex items-center mt-2 ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}
                    >
                      En savoir plus <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`${getThemeClass('bg-green-50', 'bg-green-900/30')} p-8 rounded-2xl shadow-md`}
          >
            <h3 className={`text-2xl font-bold ${getThemeClass('text-green-800', 'text-green-300')} mb-6`}>
              Notes Importantes
            </h3>
            <div className="space-y-6">
              <div className={`${getThemeClass('bg-white', 'bg-gray-800')} p-4 rounded-xl shadow-sm`}>
                <h4 className={`font-semibold ${getThemeClass('text-gray-800', 'text-gray-200')} mb-2`}>Particularités phonétiques</h4>
                <p className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                  L'alphabet wolof, bien que basé sur l'alphabet latin, présente des particularités phonétiques uniques qui le distinguent des langues européennes.
                </p>
              </div>
              
              <div className={`${getThemeClass('bg-white', 'bg-gray-800')} p-4 rounded-xl shadow-sm`}>
                <h4 className={`font-semibold ${getThemeClass('text-gray-800', 'text-gray-200')} mb-2`}>Voyelles et consonnes spéciales</h4>
                <p className={`text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                  Le wolof comporte des sons spécifiques notamment des voyelles nasalisées et des consonnes prépalatales qui n'existent pas dans les langues latines.
                </p>
              </div>
              
              <div className={`${getThemeClass('bg-white', 'bg-gray-800')} p-4 rounded-xl shadow-sm`}>
                <h4 className={`font-semibold ${getThemeClass('text-gray-800', 'text-gray-200')} mb-2`}>Conseils pratiques</h4>
                <ul className={`space-y-2 text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Pratiquez régulièrement la prononciation avec des locuteurs natifs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Écoutez attentivement les nuances tonales de chaque lettre</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Utilisez les ressources audio pour maîtriser les sons spécifiques</span>
                  </li>
                </ul>
              </div>
              
              <div className={`flex justify-center mt-4`}>
                <button className={`px-6 py-3 rounded-xl ${getThemeClass('bg-green-600 text-white hover:bg-green-700', 'bg-green-600 text-white hover:bg-green-700')} flex items-center`}>
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger le guide complet
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Section "À propos" */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-16 ${getThemeClass('bg-gray-100', 'bg-gray-800')} p-8 rounded-2xl`}
        >
          <h2 className={`text-2xl font-bold ${getThemeClass('text-gray-800', 'text-gray-200')} mb-6 text-center`}>
            À propos de l'Alphabet Wolof
          </h2>
          <div className={`max-w-3xl mx-auto ${getThemeClass('text-gray-600', 'text-gray-300')}`}>
            <p className="mb-4">
              La langue wolof est principalement parlée au Sénégal, en Gambie et en Mauritanie. Son alphabet officiel, basé sur l'alphabet latin, a été standardisé pour représenter les sons spécifiques à cette langue ouest-africaine.
            </p>
            <p className="mb-4">
              Avec environ 28 lettres, l'alphabet wolof inclut la plupart des lettres latines standards ainsi que des caractères supplémentaires ou modifiés pour représenter des sons particuliers. Cette application vise à rendre l'apprentissage de cet alphabet accessible à tous.
            </p>
            <p>
              Développé par des linguistes et des experts culturels, ce guide interactif offre une immersion complète dans les subtilités phonétiques et sémantiques du wolof, facilitant ainsi son apprentissage pour les débutants comme pour les apprenants avancés.
            </p>
          </div>
        </motion.div>

        {/* Pied de page */}
        <footer className={`mt-16 pt-8 border-t ${getThemeClass('border-gray-200 text-gray-600', 'border-gray-700 text-gray-400')}`}>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Book className={`w-6 h-6 ${getThemeClass('text-blue-600', 'text-blue-400')} mr-2`} />
              <span className="font-semibold">WolofLearn © 2025</span>
            </div>
            <div className="flex space-x-8">
              <a href="#" className="hover:underline">Politique de confidentialité</a>
              <a href="#" className="hover:underline">Conditions d'utilisation</a>
              <a href="#" className="hover:underline">Contact</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Modal pour afficher les détails d'un exemple */}
      <AnimatePresence>
        {showModal && modalContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`relative ${getThemeClass('bg-white', 'bg-gray-800')} rounded-2xl p-6 max-w-md w-full shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowModal(false)}
                className={`absolute top-4 right-4 p-2 rounded-full ${getThemeClass('bg-gray-100 text-gray-600 hover:bg-gray-200', 'bg-gray-700 text-gray-400 hover:bg-gray-600')}`}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold ${getThemeClass('text-blue-800', 'text-blue-300')}`}>
                  {languageMode === 'wolof' ? modalContent.wolof : modalContent.français}
                </h3>
                <p className={`text-lg ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                  {languageMode === 'wolof' ? modalContent.français : modalContent.wolof}
                </p>
              </div>
              
              <div className={`${getThemeClass('bg-blue-50', 'bg-blue-900/30')} p-4 rounded-xl mb-6`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`font-semibold ${getThemeClass('text-blue-800', 'text-blue-300')}`}>Prononciation</h4>
                  <button 
                    onClick={() => playPronunciation(modalContent.pronunciation)}
                    className={`p-2 rounded-full ${getThemeClass('bg-blue-100 text-blue-600 hover:bg-blue-200', 'bg-blue-800 text-blue-300 hover:bg-blue-700')}`}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <p className={`text-lg font-medium ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                  {modalContent.pronunciation}
                </p>
              </div>
              
              <div className="mb-6">
                <h4 className={`font-semibold mb-2 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>Description</h4>
                <p className={`${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                  {modalContent.description}
                </p>
              </div>
              
              <div className="mb-6">
                <h4 className={`font-semibold mb-2 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>Utilisations courantes</h4>
                <ul className={`space-y-2 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Dans les conversations quotidiennes</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Expressions idiomatiques</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Contextes formels et informels</span>
                  </li>
                </ul>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => toggleFavorite(modalContent.wolof)}
                  className={`px-4 py-2 rounded-xl flex items-center ${
                    favorites.includes(modalContent.wolof) 
                      ? getThemeClass('bg-red-100 text-red-600', 'bg-red-900 text-red-300') 
                      : getThemeClass('bg-gray-100 text-gray-600', 'bg-gray-700 text-gray-300')
                  }`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${favorites.includes(modalContent.wolof) ? 'fill-current' : ''}`} />
                  {favorites.includes(modalContent.wolof) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </button>
                <button className={`px-4 py-2 rounded-xl flex items-center ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-500 text-white hover:bg-blue-600')}`}>
                  <Share2 className="w-5 h-5 mr-2" />
                  Partager
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AlphabetPage;