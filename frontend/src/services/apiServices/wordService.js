// src/services/api/wordService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const getWords = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/words`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWordById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/words/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getWordsByLetter = async (letter) => {
  try {
    const response = await axios.get(`${API_URL}/words/letter/${letter}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createWord = async (wordData) => {
  try {
    const response = await axios.post(`${API_URL}/words`, wordData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateWord = async (id, wordData) => {
  try {
    const response = await axios.put(`${API_URL}/words/${id}`, wordData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const validateWord = async (id, validationData) => {
  try {
    const response = await axios.put(`${API_URL}/words/${id}/validate`, validationData, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteWord = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/words/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPendingWords = async () => {
  try {
    const response = await axios.get(`${API_URL}/words/pending`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};