import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const searchWord = async (word) => {
  try {
    const response = await axios.get(`${API_URL}/translate/${word}`);
    return response.data;
  } catch (error) {
    console.error('Error searching word:', error);
    throw error;
  }
};

export const addWord = async (word, translation) => {
  try {
    const response = await axios.post(`${API_URL}/word`, { word, translation });
    return response.data;
  } catch (error) {
    console.error('Error adding word:', error);
    throw error;
  }
};

export const updateWord = async (word, translation) => {
  try {
    const response = await axios.put(`${API_URL}/word/${word}`, { translation });
    return response.data;
  } catch (error) {
    console.error('Error updating word:', error);
    throw error;
  }
};

export const deleteWord = async (word) => {
  try {
    const response = await axios.delete(`${API_URL}/word/${word}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting word:', error);
    throw error;
  }
};

export const getAllWords = async () => {
  try {
    const response = await axios.get(`${API_URL}/words`);
    return response.data;
  } catch (error) {
    console.error('Error getting all words:', error);
    throw error;
  }
};