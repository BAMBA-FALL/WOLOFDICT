import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  Tag, 
  ChevronDown, 
  CheckCircle 
} from 'lucide-react';

// Dictionnaire simulé de mots wolof avec synonymes
const WOLOF_DICTIONARY = {
  'dem': { 
    synonyms: ['aller', 'partir'], 
    translations: ['go', 'leave']
  },
  'dox': { 
    synonyms: ['rester', 'demeurer'], 
    translations: ['stay', 'remain']
  },
  'xam': { 
    synonyms: ['savoir', 'connaître'], 
    translations: ['know', 'understand']
  }
};

const WolofAdvancedSelect = ({ 
  onWordSelect,
  placeholder = "Entrez un mot wolof"
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const containerRef = useRef(null);

  // Gestion des clics en dehors du composant
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Recherche de suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedWord(null);

    // Recherche de correspondances
    if (value.length > 1) {
      const matchedWords = Object.keys(WOLOF_DICTIONARY)
        .filter(word => 
          word.toLowerCase().includes(value.toLowerCase()) ||
          WOLOF_DICTIONARY[word].synonyms.some(syn => 
            syn.toLowerCase().includes(value.toLowerCase())
          )
        );
      setSuggestions(matchedWords);
      setIsDropdownOpen(matchedWords.length > 0);
    } else {
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
  };

  // Sélection d'un mot
  const handleWordSelect = (word) => {
    setSelectedWord(word);
    setInputValue(word);
    setSuggestions([]);
    setIsDropdownOpen(false);
  };

  // Confirmation et envoi du mot
  const handleConfirmWord = () => {
    if (selectedWord) {
      const wordData = WOLOF_DICTIONARY[selectedWord];
      onWordSelect({
        word: selectedWord,
        synonyms: wordData.synonyms,
        translations: wordData.translations
      });
      
      // Réinitialisation
      setInputValue('');
      setSelectedWord(null);
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          placeholder={placeholder}
          className="
            w-full p-2 pl-10 pr-10 border rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-blue-500
          "
        />
        
        {/* Icône de recherche */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        {/* Bouton de clear */}
        {inputValue && (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              setSelectedWord(null);
              setSuggestions([]);
              setIsDropdownOpen(false);
            }}
            className="absolute inset-y-0 right-10 flex items-center pr-3"
          >
            <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}

        {/* Bouton de confirmation */}
        {selectedWord && (
          <button
            type="button"
            onClick={handleConfirmWord}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
          >
            <CheckCircle className="h-6 w-6 text-green-500 hover:text-green-600" />
          </button>
        )}
      </div>

      {/* Liste de suggestions */}
      {isDropdownOpen && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((word) => {
            const wordData = WOLOF_DICTIONARY[word];
            return (
              <div 
                key={word}
                onClick={() => handleWordSelect(word)}
                className="
                  p-2 hover:bg-gray-100 cursor-pointer 
                  flex justify-between items-center
                "
              >
                <div>
                  <div className="font-semibold text-blue-600">{word}</div>
                  {wordData.synonyms && (
                    <div className="text-xs text-gray-500 mt-1">
                      Synonymes : {wordData.synonyms.join(', ')}
                    </div>
                  )}
                </div>
                <Plus className="h-5 w-5 text-green-500" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WolofAdvancedSelect;