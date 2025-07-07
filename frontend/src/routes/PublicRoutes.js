import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layouts/MainLayout';

// Public pages
import HomePage from '../pages/public/HomePage';
import WordDetailsPage from '../pages/public/WordDetailsPage';
import SearchResultsPage from '../pages/public/SearchResultsPage';
import AlphabetPage from '../pages/public/AlphabetPage';
import DictionaryExplorer from '../pages/public/DictionarExplorer';
import PhrasesPage from '../pages/public/PhrasesPage';
import CommunityPage from '../pages/public/CommunityPage';
import NotFoundPage from './NotFoundPage';

const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="words/:id" element={<WordDetailsPage />} />
        <Route path="dictionary/:id" element={<WordDetailsPage />} /> {/* Route additionnelle */}
        <Route path="search" element={<SearchResultsPage />} />
        <Route path="alphabet/:letter" element={<AlphabetPage />} />
        <Route path="dictionary" element={<DictionaryExplorer />} />
        <Route path="phrases" element={<PhrasesPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="*" element={<NotFoundPage />} />       
      </Route>
    </Routes>
  );
};

export default PublicRoutes;