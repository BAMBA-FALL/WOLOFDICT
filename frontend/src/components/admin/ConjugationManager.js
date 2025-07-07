// src/components/admin/ConjugationManager.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  getConjugationsForWord, 
  getBulkConjugationTemplate,
  addBulkConjugations 
} from '../../services/apiServices/conjugationService';
import { getWordById } from '../../services/apiServices/wordService';
import { AlertCircle, Save, Plus } from 'lucide-react';

const ConjugationManager = () => {
  const { id: wordId } = useParams();
  
  const [word, setWord] = useState(null);
  const [conjugationData, setConjugationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Structure les temps verbaux en wolof
  const tensesInfo = {
    present: {
      label: 'Présent',
      wolofLabel: 'Léegi'
    },
    past: {
      label: 'Passé',
      wolofLabel: 'Weesu'
    },
    future: {
      label: 'Futur',
      wolofLabel: 'Ëllëg'
    },
    imperative: {
      label: 'Impératif',
      wolofLabel: 'Santaane'
    },
    conditional: {
      label: 'Conditionnel',
      wolofLabel: 'Soo'
    }
  };
  
  // Structure les personnes grammaticales en wolof
  const personsInfo = {
    '1sg': {
      label: '1ère pers. sing.',
      wolofLabel: 'Man',
      frenchPronoun: 'je/j\''
    },
    '2sg': {
      label: '2ème pers. sing.',
      wolofLabel: 'Yow',
      frenchPronoun: 'tu'
    },
    '3sg': {
      label: '3ème pers. sing.',
      wolofLabel: 'Moom',
      frenchPronoun: 'il/elle'
    },
    '1pl': {
      label: '1ère pers. plur.',
      wolofLabel: 'Nun',
      frenchPronoun: 'nous'
    },
    '2pl': {
      label: '2ème pers. plur.',
      wolofLabel: 'Yeen',
      frenchPronoun: 'vous'
    },
    '3pl': {
      label: '3ème pers. plur.',
      wolofLabel: 'Ñoom',
      frenchPronoun: 'ils/elles'
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les informations du mot
        const wordData = await getWordById(wordId);
        setWord(wordData);
        
        // Vérifier si c'est un verbe
        if (!wordData.WordType || wordData.WordType.name !== 'Verbe') {
          throw new Error('Ce mot n\'est pas un verbe et ne peut pas être conjugué');
        }
        
        // Récupérer les conjugaisons existantes
        const conjugations = await getConjugationsForWord(wordId);
        
        if (conjugations.length > 0) {
          // Organiser les conjugaisons existantes
          const formattedData = {
            term: wordData.term,
            conjugations: conjugations.map(conj => ({
              id: conj.id,
              tense: conj.tense,
              person: conj.person,
              form: conj.form,
              isRegular: conj.isRegular,
              aspect: conj.aspect,
              mood: conj.mood,
              validationStatus: conj.validationStatus
            }))
          };
          setConjugationData(formattedData);
        } else {
          // Si aucune conjugaison n'existe, obtenir un modèle vide
          const template = await getBulkConjugationTemplate(wordId);
          setConjugationData(template);
        }
      } catch (err) {
        setError(err.message || 'Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    if (wordId) {
      fetchData();
    }
  }, [wordId]);
  
  const handleConjugationChange = (tense, person, value) => {
    setConjugationData(prevData => {
      const updatedConjugations = prevData.conjugations.map(conj => {
        if (conj.tense === tense && conj.person === person) {
          return { ...conj, form: value };
        }
        return conj;
      });
      
      return {
        ...prevData,
        conjugations: updatedConjugations
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await addBulkConjugations(wordId, { 
        conjugations: conjugationData.conjugations 
      });
      
      setSuccess(true);
      
      // Mettre à jour les données avec les ID des conjugaisons créées/modifiées
      setConjugationData(prevData => ({
        ...prevData,
        conjugations: response.conjugations.map(conj => ({
          id: conj.id,
          tense: conj.tense,
          person: conj.person,
          form: conj.form,
          isRegular: conj.isRegular,
          aspect: conj.aspect,
          mood: conj.mood,
          validationStatus: conj.validationStatus
        }))
      }));
      
      // Masquer le message de succès après 3 secondes
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'enregistrement des conjugaisons');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && !conjugationData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Conjugaison de "{word?.term}"
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
          <p>Les conjugaisons ont été enregistrées avec succès!</p>
        </div>
      )}
      
      {conjugationData && (
        <form onSubmit={handleSubmit}>
          {Object.keys(tensesInfo).map(tense => {
            // Filtrer les conjugaisons pour ce temps
            const tenseConjugations = conjugationData.conjugations.filter(
              conj => conj.tense === tense
            );
            
            // Si aucune conjugaison pour ce temps, ne pas afficher la section
            if (tenseConjugations.length === 0) {
              return null;
            }
            
            return (
              <div key={tense} className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-blue-800 border-b pb-2">
                  {tensesInfo[tense].label} ({tensesInfo[tense].wolofLabel})
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenseConjugations.map(conj => {
                    const personInfo = personsInfo[conj.person];
                    
                    return (
                      <div key={`${tense}-${conj.person}`} className="flex items-center">
                        <div className="w-1/3">
                          <span className="text-gray-700 font-medium">
                            {personInfo.label}
                          </span>
                          <p className="text-xs text-gray-500">
                            {personInfo.wolofLabel} / {personInfo.frenchPronoun}
                          </p>
                        </div>
                        <div className="w-2/3">
                          <input
                            type="text"
                            value={conj.form || ''}
                            onChange={e => handleConjugationChange(tense, conj.person, e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder={`${personInfo.wolofLabel} ${conjugationData.term}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-end space-x-3 mt-6">
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
              Enregistrer les conjugaisons
            </button>
          </div>
        </form>
      )}
      
      {/* Ajouter une autre forme de conjugaison */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          className="flex items-center text-blue-600 hover:text-blue-800"
          // Cette fonction devrait ajouter un nouveau temps verbal au formulaire
          // Il faudrait implémenter cette fonctionnalité
          onClick={() => {/* TODO: implémenter */}}
        >
          <Plus className="h-4 w-4 mr-1" />
          Ajouter un autre temps verbal
        </button>
      </div>
    </div>
  );
};

export default ConjugationManager;