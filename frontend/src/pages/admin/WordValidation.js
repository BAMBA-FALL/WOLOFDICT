import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const WordValidation = () => {
  const [pendingWords, setPendingWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    contributor: '',
    sortBy: 'submittedAt',
    sortOrder: 'desc'
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchPendingWords();
  }, [filters]);

  const fetchPendingWords = async () => {
    try {
      // Simulation de récupération des mots en attente de validation
      // Dans un vrai projet, utilisez un appel API avec les filtres
      const mockPendingWords = [
        {
          id: 1,
          wolof: 'Xamm',
          français: 'Comprendre',
          partOfSpeech: 'Verbe',
          definition: 'Percevoir et interpréter un sens, une signification.',
          pronunciation: '/xamm/',
          etymology: 'Terme traditionnel wolof',
          contributor: 'Utilisateur123',
          submittedAt: '2024-04-20T14:30:00Z',
          examples: [
            {
              wolof: 'Dama xamm wolof bi.',
              français: 'Je comprends le wolof.'
            }
          ]
        },
        {
          id: 2,
          wolof: 'Terangal',
          français: 'Être hospitalier',
          partOfSpeech: 'Verbe',
          definition: 'Accueillir quelqu\'un avec générosité et chaleur.',
          pronunciation: '/teʁangal/',
          etymology: 'Dérivé de "Teranga"',
          contributor: 'Linguiste456',
          submittedAt: '2024-04-21T09:15:00Z',
          examples: [
            {
              wolof: 'Dafa terangal ci dërëm bi.',
              français: 'Il est hospitalier dans son village.'
            }
          ]
        }
      ];

      setPendingWords(mockPendingWords);
      setLoading(false);
    } catch (err) {
      setError('Impossible de charger les mots en attente de validation');
      setLoading(false);
    }
  };

  const handleValidation = async (wordId, status) => {
    try {
      // Simulation de validation/rejet
      // Dans un vrai projet, appelez votre API de validation
      setPendingWords(prevWords => 
        prevWords.filter(word => word.id !== wordId)
      );

      // Notification de validation/rejet
      alert(`Le mot a été ${status === 'validé' ? 'validé' : 'rejeté'}`);
    } catch (err) {
      setError('Impossible de traiter la validation');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) return <div>Chargement des mots en attente...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="word-validation-page">
      <h1>Validation des mots</h1>

      <div className="validation-filters">
        <input 
          type="text"
          name="search"
          placeholder="Rechercher un mot"
          value={filters.search}
          onChange={handleFilterChange}
        />

        <input 
          type="text"
          name="contributor"
          placeholder="Filtrer par contributeur"
          value={filters.contributor}
          onChange={handleFilterChange}
        />
      </div>

      {pendingWords.length === 0 ? (
        <div className="no-pending-words">
          <p>Aucun mot en attente de validation</p>
        </div>
      ) : (
        <div className="pending-words-list">
          {pendingWords.map(word => (
            <div key={word.id} className="pending-word-card">
              <div className="word-header">
                <h2>{word.wolof}</h2>
                <span className="word-type">{word.partOfSpeech}</span>
              </div>

              <div className="word-details">
                <div className="word-translation">
                  <strong>Traduction :</strong> {word.français}
                </div>

                <div className="word-pronunciation">
                  <strong>Prononciation :</strong> {word.pronunciation}
                </div>

                <div className="word-definition">
                  <strong>Définition :</strong> {word.definition}
                </div>

                {word.etymology && (
                  <div className="word-etymology">
                    <strong>Étymologie :</strong> {word.etymology}
                  </div>
                )}

                {word.examples && word.examples.length > 0 && (
                  <div className="word-examples">
                    <strong>Exemples :</strong>
                    <ul>
                      {word.examples.map((example, index) => (
                        <li key={index}>
                          <span className="example-wolof">{example.wolof}</span>
                          <span className="example-français">{example.français}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="word-metadata">
                  <div className="word-contributor">
                    <strong>Contributeur :</strong> {word.contributor}
                  </div>
                  <div className="word-submitted-date">
                    <strong>Soumis le :</strong> {new Date(word.submittedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="word-validation-actions">
                <Link 
                  to={`/admin/edit-word/${word.id}`} 
                  className="edit-button"
                >
                  Éditer
                </Link>
                
                <button 
                  className="validate-button"
                  onClick={() => handleValidation(word.id, 'validé')}
                >
                  Valider
                </button>
                
                <button 
                  className="reject-button"
                  onClick={() => handleValidation(word.id, 'rejeté')}
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="validation-guidelines">
        <h3>Lignes directrices pour la validation</h3>
        <ul>
          <li>Vérifiez l'exactitude de la traduction</li>
          <li>Assurez-vous que la définition est claire et précise</li>
          <li>Validez la prononciation et l'étymologie</li>
          <li>Examinez les exemples d'utilisation</li>
          <li>En cas de doute, contactez un expert linguistique</li>
        </ul>
      </div>
    </div>
  );
};

export default WordValidation;