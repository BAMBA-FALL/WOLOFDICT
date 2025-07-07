// src/components/admin/WordForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getWordById, 
  createWord, 
  updateWord 
} from '../../services/api/wordService';
import { getWordTypes } from '../../services/api/wordTypeService';
import { getCategories } from '../../services/api/categoryService';
import { 
  AlertCircle, 
  Plus, 
  Trash, 
  Save 
} from 'lucide-react';

const WordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  
  // États pour le formulaire
  const [wordData, setWordData] = useState({
    term: '',
    pronunciation: '',
    etymology: '',
    wordTypeId: '',
    categoryIds: [],
    dialect: '',
    isArchaic: false,
    notes: ''
  });
  
  const [translations, setTranslations] = useState([
    { text: '', context: '', isPrimary: true }
  ]);
  
  const [examples, setExamples] = useState([
    { textWolof: '', textFrench: '', context: '' }
  ]);
  
  // États pour les données de référence
  const [wordTypes, setWordTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // États pour l'UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Charger les données nécessaires
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger les types de mots et catégories
        const [typesData, categoriesData] = await Promise.all([
          getWordTypes(),
          getCategories()
        ]);
        
        setWordTypes(typesData);
        setCategories(categoriesData);
        
        // Si on est en mode édition, charger les données du mot
        if (isEditing) {
          const wordData = await getWordById(id);
          
          // Mise en forme des données pour le formulaire
          setWordData({
            term: wordData.term || '',
            pronunciation: wordData.pronunciation || '',
            etymology: wordData.etymology || '',
            wordTypeId: wordData.wordTypeId || '',
            categoryIds: wordData.Categories ? wordData.Categories.map(c => c.id) : [],
            dialect: wordData.dialect || '',
            isArchaic: wordData.isArchaic || false,
            notes: wordData.notes || ''
          });
          
          if (wordData.Translations && wordData.Translations.length > 0) {
            setTranslations(wordData.Translations.map(t => ({
              id: t.id,
              text: t.text,
              context: t.context || '',
              isPrimary: t.isPrimary || false
            })));
          }
          
          if (wordData.Examples && wordData.Examples.length > 0) {
            setExamples(wordData.Examples.map(e => ({
              id: e.id,
              textWolof: e.textWolof,
              textFrench: e.textFrench,
              context: e.context || ''
            })));
          }
        }
      } catch (err) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditing]);
  
  // Gestion des changements dans le formulaire principal
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setWordData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Gestion des changements dans les catégories (multiple select)
  const handleCategoryChange = (e) => {
    const value = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setWordData(prev => ({
      ...prev,
      categoryIds: value
    }));
  };
  
  // Gestion des traductions
  const handleTranslationChange = (index, field, value) => {
    const newTranslations = [...translations];
    newTranslations[index] = {
      ...newTranslations[index],
      [field]: value
    };
    setTranslations(newTranslations);
  };
  
  const addTranslation = () => {
    setTranslations([...translations, { text: '', context: '', isPrimary: false }]);
  };
  
  const removeTranslation = (index) => {
    if (translations.length > 1) {
      setTranslations(translations.filter((_, i) => i !== index));
    }
  };
  
  // Gestion des exemples
  const handleExampleChange = (index, field, value) => {
    const newExamples = [...examples];
    newExamples[index] = {
      ...newExamples[index],
      [field]: value
    };
    setExamples(newExamples);
  };
  
  const addExample = () => {
    setExamples([...examples, { textWolof: '', textFrench: '', context: '' }]);
  };
  
  const removeExample = (index) => {
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validation de base
      if (!wordData.term) {
        throw new Error('Le terme est requis');
      }
      
      if (!translations[0].text) {
        throw new Error('Au moins une traduction est requise');
      }
      
      // Préparer les données pour l'envoi
      const formData = {
        ...wordData,
        translations: translations.filter(t => t.text.trim() !== ''),
        examples: examples.filter(e => e.textWolof.trim() !== '' && e.textFrench.trim() !== '')
      };
      
      // Envoi des données à l'API
      let result;
      if (isEditing) {
        result = await updateWord(id, formData);
      } else {
        result = await createWord(formData);
      }
      
      // Afficher le succès
      setSuccess(true);
      
      // Rediriger après un délai
      setTimeout(() => {
        navigate('/admin/words');
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Une erreur est survenue');
      // Scroll to top to show error
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !wordData.term) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? `Modifier "${wordData.term}"` : 'Ajouter un nouveau mot'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p>
            {isEditing 
              ? 'Le mot a été mis à jour avec succès!' 
              : 'Le mot a été ajouté avec succès!'}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Terme */}
          <div>
            <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">
              Terme en wolof <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="term"
              name="term"
              value={wordData.term}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              required
            />
          </div>
          
          {/* Prononciation */}
          <div>
            <label htmlFor="pronunciation" className="block text-sm font-medium text-gray-700 mb-1">
              Prononciation
            </label>
            <input
              type="text"
              id="pronunciation"
              name="pronunciation"
              value={wordData.pronunciation}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          {/* Type de mot */}
          <div>
            <label htmlFor="wordTypeId" className="block text-sm font-medium text-gray-700 mb-1">
              Type de mot
            </label>
            <select
              id="wordTypeId"
              name="wordTypeId"
              value={wordData.wordTypeId}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="">Sélectionner un type</option>
              {wordTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} {type.nameWolof ? `(${type.nameWolof})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* Catégories */}
          <div>
            <label htmlFor="categoryIds" className="block text-sm font-medium text-gray-700 mb-1">
              Catégories
            </label>
            <select
              id="categoryIds"
              name="categoryIds"
              multiple
              value={wordData.categoryIds}
              onChange={handleCategoryChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md h-32"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.nameWolof ? `(${category.nameWolof})` : ''}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Utilisez Ctrl+clic pour sélectionner plusieurs catégories
            </p>
          </div>
        </div>
        
        {/* Options avancées */}
        <div className="mb-6">
          <details className="border border-gray-200 rounded-md p-4">
            <summary className="font-medium cursor-pointer">Options avancées</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="etymology" className="block text-sm font-medium text-gray-700 mb-1">
                  Étymologie
                </label>
                <textarea
                  id="etymology"
                  name="etymology"
                  rows="3"
                  value={wordData.etymology}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="dialect" className="block text-sm font-medium text-gray-700 mb-1">
                  Dialecte
                </label>
                <input
                  type="text"
                  id="dialect"
                  name="dialect"
                  value={wordData.dialect}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  id="isArchaic"
                  name="isArchaic"
                  type="checkbox"
                  checked={wordData.isArchaic}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isArchaic" className="ml-2 block text-sm text-gray-700">
                  Mot archaïque
                </label>
              </div>
            </div>
          </details>
        </div>
        
        {/* Traductions */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Traductions</h3>
          
          {translations.map((translation, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label 
                    htmlFor={`translation-${index}`} 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Traduction en français {index === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    id={`translation-${index}`}
                    value={translation.text}
                    onChange={(e) => handleTranslationChange(index, 'text', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required={index === 0}
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor={`context-${index}`} 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contexte
                  </label>
                  <input
                    type="text"
                    id={`context-${index}`}
                    value={translation.context}
                    onChange={(e) => handleTranslationChange(index, 'context', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="mt-3 flex items-center">
                <input
                  id={`primary-${index}`}
                  type="checkbox"
                  checked={translation.isPrimary}
                  onChange={(e) => handleTranslationChange(index, 'isPrimary', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`primary-${index}`} className="ml-2 block text-sm text-gray-700">
                  Traduction principale
                </label>
                
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => removeTranslation(index)}
                    className="ml-auto flex items-center text-red-600 hover:text-red-800"
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addTranslation}
            className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter une traduction
          </button>
        </div>
        
        {/* Exemples */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Exemples d'utilisation</h3>
          
          {examples.map((example, index) => (
            <div key={index} className="border border-gray-200 rounded-md p-4 mb-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label 
                    htmlFor={`example-wolof-${index}`} 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Exemple en wolof
                  </label>
                  <input
                    type="text"
                    id={`example-wolof-${index}`}
                    value={example.textWolof}
                    onChange={(e) => handleExampleChange(index, 'textWolof', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor={`example-french-${index}`} 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Traduction de l'exemple
                  </label>
                  <input
                    type="text"
                    id={`example-french-${index}`}
                    value={example.textFrench}
                    onChange={(e) => handleExampleChange(index, 'textFrench', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label 
                    htmlFor={`example-context-${index}`} 
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Contexte de l'exemple
                  </label>
                  <input
                    type="text"
                    id={`example-context-${index}`}
                    value={example.context}
                    onChange={(e) => handleExampleChange(index, 'context', e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              {index > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeExample(index)}
                    className="flex items-center text-red-600 hover:text-red-800"
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Supprimer cet exemple
                  </button>
                </div>
              )}
            </div>
          ))}
          
          <button
            type="button"
            onClick={addExample}
            className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un exemple
          </button>
        </div>
        
        {/* Notes */}
        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes supplémentaires
          </label>
          <textarea
            id="notes"
            name="notes"
            rows="4"
            value={wordData.notes}
            onChange={handleChange}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        
        {/* Boutons d'action */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/words')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {isEditing ? 'Enregistrer les modifications' : 'Enregistrer le mot'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default WordForm;