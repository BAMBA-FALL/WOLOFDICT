import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MessageCircle, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  Bookmark, 
  Heart, 
  Share2, 
  Filter, 
  X, 
  ArrowUp,
  Download,
  Copy,
  CheckCircle,
  Tag,
  Star,
  Coffee,
  Mic,
  Play,
  PlusCircle,
  Book
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PhrasesPage = ({ darkMode }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('tous');
  const [phrases, setPhrases] = useState([]);
  const [filteredPhrases, setFilteredPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState(null);
  const [difficultyFilter, setDifficultyFilter] = useState('tous');
  const [sortBy, setSortBy] = useState('popular');
  
  const searchInputRef = useRef(null);
  const phrasesPerPage = 6;

  // Classes conditionnelles selon le mode
  const getThemeClass = (lightClass, darkClass) => {
    return darkMode ? darkClass : lightClass;
  };

  // Simuler le chargement des données
  useEffect(() => {
    const fetchPhrases = async () => {
      setLoading(true);
      // Simuler un délai d'API
      setTimeout(() => {
        const mockPhrases = generateMockPhrases();
        setPhrases(mockPhrases);
        setFilteredPhrases(mockPhrases);
        setLoading(false);
      }, 800);
    };

    fetchPhrases();
  }, []);

  // Générer des phrases d'exemple
  const generateMockPhrases = () => {
    const categories = [
      'salutations', 
      'quotidien', 
      'voyage', 
      'proverbes', 
      'business', 
      'urgences'
    ];
    
    const difficulties = ['débutant', 'intermédiaire', 'avancé'];
    
    const mockPhrases = [
      {
        id: 1,
        wolof: "Nanga def?",
        francais: "Comment vas-tu ?",
        transliteration: "nanga def",
        category: "salutations",
        difficulty: "débutant",
        explanation: "Expression très courante pour saluer quelqu'un et prendre de ses nouvelles.",
        context: "Peut être utilisé à tout moment de la journée pour entamer une conversation.",
        variations: ["Na nga def?", "Naka nga def?"],
        likes: 456,
        usageCount: 1342,
        audio: "audio/nanga-def.mp3"
      },
      {
        id: 2,
        wolof: "Mangi fi rekk",
        francais: "Je vais bien",
        transliteration: "ma-ngi fi rekk",
        category: "salutations",
        difficulty: "débutant",
        explanation: "Réponse standard à 'Nanga def?' signifiant littéralement 'Je suis là seulement'.",
        context: "Utilisé comme réponse positive quand on vous demande comment vous allez.",
        variations: ["Maa ngi fi rekk", "Mangi fi rek"],
        likes: 302,
        usageCount: 987,
        audio: "audio/mangi-fi-rekk.mp3"
      },
      {
        id: 3,
        wolof: "Ba beneen yoon",
        francais: "À une prochaine fois",
        transliteration: "ba bé-nen yoon",
        category: "salutations",
        difficulty: "débutant",
        explanation: "Expression utilisée pour dire au revoir tout en exprimant le souhait de se revoir.",
        context: "Utilisé quand on quitte quelqu'un avec qui on espère renouer le contact.",
        variations: ["Ba beneen"],
        likes: 228,
        usageCount: 764,
        audio: "audio/ba-beneen-yoon.mp3"
      },
      {
        id: 4,
        wolof: "Ndank-ndank mooy jàpp golo ci ñaay",
        francais: "Petit à petit, on attrape le singe dans la brousse",
        transliteration: "ndank-ndank mooy japp golo ci ñaay",
        category: "proverbes",
        difficulty: "avancé",
        explanation: "Proverbe soulignant l'importance de la patience et de la persévérance pour atteindre ses objectifs.",
        context: "Utilisé pour encourager quelqu'un qui trouve qu'un processus prend du temps ou est difficile.",
        variations: [],
        likes: 589,
        usageCount: 431,
        audio: "audio/ndank-ndank.mp3"
      },
      {
        id: 5,
        wolof: "Fii lañuy jënd",
        francais: "On achète ici",
        transliteration: "fii lañuy jënd",
        category: "quotidien",
        difficulty: "intermédiaire",
        explanation: "Expression utile pour indiquer un lieu d'achat ou demander si on peut acheter à un endroit spécifique.",
        context: "Pratique dans les marchés, boutiques ou lors des transactions commerciales.",
        variations: ["Fi lañuy jënd"],
        likes: 173,
        usageCount: 612,
        audio: "audio/fii-lanuy-jend.mp3"
      },
      {
        id: 6,
        wolof: "Wóoy sama garab laay wut",
        francais: "Je cherche mon médicament",
        transliteration: "wooy sama garab laay wut",
        category: "urgences",
        difficulty: "intermédiaire",
        explanation: "Phrase importante pour exprimer un besoin médical.",
        context: "Utile en cas d'urgence médicale ou dans une pharmacie.",
        variations: ["Sama garab laay wut"],
        likes: 192,
        usageCount: 421,
        audio: "audio/wooy-sama-garab.mp3"
      },
      {
        id: 7,
        wolof: "Añ bi jàpp na",
        francais: "Le déjeuner est prêt",
        transliteration: "añ bi jàpp na",
        category: "quotidien",
        difficulty: "débutant",
        explanation: "Expression courante pour annoncer que le repas est prêt à être servi.",
        context: "Utilisée dans le cadre familial ou lors de repas entre amis.",
        variations: ["Reer bi jàpp na (pour le dîner)"],
        likes: 138,
        usageCount: 562,
        audio: "audio/an-bi-japp-na.mp3"
      },
      {
        id: 8,
        wolof: "Fan la hotel bi nekk?",
        francais: "Où se trouve l'hôtel ?",
        transliteration: "fan la hotel bi nekk",
        category: "voyage",
        difficulty: "débutant",
        explanation: "Question permettant de demander l'emplacement d'un hôtel.",
        context: "Pratique pour les voyageurs cherchant leur hébergement.",
        variations: ["Fan la... nekk? (pour d'autres lieux)"],
        likes: 205,
        usageCount: 832,
        audio: "audio/fan-la-hotel.mp3"
      },
      {
        id: 9,
        wolof: "Ñaata lay jar?",
        francais: "Combien ça coûte ?",
        transliteration: "ñaata lay jar",
        category: "business",
        difficulty: "débutant",
        explanation: "Question essentielle pour connaître le prix d'un article ou service.",
        context: "Indispensable pour faire des achats dans les marchés ou boutiques.",
        variations: ["Ñaata?"],
        likes: 324,
        usageCount: 1103,
        audio: "audio/naata-lay-jar.mp3"
      },
      {
        id: 10,
        wolof: "Ku am yàpp, du joy wurus",
        francais: "Celui qui a de la viande ne se plaint pas de la sauce",
        transliteration: "ku am yàpp, du joy wurus",
        category: "proverbes",
        difficulty: "avancé",
        explanation: "Proverbe soulignant qu'il ne faut pas se plaindre de détails quand on a l'essentiel.",
        context: "Utilisé pour encourager la gratitude et la perspective.",
        variations: [],
        likes: 472,
        usageCount: 290,
        audio: "audio/ku-am-yapp.mp3"
      },
      {
        id: 11,
        wolof: "Dama feebar",
        francais: "Je suis malade",
        transliteration: "dama feebar",
        category: "urgences",
        difficulty: "débutant",
        explanation: "Expression importante pour signaler un problème de santé.",
        context: "Utile dans les situations médicales ou pour justifier une absence.",
        variations: ["Feebar naa"],
        likes: 156,
        usageCount: 432,
        audio: "audio/dama-feebar.mp3"
      },
      {
        id: 12,
        wolof: "Dañu nara wax ci affaire bi",
        francais: "Nous devons discuter de cette affaire",
        transliteration: "dañu nara wax ci affaire bi",
        category: "business",
        difficulty: "intermédiaire",
        explanation: "Phrase utile pour initier une discussion professionnelle ou négociation.",
        context: "Employée dans des contextes professionnels ou commerciaux.",
        variations: ["Dañuy wax ci..."],
        likes: 118,
        usageCount: 345,
        audio: "audio/danu-nara-wax.mp3"
      }
    ];
    
    // Ajouter plus de phrases pour rendre l'exemple plus riche
    const phraseTemplates = [
      {
        wolof: "Damay dem %s",
        francais: "Je vais à %s",
        category: "voyage",
        difficulty: "débutant"
      },
      {
        wolof: "Bëgg naa jàng %s",
        francais: "Je veux apprendre %s",
        category: "quotidien",
        difficulty: "débutant"
      },
      {
        wolof: "Jërejëf ci %s",
        francais: "Merci pour %s",
        category: "salutations",
        difficulty: "débutant"
      }
    ];
    
    // Locations et objets pour générer plus de phrases
    const locations = ["Dakar", "Thiès", "Saint-Louis", "Mbour", "Saly"];
    const subjects = ["wolof", "cuisine sénégalaise", "musique traditionnelle", "couture", "danse"];
    const objects = ["ndawtal bi", "mbaxal mi", "téeré bi", "caaxaan bi", "xaalis bi"];
    
    // Générer des phrases supplémentaires
    let additionalId = mockPhrases.length + 1;
    
    phraseTemplates.forEach(template => {
      const items = template.category === "voyage" ? locations : 
                   template.category === "quotidien" ? subjects : objects;
      
      items.forEach(item => {
        const wolof = template.wolof.replace("%s", item);
        const francais = template.francais.replace("%s", item);
        
        mockPhrases.push({
          id: additionalId++,
          wolof: wolof,
          francais: francais,
          transliteration: wolof.toLowerCase(),
          category: template.category,
          difficulty: template.difficulty,
          explanation: `Phrase utile pour exprimer une intention en rapport avec ${item}.`,
          context: `Utilisée dans des conversations ${template.category === "salutations" ? "quotidiennes" : template.category}.`,
          variations: [],
          likes: Math.floor(Math.random() * 300) + 50,
          usageCount: Math.floor(Math.random() * 800) + 200,
          audio: `audio/phrase-${additionalId}.mp3`
        });
      });
    });
    
    return mockPhrases;
  };

  // Effet pour le filtrage
  useEffect(() => {
    let result = [...phrases];
    
    // Filtre par recherche
    if (searchTerm) {
      result = result.filter(phrase => 
        phrase.wolof.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phrase.francais.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phrase.explanation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtre par catégorie
    if (activeCategory !== 'tous') {
      result = result.filter(phrase => phrase.category === activeCategory);
    }
    
    // Filtre par difficulté
    if (difficultyFilter !== 'tous') {
      result = result.filter(phrase => phrase.difficulty === difficultyFilter);
    }
    
    // Tri
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'usage':
        result.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case 'alphabetical':
        result.sort((a, b) => a.wolof.localeCompare(b.wolof));
        break;
      default:
        // Par défaut, on trie par popularité
        result.sort((a, b) => b.likes - a.likes);
    }
    
    setFilteredPhrases(result);
    setCurrentPage(1); // Retour à la première page après un filtrage
  }, [phrases, searchTerm, activeCategory, difficultyFilter, sortBy]);

  // Gestion de la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    // La recherche est déjà gérée par l'effet ci-dessus
  };

  // Fonction pour copier une phrase
  const copyPhrase = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    
    // Réinitialiser après 2 secondes
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Fonction pour basculer un favori
  const toggleFavorite = (id) => {
    if (favoriteIds.includes(id)) {
      setFavoriteIds(favoriteIds.filter(favId => favId !== id));
    } else {
      setFavoriteIds([...favoriteIds, id]);
    }
  };

  // Fonction pour ouvrir le modal avec une phrase
  const openPhraseModal = (phrase) => {
    setSelectedPhrase(phrase);
    setShowModal(true);
  };

  // Fonction pour lire la prononciation audio
  const playAudio = (audioSrc, event) => {
    if (event) event.stopPropagation();
    // Dans une implémentation réelle, vous connecteriez ceci à votre API audio
    console.log(`Playing audio: ${audioSrc}`);
    alert(`Lecture audio: ${audioSrc}`);
  };

  // Pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredPhrases.length / phrasesPerPage);
  
  // Obtenir les phrases pour la page actuelle
  const currentPhrases = filteredPhrases.slice(
    (currentPage - 1) * phrasesPerPage,
    currentPage * phrasesPerPage
  );

  // Catégories de phrases
  const categories = [
    { value: 'tous', label: 'Toutes les phrases' },
    { value: 'salutations', label: 'Salutations' },
    { value: 'quotidien', label: 'Vie quotidienne' },
    { value: 'voyage', label: 'Voyage' },
    { value: 'business', label: 'Affaires' },
    { value: 'proverbes', label: 'Proverbes' },
    { value: 'urgences', label: 'Urgences' }
  ];

  // Options de difficulté
  const difficulties = [
    { value: 'tous', label: 'Tous les niveaux' },
    { value: 'débutant', label: 'Débutant' },
    { value: 'intermédiaire', label: 'Intermédiaire' },
    { value: 'avancé', label: 'Avancé' }
  ];

  // Options de tri
  const sortOptions = [
    { value: 'popular', label: 'Popularité' },
    { value: 'usage', label: 'Fréquence d\'usage' },
    { value: 'alphabetical', label: 'Alphabétique' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8 text-center">
        <h1 className={`text-4xl font-bold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>
          Expressions et Phrases Wolof
        </h1>
        <p className={`text-lg max-w-3xl mx-auto ${getThemeClass('text-gray-600', 'text-gray-300')}`}>
          Découvrez des expressions courantes, des proverbes traditionnels et des phrases utiles en wolof pour enrichir votre vocabulaire et améliorer votre communication.
        </p>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="relative mb-4">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une phrase en wolof ou français..."
            className={`w-full pl-12 pr-12 py-4 rounded-xl ${getThemeClass(
              'bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
              'bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-800'
            )} focus:outline-none transition-all`}
          />
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${getThemeClass('text-gray-400', 'text-gray-500')}`} />
          
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className={`absolute right-20 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${getThemeClass('text-gray-400 hover:text-gray-600 hover:bg-gray-100', 'text-gray-500 hover:text-gray-300 hover:bg-gray-700')}`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <button
            type="submit"
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </form>
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center ${getThemeClass(
                'bg-gray-100 text-gray-700 hover:bg-gray-200',
                'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
            
            {activeCategory !== 'tous' && (
              <div className={`px-3 py-1 rounded-lg flex items-center ${getThemeClass(
                'bg-blue-100 text-blue-700',
                'bg-blue-900/30 text-blue-300'
              )}`}>
                <span>Catégorie: {categories.find(c => c.value === activeCategory)?.label}</span>
                <button
                  onClick={() => setActiveCategory('tous')}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {difficultyFilter !== 'tous' && (
              <div className={`px-3 py-1 rounded-lg flex items-center ${getThemeClass(
                'bg-green-100 text-green-700',
                'bg-green-900/30 text-green-300'
              )}`}>
                <span>Niveau: {difficulties.find(d => d.value === difficultyFilter)?.label}</span>
                <button
                  onClick={() => setDifficultyFilter('tous')}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`py-2 px-3 rounded-lg ${getThemeClass(
                'bg-gray-100 text-gray-700 border border-gray-200',
                'bg-gray-800 text-gray-200 border border-gray-700'
              )} focus:outline-none`}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  Trier par: {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Panneau de filtres avancés */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`mb-6 p-4 rounded-xl ${getThemeClass('bg-gray-50 border border-gray-200', 'bg-gray-800 border border-gray-700')}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`font-medium mb-3 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                    Catégories
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.filter(cat => cat.value !== 'tous').map((category) => (
                      <button
                        key={category.value}
                        onClick={() => setActiveCategory(category.value === activeCategory ? 'tous' : category.value)}
                        className={`px-4 py-2 text-sm rounded-lg flex items-center justify-between ${
                          category.value === activeCategory
                            ? getThemeClass('bg-blue-100 text-blue-700', 'bg-blue-900/30 text-blue-300')
                            : getThemeClass('bg-white border border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600')
                        }`}
                      >
                        <span>{category.label}</span>
                        {category.value === activeCategory && (
                          <CheckCircle className="w-4 h-4 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className={`font-medium mb-3 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                    Niveau de difficulté
                  </h3>
                  <div className="space-y-2">
                    {difficulties.filter(d => d.value !== 'tous').map((level) => (
                      <button
                        key={level.value}
                        onClick={() => setDifficultyFilter(level.value === difficultyFilter ? 'tous' : level.value)}
                        className={`w-full px-4 py-2 text-sm rounded-lg flex items-center justify-between ${
                          level.value === difficultyFilter
                            ? level.value === 'débutant'
                              ? getThemeClass('bg-green-100 text-green-700', 'bg-green-900/30 text-green-300')
                              : level.value === 'intermédiaire'
                                ? getThemeClass('bg-yellow-100 text-yellow-700', 'bg-yellow-900/30 text-yellow-300')
                                : getThemeClass('bg-red-100 text-red-700', 'bg-red-900/30 text-red-300')
                            : getThemeClass('bg-white border border-gray-200 text-gray-700 hover:bg-gray-50', 'bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600')
                        }`}
                      >
                        <span>{level.label}</span>
                        {level.value === difficultyFilter && (
                          <CheckCircle className="w-4 h-4 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => {
                    setActiveCategory('tous');
                    setDifficultyFilter('tous');
                  }}
                  className={`px-4 py-2 rounded-lg ${getThemeClass(
                    'text-gray-700 bg-gray-200 hover:bg-gray-300',
                    'text-gray-300 bg-gray-700 hover:bg-gray-600'
                  )}`}
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className={`px-4 py-2 rounded-lg ${getThemeClass(
                    'bg-blue-600 text-white hover:bg-blue-700',
                    'bg-blue-600 text-white hover:bg-blue-700'
                  )}`}
                >
                  Appliquer
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Navigation par catégories */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value === activeCategory ? 'tous' : category.value)}
              className={`px-4 py-2 rounded-full text-sm ${
                activeCategory === category.value 
                  ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white') 
                  : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-800 text-gray-300 hover:bg-gray-700')
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Résultats */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <p className={getThemeClass('text-gray-600', 'text-gray-400')}>
            {filteredPhrases.length} expressions trouvées
          </p>
          {filteredPhrases.length > 0 && (
            <button className={`flex items-center text-sm ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}>
              <Download className="w-4 h-4 mr-1" />
              Télécharger en PDF
            </button>
          )}
        </div>
        
        {loading ? (
          // État de chargement
          <div className="py-12 text-center">
            <div className={`inline-block w-12 h-12 rounded-full border-4 border-t-blue-600 ${getThemeClass('border-gray-200', 'border-gray-700')} animate-spin mb-4`}></div>
            <p className={getThemeClass('text-gray-600', 'text-gray-400')}>Chargement des expressions...</p>
          </div>
        ) : filteredPhrases.length === 0 ? (
          // Aucun résultat
          <div className={`py-12 text-center ${getThemeClass('bg-gray-50', 'bg-gray-900')} rounded-xl`}>
       <MessageCircle className={`w-16 h-16 mx-auto mb-4 ${getThemeClass('text-gray-400', 'text-gray-600')}`} />
            <h3 className={`text-xl font-medium mb-2 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
              Aucune expression trouvée
            </h3>
            <p className={`max-w-md mx-auto ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
              Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
            </p>
          </div>
        ) : (
          // Affichage des résultats
          <div className="space-y-6">
            {currentPhrases.map((phrase) => (
              <div 
                key={phrase.id}
                className={`rounded-xl overflow-hidden border ${getThemeClass(
                  'bg-white border-gray-200 hover:border-blue-300',
                  'bg-gray-800 border-gray-700 hover:border-blue-600'
                )} transition-all duration-200 shadow-sm hover:shadow-md`}
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 
                        onClick={() => openPhraseModal(phrase)}
                        className={`text-xl font-bold mb-1 cursor-pointer hover:underline ${getThemeClass('text-blue-700', 'text-blue-400')}`}
                      >
                        {phrase.wolof}
                      </h3>
                      <div className={`text-lg ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                        {phrase.francais}
                      </div>
                      <div className={`text-sm italic mt-1 ${getThemeClass('text-gray-500', 'text-gray-500')}`}>
                        {phrase.transliteration}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs flex items-center ${
                        phrase.category === 'salutations' 
                          ? getThemeClass('bg-blue-100 text-blue-700', 'bg-blue-900/30 text-blue-300')
                          : phrase.category === 'quotidien'
                          ? getThemeClass('bg-green-100 text-green-700', 'bg-green-900/30 text-green-300')
                          : phrase.category === 'voyage'
                          ? getThemeClass('bg-purple-100 text-purple-700', 'bg-purple-900/30 text-purple-300')
                          : phrase.category === 'proverbes'
                          ? getThemeClass('bg-amber-100 text-amber-700', 'bg-amber-900/30 text-amber-300')
                          : phrase.category === 'business'
                          ? getThemeClass('bg-indigo-100 text-indigo-700', 'bg-indigo-900/30 text-indigo-300')
                          : getThemeClass('bg-red-100 text-red-700', 'bg-red-900/30 text-red-300')
                      }`}>
                        <Tag className="w-3 h-3 mr-1" />
                        {phrase.category}
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-xs flex items-center ${
                        phrase.difficulty === 'débutant' 
                          ? getThemeClass('bg-green-100 text-green-700', 'bg-green-900/30 text-green-300')
                          : phrase.difficulty === 'intermédiaire'
                          ? getThemeClass('bg-yellow-100 text-yellow-700', 'bg-yellow-900/30 text-yellow-300')
                          : getThemeClass('bg-red-100 text-red-700', 'bg-red-900/30 text-red-300')
                      }`}>
                        {phrase.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`mb-4 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                    {phrase.explanation}
                  </p>
                  
                  <div className="flex flex-wrap justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={(e) => playAudio(phrase.audio, e)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg ${getThemeClass(
                          'bg-blue-50 text-blue-600 hover:bg-blue-100',
                          'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30'
                        )}`}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Écouter</span>
                      </button>
                      
                      <button 
                        onClick={() => copyPhrase(phrase.wolof, phrase.id)}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-lg ${getThemeClass(
                          'bg-gray-50 text-gray-600 hover:bg-gray-100',
                          'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        )}`}
                      >
                        {copiedId === phrase.id ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Copié!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Star className={`w-5 h-5 ${getThemeClass('text-amber-400', 'text-amber-400')}`} fill="currentColor" />
                        <span className={`ml-1 text-sm ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                          {phrase.likes}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => toggleFavorite(phrase.id)}
                        className={`${
                          favoriteIds.includes(phrase.id) 
                            ? getThemeClass('text-red-500', 'text-red-400') 
                            : getThemeClass('text-gray-400 hover:text-red-500', 'text-gray-500 hover:text-red-400')
                        }`}
                        aria-label={favoriteIds.includes(phrase.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Heart className={`w-5 h-5 ${favoriteIds.includes(phrase.id) ? 'fill-current' : ''}`} />
                      </button>
                      
                      <button
                        onClick={() => openPhraseModal(phrase)}
                        className={`p-1 rounded-full ${getThemeClass('text-gray-500 hover:bg-gray-100', 'text-gray-400 hover:bg-gray-700')}`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1
                  ? getThemeClass('bg-gray-100 text-gray-400 cursor-not-allowed', 'bg-gray-800 text-gray-600 cursor-not-allowed')
                  : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-800 text-gray-300 hover:bg-gray-700')
              }`}
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({length: totalPages}, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className={getThemeClass('text-gray-400', 'text-gray-500')}>...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 rounded-lg ${
                      page === currentPage
                        ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')
                        : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-800 text-gray-300 hover:bg-gray-700')
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))
            }
            
            <button
              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages
                  ? getThemeClass('bg-gray-100 text-gray-400 cursor-not-allowed', 'bg-gray-800 text-gray-600 cursor-not-allowed')
                  : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-800 text-gray-300 hover:bg-gray-700')
              }`}
              aria-label="Page suivante"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
      {/* Section d'assistance et de contribution */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div className={`p-6 rounded-xl ${getThemeClass('bg-blue-50', 'bg-blue-900/20')}`}>
          <h2 className={`text-xl font-bold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>
            Besoin d'aide pour apprendre?
          </h2>
          <p className={`mb-4 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
            Nous proposons des ressources complémentaires pour faciliter votre apprentissage du wolof:
          </p>
          <ul className={`space-y-3 mb-6 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
            <li className="flex items-start">
              <Play className={`w-5 h-5 mr-2 mt-0.5 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
              <span>Leçons audio avec prononciation native</span>
            </li>
            <li className="flex items-start">
              <Book className={`w-5 h-5 mr-2 mt-0.5 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
              <span>Guide de grammaire et de conjugaison</span>
            </li>
            <li className="flex items-start">
              <Mic className={`w-5 h-5 mr-2 mt-0.5 ${getThemeClass('text-blue-600', 'text-blue-400')}`} />
              <span>Exercices de conversation pratiques</span>
            </li>
          </ul>
          <Link 
            to="/resources" 
            className={`inline-flex items-center ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}
          >
            Découvrir toutes les ressources
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        <div className={`p-6 rounded-xl ${getThemeClass('bg-green-50', 'bg-green-900/20')}`}>
          <h2 className={`text-xl font-bold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>
            Contribuez à notre projet
          </h2>
          <p className={`mb-4 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
            Aidez-nous à enrichir cette base de connaissances linguistiques:
          </p>
          <ul className={`space-y-3 mb-6 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
            <li className="flex items-start">
              <PlusCircle className={`w-5 h-5 mr-2 mt-0.5 ${getThemeClass('text-green-600', 'text-green-400')}`} />
              <span>Ajouter de nouvelles expressions</span>
            </li>
            <li className="flex items-start">
              <MessageCircle className={`w-5 h-5 mr-2 mt-0.5 ${getThemeClass('text-green-600', 'text-green-400')}`} />
              <span>Partager vos connaissances culturelles</span>
            </li>
            <li className="flex items-start">
              <Coffee className={`w-5 h-5 mr-2 mt-0.5 ${getThemeClass('text-green-600', 'text-green-400')}`} />
              <span>Soutenir le développement de la plateforme</span>
            </li>
          </ul>
          <Link 
            to="/contribute" 
            className={`inline-flex items-center ${getThemeClass('text-green-600 hover:text-green-800', 'text-green-400 hover:text-green-300')}`}
          >
            Comment contribuer
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
      
      {/* Bouton de retour en haut */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-600 text-white hover:bg-blue-700')}`}
        aria-label="Retour en haut"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
      
      {/* Modal de détail */}
      <AnimatePresence>
        {showModal && selectedPhrase && (
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
              onClick={(e) => e.stopPropagation()}
              className={`relative max-w-2xl w-full rounded-2xl shadow-2xl ${getThemeClass('bg-white', 'bg-gray-800')}`}
            >
              <div className={`p-6 ${getThemeClass('', '')}`}>
                <button 
                  onClick={() => setShowModal(false)}
                  className={`absolute top-4 right-4 p-2 rounded-full ${getThemeClass('text-gray-400 hover:bg-gray-100', 'text-gray-500 hover:bg-gray-700')}`}
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="mb-6">
                  <div className={`text-3xl font-bold mb-2 ${getThemeClass('text-blue-700', 'text-blue-400')}`}>
                    {selectedPhrase.wolof}
                  </div>
                  <div className={`text-xl mb-1 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                    {selectedPhrase.francais}
                  </div>
                  <div className={`text-sm italic ${getThemeClass('text-gray-500', 'text-gray-500')}`}>
                    {selectedPhrase.transliteration}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs flex items-center ${
                    selectedPhrase.category === 'salutations' 
                      ? getThemeClass('bg-blue-100 text-blue-700', 'bg-blue-900/30 text-blue-300')
                      : selectedPhrase.category === 'quotidien'
                      ? getThemeClass('bg-green-100 text-green-700', 'bg-green-900/30 text-green-300')
                      : selectedPhrase.category === 'voyage'
                      ? getThemeClass('bg-purple-100 text-purple-700', 'bg-purple-900/30 text-purple-300')
                      : selectedPhrase.category === 'proverbes'
                      ? getThemeClass('bg-amber-100 text-amber-700', 'bg-amber-900/30 text-amber-300')
                      : selectedPhrase.category === 'business'
                      ? getThemeClass('bg-indigo-100 text-indigo-700', 'bg-indigo-900/30 text-indigo-300')
                      : getThemeClass('bg-red-100 text-red-700', 'bg-red-900/30 text-red-300')
                  }`}>
                    <Tag className="w-3 h-3 mr-1" />
                    {selectedPhrase.category}
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-xs flex items-center ${
                    selectedPhrase.difficulty === 'débutant' 
                      ? getThemeClass('bg-green-100 text-green-700', 'bg-green-900/30 text-green-300')
                      : selectedPhrase.difficulty === 'intermédiaire'
                      ? getThemeClass('bg-yellow-100 text-yellow-700', 'bg-yellow-900/30 text-yellow-300')
                      : getThemeClass('bg-red-100 text-red-700', 'bg-red-900/30 text-red-300')
                  }`}>
                    {selectedPhrase.difficulty}
                  </span>
                </div>
                
                <div className={`mb-6 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                  <h3 className={`font-semibold mb-2 ${getThemeClass('text-gray-900', 'text-gray-100')}`}>
                    Explication
                  </h3>
                  <p>{selectedPhrase.explanation}</p>
                </div>
                
                <div className={`mb-6 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                  <h3 className={`font-semibold mb-2 ${getThemeClass('text-gray-900', 'text-gray-100')}`}>
                    Contexte d'utilisation
                  </h3>
                  <p>{selectedPhrase.context}</p>
                </div>
                
                {selectedPhrase.variations && selectedPhrase.variations.length > 0 && (
                  <div className="mb-6">
                    <h3 className={`font-semibold mb-2 ${getThemeClass('text-gray-900', 'text-gray-100')}`}>
                      Variations
                    </h3>
                    <ul className={`space-y-2 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
                      {selectedPhrase.variations.map((variation, idx) => (
                        <li key={idx} className="flex items-center justify-between">
                          <span>{variation}</span>
                          <button 
                            onClick={() => copyPhrase(variation, `var-${idx}`)}
                            className={`p-1 rounded-full ${getThemeClass('text-gray-500 hover:bg-gray-100', 'text-gray-400 hover:bg-gray-700')}`}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-3 mt-8">
                  <button 
                    onClick={() => playAudio(selectedPhrase.audio)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${getThemeClass(
                      'bg-blue-600 text-white hover:bg-blue-700',
                      'bg-blue-600 text-white hover:bg-blue-700'
                    )}`}
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>Écouter la prononciation</span>
                  </button>
                  
                  <button 
                    onClick={() => copyPhrase(selectedPhrase.wolof, 'modal')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${getThemeClass(
                      'bg-gray-100 text-gray-700 hover:bg-gray-200',
                      'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    )}`}
                  >
                    <Copy className="w-5 h-5" />
                    <span>Copier</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      toggleFavorite(selectedPhrase.id);
                      setShowModal(false);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                      favoriteIds.includes(selectedPhrase.id) 
                        ? getThemeClass('bg-red-100 text-red-600 hover:bg-red-200', 'bg-red-900/30 text-red-400 hover:bg-red-900/40') 
                        : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-700 text-gray-300 hover:bg-gray-600')
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${favoriteIds.includes(selectedPhrase.id) ? 'fill-current' : ''}`} />
                    <span>
                      {favoriteIds.includes(selectedPhrase.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhrasesPage;