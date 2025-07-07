import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const WordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // États pour le formulaire
  const [wordData, setWordData] = useState({
    wolof: '',
    français: '',
    partOfSpeech: '',
    pronunciation: '',
    definition: '',
    etymology: '',
    examples: [{ wolof: '', français: '' }],
    synonyms: [{ wolof: '', français: '' }]
  });

  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Charger les données du mot en mode édition
  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchWordDetails();
    }
  }, [id]);

  const fetchWordDetails = async () => {
    try {
      // Simulation de récupération des détails du mot
      // Dans un vrai projet, appelez votre API pour récupérer les détails
      const mockWordDetails = {
        wolof: 'Teranga',
        français: 'Hospitalité',
        partOfSpeech: 'Nom',
        pronunciation: '/teʁanga/',
        definition: 'Concept culturel sénégalais désignant l\'accueil chaleureux et la générosité.',
        etymology: 'Terme traditionnel wolof',
        examples: [
          { wolof: 'Dafa teranga ci dërëm bi.', français: 'Il est hospitalier dans son village.' }
        ],
        synonyms: [
          { wolof: 'Làmmiñ', français: 'Accueil' }
        ]
      };

      setWordData(mockWordDetails);
    } catch (err) {
      console.error('Erreur de chargement du mot', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExampleChange = (index, e) => {
    const { name, value } = e.target;
    const newExamples = [...wordData.examples];
    newExamples[index][name] = value;
    setWordData(prev => ({
      ...prev,
      examples: newExamples
    }));
  };

  const handleSynonymChange = (index, e) => {
    const { name, value } = e.target;
    const newSynonyms = [...wordData.synonyms];
    newSynonyms[index][name] = value;
    setWordData(prev => ({
      ...prev,
      synonyms: newSynonyms
    }));
  };

  const addExample = () => {
    setWordData(prev => ({
      ...prev,
      examples: [...prev.examples, { wolof: '', français: '' }]
    }));
  };

  const removeExample = (index) => {
    setWordData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  const addSynonym = () => {
    setWordData(prev => ({
      ...prev,
      synonyms: [...prev.synonyms, { wolof: '', français: '' }]
    }));
  };

  const removeSynonym = (index) => {
    setWordData(prev => ({
      ...prev,
      synonyms: prev.synonyms.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};

    // Validation de base
    if (!wordData.wolof.trim()) {
      errors.wolof = 'Le mot wolof est requis';
    }

    if (!wordData.français.trim()) {
      errors.français = 'La traduction française est requise';
    }

    if (!wordData.partOfSpeech) {
      errors.partOfSpeech = 'La classe grammaticale est requise';
    }

    // Validation des exemples
    wordData.examples.forEach((example, index) => {
      if (!example.wolof.trim() || !example.français.trim()) {
        errors[`example${index}`] = 'Les exemples doivent être complets';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulation de soumission 
      // Dans un vrai projet, appelez votre API de création/modification
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Redirection après soumission
      navigate(user?.role === 'admin' || user?.role === 'expert' 
        ? '/admin/words' 
        : '/');
    } catch (err) {
      console.error('Erreur de soumission', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="word-form-page">
      <h1>{isEditMode ? 'Modifier un mot' : 'Ajouter un nouveau mot'}</h1>

      <form onSubmit={handleSubmit} className="word-form">
        {/* Mot Wolof */}
        <div className="form-group">
          <label htmlFor="wolof">Mot Wolof</label>
          <input 
            type="text"
            id="wolof"
            name="wolof"
            value={wordData.wolof}
            onChange={handleInputChange}
            required
            placeholder="Entrez le mot en wolof"
          />
          {formErrors.wolof && (
            <div className="error-message">{formErrors.wolof}</div>
          )}
        </div>

        {/* Traduction Française */}
        <div className="form-group">
          <label htmlFor="français">Traduction Française</label>
          <input 
            type="text"
            id="français"
            name="français"
            value={wordData.français}
            onChange={handleInputChange}
            required
            placeholder="Entrez la traduction en français"
          />
          {formErrors.français && (
            <div className="error-message">{formErrors.français}</div>
          )}
        </div>

        {/* Classe Grammaticale */}
        <div className="form-group">
          <label htmlFor="partOfSpeech">Classe Grammaticale</label>
          <select 
            id="partOfSpeech"
            name="partOfSpeech"
            value={wordData.partOfSpeech}
            onChange={handleInputChange}
            required
          >
            <option value="">Sélectionnez une classe grammaticale</option>
            <option value="Nom">Nom</option>
            <option value="Verbe">Verbe</option>
            <option value="Adjectif">Adjectif</option>
            <option value="Adverbe">Adverbe</option>
            <option value="Expression">Expression</option>
          </select>
          {formErrors.partOfSpeech && (
            <div className="error-message">{formErrors.partOfSpeech}</div>
          )}
        </div>

        {/* Prononciation */}
        <div className="form-group">
          <label htmlFor="pronunciation">Prononciation</label>
          <input 
            type="text"
            id="pronunciation"
            name="pronunciation"
            value={wordData.pronunciation}
            onChange={handleInputChange}
            placeholder="Transcription phonétique (optionnel)"
          />
        </div>

        {/* Définition */}
        <div className="form-group">
          <label htmlFor="definition">Définition</label>
          <textarea 
            id="definition"
            name="definition"
            value={wordData.definition}
            onChange={handleInputChange}
            placeholder="Entrez une définition détaillée"
            rows="4"
          />
        </div>

        {/* Étymologie */}
        <div className="form-group">
          <label htmlFor="etymology">Étymologie</label>
          <textarea 
            id="etymology"
            name="etymology"
            value={wordData.etymology}
            onChange={handleInputChange}
            placeholder="Origine et histoire du mot (optionnel)"
            rows="3"
          />
        </div>

        {/* Exemples */}
        <div className="form-group">
          <label>Exemples d'utilisation</label>
          {wordData.examples.map((example, index) => (
            <div key={index} className="example-input-group">
              <input 
                type="text"
                name="wolof"
                value={example.wolof}
                onChange={(e) => handleExampleChange(index, e)}
                placeholder="Exemple en wolof"
                required
              />
              <input 
                type="text"
                name="français"
                value={example.français}
                onChange={(e) => handleExampleChange(index, e)}
                placeholder="Traduction en français"
                required
              />
              {index > 0 && (
                <button 
                  type="button"
                  onClick={() => removeExample(index)}
                  className="remove-example-button"
                >
                  Supprimer
                </button>
              )}
              {formErrors[`example${index}`] && (
                <div className="error-message">{formErrors[`example${index}`]}</div>
              )}
            </div>
          ))}
          <button 
            type="button"
            onClick={addExample}
            className="add-example-button"
          >
            Ajouter un exemple
          </button>
        </div>

        {/* Synonymes */}
        <div className="form-group">
          <label>Synonymes</label>
          {wordData.synonyms.map((synonym, index) => (
            <div key={index} className="synonym-input-group">
              <input 
                type="text"
                name="wolof"
                value={synonym.wolof}
                onChange={(e) => handleSynonymChange(index, e)}
                placeholder="Synonyme en wolof"
              />
              <input 
                type="text"
                name="français"
                value={synonym.français}
                onChange={(e) => handleSynonymChange(index, e)}
                placeholder="Synonyme en français"
              />
              {index > 0 && (
                <button 
                  type="button"
                  onClick={() => removeSynonym(index)}
                  className="remove-synonym-button"
                >
                  Supprimer
                </button>
              )}
            </div>
          ))}
          <button 
            type="button"
            onClick={addSynonym}
            className="add-synonym-button"
          >
            Ajouter un synonyme
          </button>
        </div>

        {/* Boutons de soumission */}
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading 
              ? (isEditMode ? 'Modification en cours...' : 'Ajout en cours...') 
              : (isEditMode ? 'Modifier le mot' : 'Ajouter le mot')}
          </button>
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="cancel-button"
          >
            Annuler
          </button>
        </div>

        {/* Informations supplémentaires */}
        <div className="form-help">
          <h3>Conseils pour l'ajout de mots</h3>
          <ul>
            <li>Soyez précis et concis dans vos définitions</li>
            <li>Fournissez des exemples d'utilisation clairs</li>
            <li>Vérifiez l'orthographe et la prononciation</li>
            <li>Les mots seront soumis à validation par nos experts</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default WordForm;