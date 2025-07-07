// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserProfile } from '../services/apiServices/userService';
import { login, logout, refreshToken } from '../services/apiServices/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      try {
        const userData = await getUserProfile();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        // Essayer de rafraîchir le token
        try {
          await refreshToken();
          const userData = await getUserProfile();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (refreshError) {
          // Si le rafraîchissement échoue, déconnecter l'utilisateur
          localStorage.removeItem('token');
          setError('Votre session a expiré. Veuillez vous reconnecter.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Fonction de connexion
  const loginUser = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await login(email, password);
      localStorage.setItem('token', response.token);
      
      setUser(response.user);
      setIsAuthenticated(true);
      
      return response.user;
    } catch (error) {
      setError(error.response?.data?.error || 'Échec de la connexion');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logoutUser = async () => {
    try {
      setIsLoading(true);
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Mettre à jour le profil utilisateur
  const updateUserProfile = (updatedData) => {
    setUser(prev => ({
      ...prev,
      ...updatedData
    }));
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    error,
    login: loginUser,
    logout: logoutUser,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};