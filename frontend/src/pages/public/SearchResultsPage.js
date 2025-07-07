import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  BookOpen, 
  Mic, 
  Filter, 
  ArrowRight, 
  RefreshCw,
  AlertTriangle,
  Plus 
} from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';

const SearchResultsPage = () => {
  const location = useLocation();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState('wolof'); // 'wolof' ou 'français'
  const [filters, setFilters] = useState({
    partOfSpeech: '',
    minLength: 0
  });

  // Extraire le terme de recherche des paramètres de l'URL
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get('q') || '';

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        // Dans un vrai projet, cette requête serait faite à votre backend
        // Simulation de résultats de recherche
        const mockResults = [
          {
            id: 1,
            wolof: 'Teranga',
            français: 'Hospitalité',
            pronunciation: '/teʁanga/',
            partOfSpeech: 'Nom',
            description: 'Concept culturel sénégalais désignant l\'accueil chaleureux et la générosité.'
          },
          {
            id: 2,
            wolof: 'Terangal',
            français: 'Être hospitalier',
            pronunciation: '/teʁangal/',
            partOfSpeech: 'Verbe',
            description: 'Action de manifester une hospitalité chaleureuse.'
          },
          {
            id: 3,
            wolof: 'Téere Teranga',
            français: 'Maison d\'hospitalité',
            pronunciation: '/teʁe teʁanga/',
            partOfSpeech: 'Expression',
            description: 'Lieu symbolisant l\'accueil traditionnel wolof.'
          }
        ].filter(word => {
          const matchQuery = language === 'wolof' 
            ? word.wolof.toLowerCase().includes(searchTerm.toLowerCase())
            : word.français.toLowerCase().includes(searchTerm.toLowerCase());
          
          const matchPartOfSpeech = !filters.partOfSpeech || 
            word.partOfSpeech === filters.partOfSpeech;
          
          const matchLength = word.wolof.length >= filters.minLength;
          
          return matchQuery && matchPartOfSpeech && matchLength;
        });

        setSearchResults(mockResults);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors de la recherche');
        setLoading(false);
      }
    };

    if (searchTerm) {
      fetchSearchResults();
    } else {
      setSearchResults([]);
      setLoading(false);
    }
  }, [searchTerm, language, filters]);

  // Animation des résultats
  const resultVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120
      }
    }
  };

  // Réinitialiser la recherche
  const resetSearch = () => {
    setSearchTerm('');
    setFilters({
      partOfSpeech: '',
      minLength: 0
    });
  };

  // Basculer entre wolof et français
  const toggleLanguage = () => {
    setLanguage(language === 'wolof' ? 'français' : 'wolof');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="container mx-auto px-4">
        {/* Barre de recherche */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder={`Rechercher un mot en ${language}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-2">
              <button 
                onClick={toggleLanguage}
                className="text-blue-600 hover:text-blue-800"
                aria-label="Changer de langue"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {searchTerm && (
                <button 
                  onClick={resetSearch}
                  className="text-red-600 hover:text-red-800"
                  aria-label="Réinitialiser la recherche"
                >
                  <Filter className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtres */}
          <div className="mt-4 flex space-x-4 justify-center">
            <select 
              value={filters.partOfSpeech}
              onChange={(e) => setFilters(prev => ({ ...prev, partOfSpeech: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-full"
            >
              <option value="">Toutes les classes</option>
              <option value="Nom">Nom</option>
              <option value="Verbe">Verbe</option>
              <option value="Adjectif">Adjectif</option>
            </select>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Longueur min :</label>
              <input 
                type="number"
                min="0"
                value={filters.minLength}
                onChange={(e) => setFilters(prev => ({ ...prev, minLength: Number(e.target.value) }))}
                className="w-16 px-2 py-1 border border-gray-300 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Résultats de recherche */}
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1, 
                  ease: "linear" 
                }}
              >
                <BookOpen className="w-12 h-12 mx-auto text-blue-600" />
              </motion.div>
              <p className="mt-4 text-gray-600">Recherche en cours...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-700">{error}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-8 rounded-lg shadow-md text-center"
            >
              <Mic className="w-16 h-16 mx-auto text-blue-500 mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Aucun résultat trouvé
              </h2>
              <p className="text-gray-600 mb-6">
                Votre recherche de "{searchTerm}" n'a donné aucun résultat.
              </p>
              <div className="space-y-2 max-w-md mx-auto text-left">
                <p className="flex items-center space-x-2">
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                  <span>Vérifiez l'orthographe</span>
                </p>
                <p className="flex items-center space-x-2">
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                  <span>Essayez des mots-clés différents</span>
                </p>
                <p className="flex items-center space-x-2">
                  <ArrowRight className="w-5 h-5 text-blue-500" />
                  <span>Utilisez des termes plus généraux</span>
                </p>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence>
              {searchResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  variants={resultVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md p-6 mb-4 hover:shadow-xl transition-all"
                >
                  <Link to={`/words/${result.id}`} className="block">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-blue-800">
                          {language === 'wolof' ? result.wolof : result.français}
                        </h2>
                        <p className="text-gray-600">
                          {language === 'wolof' ? result.français : result.wolof}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {result.partOfSpeech}
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-700 mb-4">
                      <p className="italic">{result.description}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">{result.pronunciation}</span>
                      <ArrowRight className="text-blue-600" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Options supplémentaires */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-12"
        >
          <h3 className="text-xl text-gray-700 mb-6">
            Vous ne trouvez pas ce que vous cherchez ?
          </h3>
          <Link 
            to="/admin/add-word" 
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Suggérer un nouveau mot</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default SearchResultsPage;