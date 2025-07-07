// src/hooks/useWordManagement.js
import { useState, useEffect } from 'react';
import { 
  getWords, 
  getWordById, 
  createWord, 
  updateWord, 
  deleteWord, 
  validateWord 
} from '../services/api/wordService';

export const useWordManagement = () => {
  const [words, setWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });
  
  // Fetch words list with filters
  const fetchWords = async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getWords(params);
      setWords(response.words);
      setPagination({
        total: response.total,
        pages: response.pages,
        currentPage: response.currentPage
      });
      return response;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch words');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch a single word by ID
  const fetchWordById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const word = await getWordById(id);
      setSelectedWord(word);
      return word;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch word');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Add a new word
  const addWord = async (wordData) => {
    try {
      setLoading(true);
      setError(null);
      const newWord = await createWord(wordData);
      setWords(prevWords => [...prevWords, newWord]);
      return newWord;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add word');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Update an existing word
  const editWord = async (id, wordData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedWord = await updateWord(id, wordData);
      setWords(prevWords => 
        prevWords.map(word => 
          word.id === id ? updatedWord : word
        )
      );
      if (selectedWord && selectedWord.id === id) {
        setSelectedWord(updatedWord);
      }
      return updatedWord;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update word');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Validate or reject a word
  const validateWordStatus = async (id, status, comment = '') => {
    try {
      setLoading(true);
      setError(null);
      await validateWord(id, { status, comment });
      
      // Update local state
      setWords(prevWords => 
        prevWords.map(word => 
          word.id === id ? { ...word, validationStatus: status } : word
        )
      );
      
      if (selectedWord && selectedWord.id === id) {
        setSelectedWord(prev => ({ ...prev, validationStatus: status }));
      }
      
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to validate word');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Remove a word
  const removeWord = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await deleteWord(id);
      setWords(prevWords => prevWords.filter(word => word.id !== id));
      if (selectedWord && selectedWord.id === id) {
        setSelectedWord(null);
      }
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete word');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    words,
    selectedWord,
    loading,
    error,
    pagination,
    fetchWords,
    fetchWordById,
    addWord,
    editWord,
    validateWordStatus,
    removeWord
  };
};