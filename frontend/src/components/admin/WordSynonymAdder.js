import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Tag, Edit, Check, AlertCircle, Trash, Book } from 'lucide-react';

// Animations réutilisables
const slideIn = "animate-[slideIn_0.2s_ease-out]";
const fadeIn = "animate-[fadeIn_0.3s_ease-out]";

// Composant de pastille pour mot
const WordBadge = ({ word, onRemove, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedWord, setEditedWord] = useState(word);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEditSave = () => {
    if (editedWord.trim()) {
      onEdit(word, editedWord.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      setEditedWord(word);
      setIsEditing(false);
    }
  };

  return (
    <div className={`group rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 px-3 py-2 text-sm flex items-center space-x-2 ${fadeIn} hover:shadow-sm transition-all duration-200`}>
      {isEditing ? (
        <>
          <input
            ref={inputRef}
            type="text"
            value={editedWord}
            onChange={(e) => setEditedWord(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-white border-none rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none w-full"
          />
          <div className="flex space-x-1">
            <button
              onClick={handleEditSave}
              className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-white transition-colors"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => {
                setEditedWord(word);
                setIsEditing(false);
              }}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </>
      ) : (
        <>
          <Tag className="w-4 h-4 text-blue-500" />
          <span className="flex-grow">{word}</span>
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-white transition-colors"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onRemove(word)}
              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const WordSynonymAdder = ({
  label,
  placeholder,
  onWordsAdded,
  language,
  initialWords = [],
  maxWords = 10
}) => {
  const [inputWord, setInputWord] = useState('');
  const [words, setWords] = useState(initialWords);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Quelques suggestions factices basées sur la langue
  const demoSuggestions = {
    wolof: ['dem', 'ñëw', 'lekk', 'naan', 'nelaw', 'xam', 'wax', 'def'],
    français: ['aller', 'venir', 'manger', 'boire', 'dormir', 'savoir', 'parler', 'faire']
  };

  useEffect(() => {
    // Gestionnaire pour les clics en dehors du composant
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Filtrer les suggestions en fonction de l'input
    if (inputWord.trim().length > 1) {
      const languageSuggestions = language === 'wolof' ? demoSuggestions.wolof : demoSuggestions.français;
      const filtered = languageSuggestions
        .filter(word => word.toLowerCase().includes(inputWord.toLowerCase()))
        .filter(word => !words.includes(word));
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [inputWord, words, language]);

  const handleAddWord = () => {
    const trimmedWord = inputWord.trim();
    
    if (!trimmedWord) {
      setError('Veuillez entrer un mot');
      return;
    }
    
    if (words.includes(trimmedWord)) {
      setError('Ce mot existe déjà dans la liste');
      return;
    }
    
    if (words.length >= maxWords) {
      setError(`Vous ne pouvez pas ajouter plus de ${maxWords} mots`);
      return;
    }
    
    const newWords = [...words, trimmedWord];
    setWords(newWords);
    setInputWord('');
    setError('');
    onWordsAdded(newWords);
    inputRef.current.focus();
  };

  const handleRemoveWord = (wordToRemove) => {
    const newWords = words.filter(word => word !== wordToRemove);
    setWords(newWords);
    onWordsAdded(newWords);
  };

  const handleEditWord = (oldWord, newWord) => {
    if (words.includes(newWord) && oldWord !== newWord) {
      setError('Ce mot existe déjà dans la liste');
      return;
    }
    
    const newWords = words.map(word => word === oldWord ? newWord : word);
    setWords(newWords);
    onWordsAdded(newWords);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddWord();
    }
  };

  const clearAll = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous les mots ?')) {
      setWords([]);
      onWordsAdded([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    if (!words.includes(suggestion)) {
      const newWords = [...words, suggestion];
      setWords(newWords);
      onWordsAdded(newWords);
      setInputWord('');
      setSuggestions([]);
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {words.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500">
              {words.length} / {maxWords} mots
            </span>
            <button
              onClick={clearAll}
              className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors flex items-center"
            >
              <Trash size={14} className="mr-1" />
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* Input et bouton d'ajout */}
      <div className="relative">
        <div className="flex">
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={inputWord}
              onChange={(e) => {
                setInputWord(e.target.value);
                setError('');
              }}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholder}
              className={`w-full p-3 pl-4 pr-10 border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-l-lg focus:outline-none focus:ring-2 bg-white`}
              onKeyDown={handleKeyDown}
            />
            {inputWord && (
              <button
                onClick={() => {
                  setInputWord('');
                  setError('');
                  inputRef.current.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleAddWord}
            className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestions */}
        {isFocused && suggestions.length > 0 && (
          <div className={`absolute z-10 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg ${slideIn}`}>
            <div className="p-2 border-b border-gray-100 text-xs text-gray-500 flex items-center">
              <Book size={12} className="mr-1" />
              Suggestions
            </div>
            <div className="max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex justify-between items-center"
                >
                  <span>{suggestion}</span>
                  <Plus size={14} className="text-blue-600" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <AlertCircle size={14} className="mr-1" />
          {error}
        </div>
      )}

      {/* Liste des mots ajoutés */}
      {words.length > 0 ? (
        <div className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {words.map((word, index) => (
              <WordBadge
                key={index}
                word={word}
                onRemove={handleRemoveWord}
                onEdit={handleEditWord}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 bg-gray-50 rounded-lg p-4 text-center text-gray-500 text-sm">
          Aucun mot ajouté. Utilisez le champ ci-dessus pour ajouter des mots.
        </div>
      )}
    </div>
  );
};

export default WordSynonymAdder;