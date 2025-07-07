import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, 
  Home, 
  Search, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-16">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.5,
          type: "spring",
          stiffness: 120
        }}
        className="max-w-xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center"
      >
        <div className="relative">
          <AlertTriangle 
            className="mx-auto text-yellow-500 mb-6" 
            size={80} 
            strokeWidth={1.5} 
          />
          <div 
            className="absolute inset-0 bg-yellow-500/20 rounded-full blur-2xl animate-pulse" 
            style={{ 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)', 
              width: '150px', 
              height: '150px', 
              zIndex: -1 
            }}
          />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          404 - Page Introuvable
        </h1>

        <p className="text-gray-600 mb-6 text-lg">
          Oops ! La page que vous recherchez semble s'être égarée dans le dictionnaire.
          Peut-être a-t-elle été supprimée ou déplacée.
        </p>

        <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
          <Link 
            to="/" 
            className="flex items-center justify-center space-x-2 
            bg-blue-600 text-white px-6 py-3 rounded-full 
            hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Retour à l'accueil</span>
          </Link>

          <Link 
            to="/search" 
            className="flex items-center justify-center space-x-2 
            border border-blue-600 text-blue-600 px-6 py-3 rounded-full 
            hover:bg-blue-50 transition-colors"
          >
            <Search className="w-5 h-5" />
            <span>Rechercher un mot</span>
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500 flex items-center justify-center space-x-2">
          <Compass className="w-4 h-4" />
          <span>
            Besoin d'aide ? 
            <Link 
              to="/help" 
              className="text-blue-600 hover:underline ml-1"
            >
              Contactez-nous
            </Link>
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;