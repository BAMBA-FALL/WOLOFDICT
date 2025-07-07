import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Edit, 
  Trash2, 
  Share2, 
  Copy, 
  Mic, 
  Info, 
  List, 
  Globe, 
  Clock, 
  Users 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WordDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [word, setWord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('definition');

  useEffect(() => {
    const fetchWordDetails = async () => {
      try {
        const mockWord = {
          id: id,
          wolof: 'Teranga',
          français: 'Hospitalité',
          pronunciation: '/teʁanga/',
          partOfSpeech: 'Nom',
          definition: 'Concept culturel sénégalais désignant l\'accueil chaleureux et la générosité.',
          etymology: 'Terme originaire de la langue wolof, langue nationale du Sénégal.',
          examples: [
            {
              wolof: 'Teranga la Senegaal.',
              français: 'Le Sénégal est connu pour son hospitalité.',
            },
            {
              wolof: 'Dama khéw teranga bi.',
              français: 'J\'apprécie l\'hospitalité.',
            }
          ],
          synonyms: [
            { wolof: 'Làmmiñ', français: 'Accueil' },
            { wolof: 'Dièm', français: 'Gentillesse' }
          ],
          conjugations: null,
          contributors: [
            { id: 1, username: 'Admin' },
            { id: 2, username: 'Expert Linguistique' }
          ],
          createdAt: '2024-04-23T10:30:00Z',
          updatedAt: '2024-04-23T14:45:00Z'
        };

        setWord(mockWord);
        setLoading(false);
      } catch (err) {
        setError('Impossible de charger les détails du mot');
        setLoading(false);
      }
    };

    fetchWordDetails();
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Texte copié !');
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'definition':
        return (
          <motion.div 
            key="definition"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-blue-50 p-6 rounded-2xl"
          >
            <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
              <Info className="mr-3 text-blue-600" />
              Définition
            </h3>
            <p className="text-gray-700">{word.definition}</p>
          </motion.div>
        );
      case 'examples':
        return (
          <motion.div 
            key="examples"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-green-50 p-6 rounded-2xl"
          >
            <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
              <List className="mr-3 text-green-600" />
              Exemples d'utilisation
            </h3>
            <ul className="space-y-4">
              {word.examples.map((example, index) => (
                <li key={index} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium text-wolof">{example.wolof}</p>
                      <p className="text-gray-600">{example.français}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(example.wolof)}
                      className="text-gray-500 hover:text-blue-600"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        );
      case 'etymology':
        return (
          <motion.div 
            key="etymology"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-purple-50 p-6 rounded-2xl"
          >
            <h3 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
              <Globe className="mr-3 text-purple-600" />
              Étymologie
            </h3>
            <p className="text-gray-700">{word.etymology}</p>
          </motion.div>
        );
      case 'synonyms':
        return (
          <motion.div 
            key="synonyms"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="bg-yellow-50 p-6 rounded-2xl"
          >
            <h3 className="text-xl font-semibold text-yellow-800 mb-4 flex items-center">
              <Book className="mr-3 text-yellow-600" />
              Synonymes
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {word.synonyms.map((synonym, index) => (
                <div 
                  key={index} 
                  className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-wolof">{synonym.wolof}</p>
                    <p className="text-gray-600">{synonym.français}</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(synonym.wolof)}
                    className="text-gray-500 hover:text-blue-600"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          repeat: Infinity, 
          duration: 1, 
          ease: "linear" 
        }}
      >
        <Book className="w-12 h-12 text-blue-600" />
      </motion.div>
    </div>
  );

  if (error) return <div className="text-red-500 text-center">{error}</div>;
  if (!word) return <div className="text-gray-500 text-center">Mot non trouvé</div>;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      {/* En-tête du mot */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <motion.h1 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-bold text-blue-800 mb-2"
          >
            {word.wolof}
          </motion.h1>
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-gray-600 mb-4"
          >
            {word.français} • {word.pronunciation}
          </motion.div>
        </div>

        {/* Actions administratives */}
        {(user?.role === 'admin' || user?.role === 'expert') && (
          <div className="flex space-x-4">
            <Link 
              to={`/admin/edit-word/${id}`} 
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              <span>Modifier</span>
            </Link>
            {user?.role === 'admin' && (
              <button 
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Supprimer</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sections à onglets */}
      <div className="mb-8">
        <div className="flex space-x-4 mb-6 border-b pb-2">
          {[
            { key: 'definition', label: 'Définition', icon: Info },
            { key: 'examples', label: 'Exemples', icon: List },
            { key: 'etymology', label: 'Étymologie', icon: Globe },
            { key: 'synonyms', label: 'Synonymes', icon: Book }
          ].map(section => (
            <button
              key={section.key}
              onClick={() => setActiveSection(section.key)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-full transition-colors
                ${activeSection === section.key 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-blue-50'}
              `}
            >
              <section.icon className="w-5 h-5" />
              <span>{section.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {renderSection()}
        </AnimatePresence>
      </div>

      {/* Métadonnées et contributeurs */}
      <div className="bg-gray-50 p-6 rounded-2xl flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
            <Users className="mr-3 text-gray-600" />
            Contributeurs
          </h3>
          <ul className="flex space-x-2">
            {word.contributors.map(contributor => (
              <li 
                key={contributor.id} 
                className="bg-white px-3 py-1 rounded-full text-sm text-gray-700"
              >
                {contributor.username}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm">
              Créé le : {new Date(word.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="w-5 h-5" />
            <span className="text-sm">
              Dernière mise à jour : {new Date(word.updatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Section de feedback utilisateur */}
      {user && (
        <div className="mt-8 bg-blue-100 p-6 rounded-2xl text-center">
          <h3 className="text-2xl font-semibold text-blue-800 mb-4">
            Vous avez une suggestion ?
          </h3>
          <Link 
            to={`/admin/suggest-edit/${id}`} 
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center space-x-3 mx-auto max-w-md"
          >
            <Share2 className="w-6 h-6" />
            <span>Suggérer une modification</span>
          </Link>
        </div>
      )}
    </motion.div>
  );
};

export default WordDetailsPage;