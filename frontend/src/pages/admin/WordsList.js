import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const WordsList = () => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    partOfSpeech: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWords();
  }, [filters, pagination.currentPage]);

  const fetchWords = async () => {
    try {
      // Simulation de récupération des mots
      // Dans un vrai projet, utilisez un appel API avec les filtres
      const mockWords = [
        {
          id: 1,
          wolof: 'Teranga',
          français: 'Hospitalité',
          partOfSpeech: 'Nom',
          status: 'validé',
          createdAt: '2024-04-20T10:30:00Z',
          contributor: 'Admin'
        },
        {
          id: 2,
          wolof: 'Xamm',
          français: 'Comprendre',
          partOfSpeech: 'Verbe',
          status: 'en attente',
          createdAt: '2024-04-21T14:45:00Z',
          contributor: 'Expert Linguistique'
        },
        {
          id: 3,
          wolof: 'Dëgg',
          français: 'Vrai',
          partOfSpeech: 'Adjectif',
          status: 'validé',
          createdAt: '2024-04-22T09:15:00Z',
          contributor: 'Utilisateur'
        }
        // Ajoutez plus de mots ici
      ];

      setWords(mockWords);
      setPagination(prev => ({
        ...prev,
        totalItems: mockWords.length
      }));
      setLoading(false);
    } catch (err) {
      setError('Impossible de charger les mots');
      setLoading(false);
    }
  };

  const handleDelete = async (wordId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce mot ?')) {
      return;
    }

    try {
      // Simulation de suppression 
      // Dans un vrai projet, appelez votre API de suppression
      setWords(prevWords => prevWords.filter(word => word.id !== wordId));
    } catch (err) {
      setError('Impossible de supprimer le mot');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSort = (column) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) return <div>Chargement des mots...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="words-list-page">
      <h1>Gestion des mots</h1>

      <div className="words-list-filters">
        <input 
          type="text"
          name="search"
          placeholder="Rechercher un mot"
          value={filters.search}
          onChange={handleFilterChange}
        />

        <select 
          name="partOfSpeech"
          value={filters.partOfSpeech}
          onChange={handleFilterChange}
        >
          <option value="">Toutes les classes grammaticales</option>
          <option value="Nom">Nom</option>
          <option value="Verbe">Verbe</option>
          <option value="Adjectif">Adjectif</option>
          <option value="Adverbe">Adverbe</option>
        </select>

        <Link 
          to="/admin/add-word" 
          className="add-word-button"
        >
          Ajouter un nouveau mot
        </Link>
      </div>

      <table className="words-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('wolof')}>
              Mot Wolof 
              {filters.sortBy === 'wolof' && (
                <span>{filters.sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => handleSort('français')}>
              Traduction Française
              {filters.sortBy === 'français' && (
                <span>{filters.sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => handleSort('partOfSpeech')}>
              Classe Grammaticale
              {filters.sortBy === 'partOfSpeech' && (
                <span>{filters.sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => handleSort('status')}>
              Statut
              {filters.sortBy === 'status' && (
                <span>{filters.sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th onClick={() => handleSort('createdAt')}>
              Date de création
              {filters.sortBy === 'createdAt' && (
                <span>{filters.sortOrder === 'asc' ? ' ▲' : ' ▼'}</span>
              )}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {words.map(word => (
            <tr key={word.id}>
              <td>{word.wolof}</td>
              <td>{word.français}</td>
              <td>{word.partOfSpeech}</td>
              <td>{word.status}</td>
              <td>{new Date(word.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="word-actions">
                  <Link 
                    to={`/admin/edit-word/${word.id}`} 
                    className="edit-button"
                  >
                    Modifier
                  </Link>
                  <button 
                    onClick={() => handleDelete(word.id)}
                    className="delete-button"
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button 
          disabled={pagination.currentPage === 1}
          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
        >
          Précédent
        </button>
        <span>
          Page {pagination.currentPage} sur {Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
        </span>
        <button 
          disabled={pagination.currentPage >= Math.ceil(pagination.totalItems / pagination.itemsPerPage)}
          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default WordsList;