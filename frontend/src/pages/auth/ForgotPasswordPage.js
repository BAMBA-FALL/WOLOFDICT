import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailIcon, ArrowLeftIcon, ShieldCheckIcon, AlertCircleIcon, CheckCircleIcon, LoaderIcon } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Formulaire, 2: Confirmation

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation de base
    if (!email) {
      setError('Veuillez saisir votre adresse email');
      return;
    }

    setIsLoading(true);

    try {
      // Simulation de réinitialisation de mot de passe
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Vérification simulée de l'email
      if (email === 'admin@example.com' || 
          email === 'expert@example.com' || 
          email === 'user@example.com') {
        setSuccess('Un email de réinitialisation a été envoyé à votre adresse.');
        setStep(2); // Passer à l'étape de confirmation
      } else {
        setError('Aucun compte n\'est associé à cette adresse email');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-xl sm:px-10 border border-gray-100">
          {step === 1 ? (
            <>
              <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShieldCheckIcon size={32} className="text-blue-600" />
                  </div>
                </div>
                <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
                  Réinitialisation du mot de passe
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Entrez votre adresse email pour recevoir un lien de réinitialisation
                </p>
              </div>

              <div className="mt-8">
                {error && (
                  <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200 animate-fadeIn">
                    <div className="flex">
                      <AlertCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                      <span className="text-red-800 text-sm">{error}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Adresse email
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 pr-3 py-2 block w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="nom@exemple.com"
                      />
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <LoaderIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Envoi en cours...
                        </span>
                      ) : (
                        "Envoyer le lien de réinitialisation"
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Ou</span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-1" />
                      Retour à la connexion
                    </Link>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">Besoin d'aide ?</h3>
                  <ul className="text-xs text-blue-700 space-y-1 pl-4">
                    <li>Vérifiez que l'email est correctement orthographié</li>
                    <li>Consultez vos spam si vous ne recevez pas l'email</li>
                    <li>Les emails de réinitialisation sont valables 1 heure</li>
                  </ul>
                  <div className="mt-2 text-xs text-center text-blue-700">
                    Contactez le support : 
                    <a href="mailto:support@dictionnaire-wolof.com" className="font-medium ml-1 hover:underline">
                      support@dictionnaire-wolof.com
                    </a>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-6 animate-fadeIn">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
                <CheckCircleIcon size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Email envoyé !
              </h2>
              <p className="text-center text-gray-600 mb-6 max-w-sm">
                Un lien de réinitialisation a été envoyé à <span className="font-semibold">{email}</span>. 
                Veuillez vérifier votre boîte de réception.
              </p>
              <div className="p-4 bg-blue-50 rounded-lg w-full border border-blue-100 text-sm mb-6">
                <p className="text-blue-700">
                  Vérifiez également votre dossier spam si vous ne trouvez pas l'email dans votre boîte de réception.
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Essayer une autre adresse
                </button>
                <Link
                  to="/login"
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;