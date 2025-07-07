import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  Bookmark, 
  Heart, 
  Share2, 
  X, 
  ArrowUp,
  Download,
  List,
  LayoutGrid,
  SlidersHorizontal,
  Check
} from 'lucide-react';

const DictionaryExplorer = ({ darkMode }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('tous');
  const [favorites, setFavorites] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    sortBy: 'popularity', // 'popularity', 'alphabetical', 'recent'
    categories: [],
    difficulty: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const wordsPerPage = 12;
  
  // Classes conditionnelles selon le mode
  const getThemeClass = (lightClass, darkClass) => {
    return darkMode ? darkClass : lightClass;
  };

  useEffect(() => {
    // Simuler le chargement des données
    setLoading(true);
    
    setTimeout(() => {
      // Générer des mots factices
      const mockWords = generateMockWords();
      
      // Filtrer par terme de recherche si nécessaire
      const filtered = searchTerm ? 
        mockWords.filter(word => 
          word.wolof.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.francais.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.description.toLowerCase().includes(searchTerm.toLowerCase())
        ) : mockWords;
      
      // Filtrer par lettre sélectionnée si nécessaire
      const letterFiltered = selectedLetter ? 
        filtered.filter(word => word.wolof.toLowerCase().startsWith(selectedLetter.toLowerCase())) : 
        filtered;
      
      // Filtrer par catégorie si nécessaire
      const categoryFiltered = activeCategory !== 'tous' ? 
        letterFiltered.filter(word => word.category === activeCategory) : 
        letterFiltered;
      
      // Appliquer le tri
      let sorted = [...categoryFiltered];
      switch(filters.sortBy) {
        case 'alphabetical':
          sorted.sort((a, b) => a.wolof.localeCompare(b.wolof));
          break;
        case 'recent':
          sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
          break;
        case 'popularity':
        default:
          sorted.sort((a, b) => b.views - a.views);
          break;
      }
      
      setWords(sorted);
      setTotalPages(Math.ceil(sorted.length / wordsPerPage));
      setLoading(false);
    }, 800);
  }, [searchTerm, activeCategory, filters.sortBy, selectedLetter]);

  // Fonction pour générer des mots factices
  const generateMockWords = () => {
    const categories = ['quotidien', 'culture', 'nourriture', 'famille', 'éducation', 'voyage'];
    const mockWords = [];
    
    const wordsList = [
      { wolof: 'Teranga', francais: 'Hospitalité', category: 'culture' },
      { wolof: 'Jàmm', francais: 'Paix', category: 'quotidien' },
      { wolof: 'Dëgg', francais: 'Vérité', category: 'culture' },
      { wolof: 'Neex', francais: 'Être délicieux', category: 'nourriture' },
      { wolof: 'Njar', francais: 'Manger', category: 'nourriture' },
      { wolof: 'Ndaw', francais: 'Jeune', category: 'famille' },
      { wolof: 'Mag', francais: 'Âgé', category: 'famille' },
      { wolof: 'Jàng', francais: 'Étudier', category: 'éducation' },
      { wolof: 'Dem', francais: 'Aller', category: 'voyage' },
      { wolof: 'Ñów', francais: 'Venir', category: 'voyage' },
      { wolof: 'Liggéey', francais: 'Travailler', category: 'quotidien' },
      { wolof: 'Xarit', francais: 'Ami', category: 'famille' },
      { wolof: 'Mbokk', francais: 'Parent', category: 'famille' },
      { wolof: 'Doole', francais: 'Force', category: 'culture' },
      { wolof: 'Bët', francais: 'Œil', category: 'quotidien' },
      { wolof: 'Loxo', francais: 'Main', category: 'quotidien' },
      { wolof: 'Ub', francais: 'Fermer', category: 'quotidien' },
      { wolof: 'Nit', francais: 'Personne', category: 'quotidien' },
      { wolof: 'Muñ', francais: 'Patience', category: 'culture' },
      { wolof: 'Takk', francais: 'Mariage', category: 'famille' },
      { wolof: 'Ceeb', francais: 'Riz', category: 'nourriture' },
      { wolof: 'Yàpp', francais: 'Viande', category: 'nourriture' },
      { wolof: 'Safara', francais: 'Feu', category: 'quotidien' },
      { wolof: 'Góor', francais: 'Homme', category: 'famille' },
      { wolof: 'Jabar', francais: 'Femme', category: 'famille' },
      { wolof: 'Xale', francais: 'Enfant', category: 'famille' },
      { wolof: 'Kër', francais: 'Maison', category: 'quotidien' },
      { wolof: 'Suba', francais: 'Demain', category: 'quotidien' },
      { wolof: 'Démb', francais: 'Hier', category: 'quotidien' },
      { wolof: 'Ganaar', francais: 'Poulet', category: 'nourriture' },
      { wolof: 'Gerte', francais: 'Arachide', category: 'nourriture' },
      { wolof: 'Kaani', francais: 'Piment', category: 'nourriture' },
      { wolof: 'Soow', francais: 'Légume', category: 'nourriture' },
      { wolof: 'Ndap', francais: 'Marmite', category: 'quotidien' },
      { wolof: 'Làkk', francais: 'Langue', category: 'culture' },
      { wolof: 'Sama', francais: 'Mon/Ma', category: 'quotidien' }
    ];
    
    // Créer une copie étendue avec des détails supplémentaires
    wordsList.forEach((word, index) => {
      mockWords.push({
        id: index + 1,
        wolof: word.wolof,
        francais: word.francais,
        phonetic: `/${word.wolof.toLowerCase()}/`,
        description: `Terme ${word.category} désignant ${word.francais.toLowerCase()} dans la culture wolof.`,
        example: `Exemple d'utilisation: "${word.wolof} bi neex na."`,
        category: word.category,
        difficulty: ['débutant', 'intermédiaire', 'avancé'][Math.floor(Math.random() * 3)],
        views: Math.floor(Math.random() * 1000) + 50,
        dateAdded: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
        isFavorite: Math.random() > 0.8
      });
    });
    
    return mockWords;
  };

  // Fonction pour la gestion de la recherche
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ q: searchTerm });
    setCurrentPage(1);
  };

  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      sortBy: 'popularity',
      categories: [],
      difficulty: []
    });
    setSelectedLetter(null);
    setActiveCategory('tous');
  };

  // Fonction pour basculer les favoris
  const toggleFavorite = (wordId) => {
    setWords(
      words.map(word => 
        word.id === wordId ? {...word, isFavorite: !word.isFavorite} : word
      )
    );
  };

  // Fonction pour la pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtrer les mots pour la page actuelle
  const currentWords = words.slice(
    (currentPage - 1) * wordsPerPage,
    currentPage * wordsPerPage
  );

  // Générer le tableau de l'alphabet
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const specialLetters = ['Ñ', 'Ŋ', 'É', 'À', 'Ë'];
  const completeAlphabet = [...alphabet, ...specialLetters];

  // Options de tri
  const sortOptions = [
    { value: 'popularity', label: 'Popularité' },
    { value: 'alphabetical', label: 'Alphabétique (A-Z)' },
    { value: 'recent', label: 'Plus récents' }
  ];

  // Catégories
  const categories = [
    { value: 'tous', label: 'Tous' },
    { value: 'quotidien', label: 'Quotidien' },
    { value: 'culture', label: 'Culture' },
    { value: 'nourriture', label: 'Nourriture' },
    { value: 'famille', label: 'Famille' },
    { value: 'éducation', label: 'Éducation' },
    { value: 'voyage', label: 'Voyage' }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8 text-center">
        <h1 className={`text-4xl font-bold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>
          Dictionnaire Wolof
        </h1>
        <p className={`text-lg max-w-3xl mx-auto ${getThemeClass('text-gray-600', 'text-gray-300')}`}>
          Explorez notre dictionnaire complet de la langue wolof avec plus de 3000 mots, expressions et définitions.
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
            placeholder="Rechercher un mot en wolof ou français..."
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
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center ${getThemeClass(
                'bg-gray-100 text-gray-700 hover:bg-gray-200',
                'bg-gray-800 text-gray-300 hover:bg-gray-700'
              )}`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtres avancés
            </button>
            
            {selectedLetter && (
              <div className={`px-3 py-1 rounded-lg flex items-center ${getThemeClass(
                'bg-blue-100 text-blue-700',
                'bg-blue-900/30 text-blue-300'
              )}`}>
                <span>Lettre: {selectedLetter}</span>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {activeCategory !== 'tous' && (
              <div className={`px-3 py-1 rounded-lg flex items-center ${getThemeClass(
                'bg-green-100 text-green-700',
                'bg-green-900/30 text-green-300'
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
            
            {(selectedLetter || activeCategory !== 'tous' || filters.sortBy !== 'popularity') && (
              <button
                onClick={resetFilters}
                className={`text-sm ${getThemeClass('text-gray-600 hover:text-red-600', 'text-gray-400 hover:text-red-400')}`}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded-lg ${getThemeClass('bg-gray-100', 'bg-gray-800')}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? getThemeClass('bg-white text-blue-600', 'bg-gray-700 text-blue-400') : getThemeClass('text-gray-500', 'text-gray-500')}`}
                aria-label="Vue en grille"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${viewMode === 'list' ? getThemeClass('bg-white text-blue-600', 'bg-gray-700 text-blue-400') : getThemeClass('text-gray-500', 'text-gray-500')}`}
                aria-label="Vue en liste"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className={`py-2 px-3 rounded-lg ${getThemeClass(
                'bg-gray-100 text-gray-700 border border-gray-200',
                'bg-gray-800 text-gray-200 border border-gray-700'
              )} focus:outline-none`}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Panneau de filtres avancés */}
        {showFilters && (
          <div className={`mt-4 p-4 rounded-xl ${getThemeClass('bg-gray-50 border border-gray-200', 'bg-gray-800 border border-gray-700')}`}>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className={`font-medium mb-3 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                  Niveau de difficulté
                </h3>
                <div className="space-y-2">
                  {['débutant', 'intermédiaire', 'avancé'].map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.difficulty.includes(level)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({
                              ...filters,
                              difficulty: [...filters.difficulty, level]
                            });
                          } else {
                            setFilters({
                              ...filters,
                              difficulty: filters.difficulty.filter(l => l !== level)
                            });
                          }
                        }}
                        className="rounded text-blue-600 mr-2"
                      />
                      <span className={getThemeClass('text-gray-700', 'text-gray-300')}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className={`font-medium mb-3 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                  Catégories
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {categories.filter(cat => cat.value !== 'tous').map((category) => (
                    <label key={category.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({
                              ...filters,
                              categories: [...filters.categories, category.value]
                            });
                          } else {
                            setFilters({
                              ...filters,
                              categories: filters.categories.filter(c => c !== category.value)
                            });
                          }
                        }}
                        className="rounded text-blue-600 mr-2"
                      />
                      <span className={getThemeClass('text-gray-700', 'text-gray-300')}>
                        {category.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={resetFilters}
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
                Appliquer les filtres
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation alphabétique */}
      <div className="mb-8 overflow-x-auto">
        <div className="inline-flex flex-wrap justify-center gap-1 min-w-full py-2">
          {completeAlphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter === selectedLetter ? null : letter)}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                selectedLetter === letter 
                  ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white') 
                  : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-800 text-gray-300 hover:bg-gray-700')
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
      
      {/* Filtres par catégorie */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value)}
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
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <p className={getThemeClass('text-gray-600', 'text-gray-400')}>
            {words.length} résultats
          </p>
          {words.length > 0 && (
            <button className={`flex items-center text-sm ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}>
              <Download className="w-4 h-4 mr-1" />
              Télécharger les résultats
            </button>
          )}
        </div>
        
        {loading ? (
          // État de chargement
          <div className="py-12 text-center">
            <div className={`inline-block w-12 h-12 rounded-full border-4 border-t-blue-600 ${getThemeClass('border-gray-200', 'border-gray-700')} animate-spin mb-4`}></div>
            <p className={getThemeClass('text-gray-600', 'text-gray-400')}>Chargement du dictionnaire...</p>
          </div>
        ) : words.length === 0 ? (
          // Aucun résultat
          <div className={`py-12 text-center ${getThemeClass('bg-gray-50', 'bg-gray-900')} rounded-xl`}>
            <BookOpen className={`w-16 h-16 mx-auto mb-4 ${getThemeClass('text-gray-400', 'text-gray-600')}`} />
            <h3 className={`text-xl font-medium mb-2 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
              Aucun résultat trouvé
            </h3>
            <p className={`max-w-md mx-auto ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
              Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
            </p>
          </div>
        ) : (
          // Affichage des résultats
          viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentWords.map((word) => (
                <div 
                  key={word.id}
                  className={`rounded-xl p-5 ${getThemeClass('bg-white border border-gray-100 shadow-sm hover:shadow', 'bg-gray-800 border border-gray-700 hover:bg-gray-750')}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={`text-xl font-bold ${getThemeClass('text-gray-900', 'text-white')}`}>
                        {word.wolof}
                      </h3>
                      <div className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>
                        {word.phonetic}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(word.id)}
                      className={word.isFavorite 
                        ? getThemeClass('text-red-500', 'text-red-400') 
                        : getThemeClass('text-gray-400 hover:text-red-500', 'text-gray-500 hover:text-red-400')
                      }
                      aria-label={word.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Heart className={`w-5 h-5 ${word.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className={`text-lg font-medium ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                      {word.francais}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs ${
                      word.category === 'quotidien' 
                        ? getThemeClass('bg-green-100 text-green-800', 'bg-green-900/30 text-green-400')
                        : word.category === 'culture'
                        ? getThemeClass('bg-purple-100 text-purple-800', 'bg-purple-900/30 text-purple-400')
                        : word.category === 'famille'
                        ? getThemeClass('bg-pink-100 text-pink-800', 'bg-pink-900/30 text-pink-400')
                        : word.category === 'nourriture'
                        ? getThemeClass('bg-orange-100 text-orange-800', 'bg-orange-900/30 text-orange-400')
                        : word.category === 'éducation'
                        ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/30 text-blue-400')
                        : getThemeClass('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')
                    }`}>
                      {word.category}
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-4 line-clamp-2 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
                    {word.description}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <button className={`flex items-center text-sm ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}>
                      <Volume2 className="w-4 h-4 mr-1" />
                      Écouter
                    </button>
                    <Link 
                      to={`/dictionary/${word.id}`}
                      className={`flex items-center text-sm font-medium ${getThemeClass('text-gray-700 hover:text-blue-600', 'text-gray-300 hover:text-blue-400')}`}
                    >
                      Détails
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {currentWords.map((word) => (
         <div 
         key={word.id}
         className={`flex border rounded-xl overflow-hidden ${getThemeClass('bg-white border-gray-100', 'bg-gray-800 border-gray-700')}`}
       >
         <div className={`px-5 py-4 flex-grow`}>
           <div className="flex justify-between items-start">
             <div>
               <div className="flex items-center mb-1">
                 <h3 className={`text-lg font-bold ${getThemeClass('text-gray-900', 'text-white')} mr-2`}>
                   {word.wolof}
                 </h3>
                 <span className={`text-sm ${getThemeClass('text-gray-500', 'text-gray-400')}`}>
                   {word.phonetic}
                 </span>
               </div>
               <div className={`text-base font-medium ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
                 {word.francais}
               </div>
             </div>
             <div className="flex items-center space-x-2">
               <div className={`px-2 py-1 rounded-full text-xs ${
                 word.category === 'quotidien' 
                   ? getThemeClass('bg-green-100 text-green-800', 'bg-green-900/30 text-green-400')
                   : word.category === 'culture'
                   ? getThemeClass('bg-purple-100 text-purple-800', 'bg-purple-900/30 text-purple-400')
                   : word.category === 'famille'
                   ? getThemeClass('bg-pink-100 text-pink-800', 'bg-pink-900/30 text-pink-400')
                   : word.category === 'nourriture'
                   ? getThemeClass('bg-orange-100 text-orange-800', 'bg-orange-900/30 text-orange-400')
                   : word.category === 'éducation'
                   ? getThemeClass('bg-blue-100 text-blue-800', 'bg-blue-900/30 text-blue-400')
                   : getThemeClass('bg-gray-100 text-gray-800', 'bg-gray-700 text-gray-300')
               }`}>
                 {word.category}
               </div>
               <button
                 onClick={() => toggleFavorite(word.id)}
                 className={word.isFavorite 
                   ? getThemeClass('text-red-500', 'text-red-400') 
                   : getThemeClass('text-gray-400 hover:text-red-500', 'text-gray-500 hover:text-red-400')
                 }
                 aria-label={word.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
               >
                 <Heart className={`w-5 h-5 ${word.isFavorite ? 'fill-current' : ''}`} />
               </button>
             </div>
           </div>
           
           <p className={`text-sm my-2 line-clamp-1 ${getThemeClass('text-gray-600', 'text-gray-400')}`}>
             {word.description}
           </p>
           
           <div className="flex items-center mt-2">
             <button className={`flex items-center text-sm mr-4 ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}>
               <Volume2 className="w-4 h-4 mr-1" />
               Écouter
             </button>
             <span className={`text-xs ${getThemeClass('text-gray-500', 'text-gray-500')}`}>
               {word.views} vues
             </span>
           </div>
         </div>
         
         <div className={`flex items-center px-4 ${getThemeClass('border-l border-gray-100', 'border-l border-gray-700')}`}>
           <Link 
             to={`/dictionary/${word.id}`}
             className={`p-2 rounded-full ${getThemeClass('hover:bg-gray-100', 'hover:bg-gray-700')}`}
             aria-label="Voir les détails"
           >
             <ChevronRight className={`w-6 h-6 ${getThemeClass('text-gray-500', 'text-gray-400')}`} />
           </Link>
         </div>
       </div>
     ))}
   </div>
 )
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
   
   {/* Première page */}
   {currentPage > 3 && (
     <>
       <button
         onClick={() => handlePageChange(1)}
         className={`w-10 h-10 rounded-lg ${getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-800 text-gray-300 hover:bg-gray-700')}`}
       >
         1
       </button>
       {currentPage > 4 && (
         <span className={getThemeClass('text-gray-400', 'text-gray-500')}>...</span>
       )}
     </>
   )}
   
   {/* Pages autour de la page courante */}
   {Array.from({length: totalPages}, (_, i) => i + 1)
     .filter(page => page >= currentPage - 1 && page <= currentPage + 1)
     .filter(page => page > 0 && page <= totalPages)
     .map(page => (
       <button
         key={page}
         onClick={() => handlePageChange(page)}
         className={`w-10 h-10 rounded-lg ${
           page === currentPage
             ? getThemeClass('bg-blue-600 text-white', 'bg-blue-600 text-white')
             : getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-800 text-gray-300 hover:bg-gray-700')
         }`}
       >
         {page}
       </button>
     ))
   }
   
   {/* Dernière page */}
   {currentPage < totalPages - 2 && (
     <>
       {currentPage < totalPages - 3 && (
         <span className={getThemeClass('text-gray-400', 'text-gray-500')}>...</span>
       )}
       <button
         onClick={() => handlePageChange(totalPages)}
         className={`w-10 h-10 rounded-lg ${getThemeClass('bg-gray-100 text-gray-700 hover:bg-gray-200', 'bg-gray-800 text-gray-300 hover:bg-gray-700')}`}
       >
         {totalPages}
       </button>
     </>
   )}
   
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

{/* Bouton de retour en haut */}
<button
onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
className={`fixed bottom-8 right-8 p-3 rounded-full shadow-lg ${getThemeClass('bg-blue-600 text-white hover:bg-blue-700', 'bg-blue-600 text-white hover:bg-blue-700')}`}
aria-label="Retour en haut"
>
<ArrowUp className="w-5 h-5" />
</button>

{/* Section d'aide et ressources */}
<div className={`mt-12 p-6 rounded-xl ${getThemeClass('bg-blue-50', 'bg-blue-900/20')}`}>
<h2 className={`text-xl font-bold mb-4 ${getThemeClass('text-gray-900', 'text-white')}`}>
 Besoin d'aide pour explorer le dictionnaire ?
</h2>
<div className="grid md:grid-cols-2 gap-6">
 <div>
   <p className={`mb-4 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
     Notre dictionnaire contient plus de 3000 mots et expressions en wolof avec leurs traductions et explications détaillées. Voici quelques conseils pour vous aider à explorer efficacement :
   </p>
   <ul className={`list-disc pl-6 space-y-2 ${getThemeClass('text-gray-700', 'text-gray-300')}`}>
     <li>Utilisez la recherche pour trouver des mots spécifiques</li>
     <li>Filtrez par catégorie pour explorer des thèmes précis</li>
     <li>Cliquez sur une lettre pour voir tous les mots commençant par cette lettre</li>
     <li>Ajoutez des mots à vos favoris pour y accéder rapidement</li>
   </ul>
 </div>
 <div>
   <h3 className={`font-medium mb-3 ${getThemeClass('text-gray-800', 'text-gray-200')}`}>
     Ressources complémentaires
   </h3>
   <div className="space-y-3">
     <a href="/pronunciation" className={`flex items-center ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}>
       <Volume2 className="w-5 h-5 mr-2" />
       Guide de prononciation wolof
     </a>
     <a href="/grammar" className={`flex items-center ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}>
       <BookOpen className="w-5 h-5 mr-2" />
       Grammaire et syntaxe wolof
     </a>
     <a href="/community" className={`flex items-center ${getThemeClass('text-blue-600 hover:text-blue-800', 'text-blue-400 hover:text-blue-300')}`}>
       <Share2 className="w-5 h-5 mr-2" />
       Contribuer au dictionnaire
     </a>
   </div>
 </div>
</div>
</div>
</div>
);
};

export default DictionaryExplorer;