import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Repeat2 } from 'lucide-react';

const AlphabetFilter = ({ 
  onLetterSelect, 
  words = {}, 
  selectedLetter, 
  language = 'wolof' 
}) => {
  const [isReversed, setIsReversed] = useState(false);

  // Alphabet wolof complet avec caractères spéciaux
  const wolofAlphabet = [
    'A', 'Ä', 'B', 'C', 'D', 'E', 'Ë', 'F', 'G', 'H', 'I', 'J', 'K', 
    'L', 'M', 'N', 'Ñ', 'NG', 'O', 'Ö', 'P', 'R', 'S', 'T', 'U', 'W', 'X', 'Y'
  ];
  
  // Alphabet français standard
  const frenchAlphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  // Détermine dynamiquement les lettres disponibles
  const availableLetters = useMemo(() => {
    if (!words || Object.keys(words).length === 0) return [];

    // Sélectionner l'alphabet approprié
    const alphabet = isReversed 
      ? (language === 'wolof' ? frenchAlphabet : wolofAlphabet)
      : (language === 'wolof' ? wolofAlphabet : frenchAlphabet);

    // Extraire les premières lettres des mots
    const lettersInUse = Object.keys(words).map(word => {
      const firstChar = word.charAt(0).toUpperCase();
      
      // Gestion spéciale pour 'NG' en wolof
      if (word.toUpperCase().startsWith('NG')) return 'NG';
      
      return firstChar;
    });

    // Filtrer les lettres disponibles
    return alphabet.filter(letter => 
      lettersInUse.includes(letter)
    ).sort();
  }, [words, language, isReversed]);

  // Toggle de direction de recherche
  const toggleLanguageDirection = () => {
    setIsReversed(!isReversed);
    // Réinitialiser la sélection de lettre lors du changement de direction
    onLetterSelect(null);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-600 flex items-center">
          <Globe className="mr-2 text-blue-600" />
          {isReversed 
            ? `Filtrer de ${language === 'wolof' ? 'Français' : 'Wolof'}` 
            : `Filtrer de ${language === 'wolof' ? 'Wolof' : 'Français'}`
          }
        </h3>
        
        <button 
          onClick={toggleLanguageDirection}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="Inverser la direction de recherche"
        >
          <Repeat2 className="w-5 h-5" />
          <span className="text-sm">Inverser</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Bouton "Tous" */}
        <button
          onClick={() => onLetterSelect(null)}
          className={`
            px-3 py-1 rounded-full text-sm font-medium transition-colors
            ${selectedLetter === null 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
          `}
        >
          Tous
        </button>
        
        {/* Lettres disponibles */}
        {availableLetters.map((letter) => (
          <button
            key={letter}
            onClick={() => onLetterSelect(letter)}
            className={`
              px-3 py-1 rounded-full text-sm font-medium transition-colors
              ${selectedLetter === letter 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            {letter}
          </button>
        ))}
        
        {/* Message si aucune lettre n'est disponible */}
        {availableLetters.length === 0 && (
          <div className="text-sm text-gray-500 italic flex items-center space-x-2">
            <Info className="text-yellow-500" />
            <span>Aucune donnée disponible</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlphabetFilter;