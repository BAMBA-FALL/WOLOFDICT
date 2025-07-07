import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Plus, Check } from 'lucide-react';

const SynonymsSelector = ({ 
  synonyms, 
  onChange, 
  placeholder = "Ajouter des synonymes" 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Gestion des clics en dehors du composant
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Ajouter un synonyme
  const handleAddSynonym = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !synonyms.includes(trimmedValue)) {
      onChange([...synonyms, trimmedValue]);
      setInputValue('');
      setHighlightedIndex(-1);
    }
  };

  // Supprimer un synonyme
  const handleRemoveSynonym = (synonymToRemove) => {
    onChange(synonyms.filter(synonym => synonym !== synonymToRemove));
  };

  // Gestion des touches du clavier
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddSynonym();
    } else if (e.key === 'Backspace' && inputValue === '' && synonyms.length > 0) {
      // Supprimer le dernier synonyme si l'input est vide
      onChange(synonyms.slice(0, -1));
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div 
        className={`
          flex flex-wrap gap-2 w-full min-h-[42px] border rounded-lg p-2 
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
        `}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        {/* Synonymes sélectionnés */}
        {synonyms.map((synonym, index) => (
          <div 
            key={index} 
            className="
              flex items-center bg-blue-100 text-blue-800 
              rounded px-2 py-1 text-sm space-x-1
            "
          >
            <span>{synonym}</span>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveSynonym(synonym);
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Champ de saisie */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={synonyms.length === 0 ? placeholder : ''}
          className="flex-grow outline-none bg-transparent min-w-[100px]"
        />
      </div>

      {/* Bouton d'ajout */}
      {inputValue.trim() && (
        <button
          type="button"
          onClick={handleAddSynonym}
          className="
            absolute right-2 top-1/2 -translate-y-1/2 
            bg-blue-500 text-white rounded-full p-1 
            hover:bg-blue-600 transition
          "
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SynonymsSelector;