// src/components/admin/WordValidation.jsx
import React, { useState, useEffect } from 'react';
import { useWordManagement } from '../../hooks/useWordManagement';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';

const WordValidation = () => {
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [currentWordId, setCurrentWordId] = useState(null);
  
  const {
    words,
    loading,
    error,
    pagination,
    fetchWords,
    validateWordStatus
  } = useWordManagement();

  useEffect(() => {
    // Charger les mots en attente de validation
    fetchWords({ 
      validationStatus: 'pending',
      limit: 10, 
      page: 1 
    });
  }, []);

  const handlePageChange = (page) => {
    fetchWords({ 
      validationStatus: 'pending',
      limit: 10, 
      page 
    });
  };

  const openValidationModal = (wordId, type) => {
    setCurrentWordId(wordId);
    setActionType(type);
    setShowCommentModal(true);
  };

  const handleValidation = async () => {
    if (!currentWordId || !actionType) return;
    
    const status = actionType === 'validate' ? 'validated' : 'rejected';
    const success = await validateWordStatus(currentWordId, status, comment);
    
    if (success) {
      setComment('');
      setShowCommentModal(false);
      
      // Recharger la liste des mots en attente
      fetchWords({ 
        validationStatus: 'pending',
        limit: 10, 
        page: pagination.currentPage 
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Validation des mots</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          {words.length === 0 ? (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-lg">
              Aucun mot en attente de validation.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mot
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Traduction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contributeur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {words.map(word => (
                    <tr key={word.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{word.term}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {word.WordType ? word.WordType.name : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {word.Translations && word.Translations.length > 0
                            ? word.Translations[0].text
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {word.creator ? word.creator.username : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(word.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openValidationModal(word.id, 'validate')}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Valider
                          </button>
                          <button
                            onClick={() => openValidationModal(word.id, 'reject')}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Affichage de <span className="font-medium">{words.length}</span> sur{' '}
                        <span className="font-medium">{pagination.total}</span> résultats
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {/* Logic for pagination buttons */}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Modal de commentaire */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {actionType === 'validate' ? 'Valider' : 'Rejeter'} le mot
              </h3>
              <button
                onClick={() => setShowCommentModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire (optionnel)
              </label>
              <textarea
                id="comment"
                rows="4"
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Ajouter un commentaire sur cette validation..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCommentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleValidation}
                className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
                  actionType === 'validate'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionType === 'validate' ? 'Valider' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordValidation;