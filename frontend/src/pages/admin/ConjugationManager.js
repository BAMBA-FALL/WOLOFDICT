import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ConjugationManager = () => {
  const { wordId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États pour la gestion des conjugaisons
  const [wordDetails, setWordDetails] = useState(null);
  const [conjugations, setConjugations] = useState({
    presentTense: [],
    pastTense: [],
    futureTense: []
  });
  const [currentTense, setCurrentTense] = useState('presentTense');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les détails du mot et ses conjugaisons existantes
  useEffect(() => {
    fetchWordConjugations();
  }, [wordId]);

  const fetchWordConjugations = async () => {
    try {
      // Simulation de récupération des conjugaisons
      // Dans un vrai projet, appelez votre API pour récupérer les détails
      const mockWordDetails = {
        id: wordId,
        wolof: 'Xamm',
        français: 'Comprendre',
        partOfSpeech: 'Verbe'
      };

      const mockConjugations = {
        presentTense: [
          { pronoun: 'Maa', conjugation: 'Dama xamm' },
          { pronoun: 'Yaa', conjugation: 'Danga xamm' },
          { pronoun: 'Mu', conjugation: 'Dafa xamm' },
          { pronoun: 'Un', conjugation: 'Dañu xamm' },
          { pronoun: 'Ñi', conjugation: 'Dañu xamm' }
        ],
        pastTense: [
          { pronoun: 'Maa', conjugation: 'Xamma' },
          { pronoun: 'Yaa', conjugation: 'Xammoo' },
          { pronoun: 'Mu', conjugation: 'Xammu' },
          { pronoun: 'Un', conjugation: 'Xammu nañu' },
          { pronoun: 'Ñi', conjugation: 'Xammu nañu' }
        ],
        futureTense: [
          { pronoun: 'Maa', conjugation: 'Dama xamm di' },
          { pronoun: 'Yaa', conjugation: 'Danga xamm di' },
          { pronoun: 'Mu', conjugation: 'Dafa xamm di' },
          { pronoun: 'Un', conjugation: 'Dañu xamm di' },
          { pronoun: 'Ñi', conjugation: 'Dañu xamm di' }
        ]
      };

      setWordDetails(mockWordDetails);
      setConjugations(mockConjugations);
      setIsLoading(false);
    } catch (err) {
      setError('Impossible de charger les conjugaisons');
      setIsLoading(false);
    }
  };

  const handleConjugationChange = (index, field, value) => {
    const newConjugations = { ...conjugations };
    newConjugations[currentTense][index][field] = value;
    setConjugations(newConjugations);
  };

  const addConjugation = () => {
    const newConjugations = { ...conjugations };
    newConjugations[currentTense].push({ pronoun: '', conjugation: '' });
    setConjugations(newConjugations);
  };

  const removeConjugation = (index) => {
    const newConjugations = { ...conjugations };
    newConjugations[currentTense].splice(index, 1);
    setConjugations(newConjugations);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulation de sauvegarde des conjugaisons
      // Dans un vrai projet, appelez votre API de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      navigate(`/admin/words`);
    } catch (err) {
      setError('Impossible de sauvegarder les conjugaisons');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>{error}</div>;
  if (!wordDetails) return <div>Mot non trouvé</div>;

  return (
    <div className="conjugation-manager">
      <h1>Conjugaisons pour {wordDetails.wolof}</h1>
      <p>Traduction : {wordDetails.français} ({wordDetails.partOfSpeech})</p>

      <div className="tense-selector">
        <button 
          onClick={() => setCurrentTense('presentTense')}
          className={currentTense === 'presentTense' ? 'active' : ''}
        >
          Présent
        </button>
        <button 
          onClick={() => setCurrentTense('pastTense')}
          className={currentTense === 'pastTense' ? 'active' : ''}
        >
          Passé
        </button>
        <button 
          onClick={() => setCurrentTense('futureTense')}
          className={currentTense === 'futureTense' ? 'active' : ''}
        >
          Futur
        </button>
      </div>

      <form onSubmit={handleSubmit} className="conjugation-form">
        <div className="conjugation-inputs">
          {conjugations[currentTense].map((item, index) => (
            <div key={index} className="conjugation-row">
              <input 
                type="text"
                placeholder="Pronom"
                value={item.pronoun}
                onChange={(e) => handleConjugationChange(index, 'pronoun', e.target.value)}
                required
              />
              <input 
                type="text"
                placeholder="Conjugaison"
                value={item.conjugation}
                onChange={(e) => handleConjugationChange(index, 'conjugation', e.target.value)}
                required
              />
              {index > 0 && (
                <button 
                  type="button"
                  onClick={() => removeConjugation(index)}
                  className="remove-conjugation-button"
                >
                  Supprimer
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="conjugation-actions">
          <button 
            type="button"
            onClick={addConjugation}
            className="add-conjugation-button"
          >
            Ajouter une conjugaison
          </button>

          <button 
            type="submit"
            disabled={isLoading}
            className="save-conjugations-button"
          >
            {isLoading ? 'Sauvegarde en cours...' : 'Sauvegarder les conjugaisons'}
          </button>
        </div>
      </form>

      <div className="conjugation-help">
        <h3>Conseils pour la conjugaison</h3>
        <ul>
          <li>Soyez précis dans les formes de conjugaison</li>
          <li>Incluez les différentes variantes pronominales</li>
          <li>Vérifiez l'orthographe et la grammaire</li>
          <li>Consultez des sources linguistiques si nécessaire</li>
        </ul>
      </div>
    </div>
  );
};

export default ConjugationManager;