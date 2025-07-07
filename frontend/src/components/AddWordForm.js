import React, { useState } from 'react';
import { Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { addWord } from './services/api';
import WolofTextarea from './WolofTextarea';

const AddWordForm = ({ onWordAdded }) => {
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [status, setStatus] = useState({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newWord.trim() || !newTranslation.trim()) {
      setStatus({
        type: 'error',
        message: 'Veuillez remplir tous les champs'
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addWord(newWord, newTranslation);
      setStatus({
        type: 'success',
        message: `Le mot "${newWord}" a été ajouté avec succès`
      });
      setNewWord('');
      setNewTranslation('');
      onWordAdded(newWord, newTranslation);
      
      // Réinitialiser le message après 3 secondes
      setTimeout(() => {
        setStatus({ type: null, message: '' });
      }, 3000);
      
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Erreur lors de l\'ajout du mot'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Ajouter un nouveau mot</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label 
              htmlFor="newWord" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Mot en wolof
            </label>
            <input
              id="newWord"
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entrez un mot en wolof"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <WolofTextarea
              label="Traduction en français"
              value={newTranslation}
              onChange={(e) => setNewTranslation(e.target.value)}
              placeholder="Entrez la traduction détaillée"
              disabled={isSubmitting}
              error={status.type === 'error' && !newTranslation.trim() ? 'Champ requis' : ''}
              rows={4}
              maxLength={500}
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded-lg flex items-center justify-center transition-colors ${
            isSubmitting 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none'
          } text-white`}
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
          ) : (
            <Plus size={20} className="mr-2" />
          )}
          {isSubmitting ? 'En cours...' : 'Ajouter'}
        </button>
        
        {status.message && (
          <div className={`mt-3 p-3 rounded text-sm flex items-start ${
            status.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle size={18} className="mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            )}
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
};

export default AddWordForm;