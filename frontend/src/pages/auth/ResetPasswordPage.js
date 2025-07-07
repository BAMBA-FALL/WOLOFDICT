import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extraire le token de réinitialisation de l'URL
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (!token) {
      setError('Lien de réinitialisation invalide ou expiré');
    } else {
      setResetToken(token);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation de base
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    // Validation de mot de passe
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Vérification du token
    if (!resetToken) {
      setError('Lien de réinitialisation invalide');
      return;
    }

    setIsLoading(true);

    try {
      // Simulation de réinitialisation de mot de passe
      // Dans un vrai projet, ceci serait remplacé par un appel à votre API backend
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulation de succès de réinitialisation
      setSuccess('Votre mot de passe a été réinitialisé avec succès.');
      
      // Redirection vers la page de connexion après quelques secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('Une erreur est survenue lors de la réinitialisation du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  // Si le token est invalide, afficher un message d'erreur
  if (error && error.includes('invalide')) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <h1>Erreur de réinitialisation</h1>
          <p>{error}</p>
          <div className="error-actions">
            <Link to="/forgot-password" className="resend-link">
              Renvoyer un lien de réinitialisation
            </Link>
            <Link to="/login" className="back-to-login">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h1>Réinitialisation de mot de passe</h1>
        <p>Veuillez saisir votre nouveau mot de passe</p>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Nouveau mot de passe</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nouveau mot de passe"
              minLength={8}
            />
            <div className="password-requirements">
              <small>Le mot de passe doit contenir au moins 8 caractères</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirmez le nouveau mot de passe</label>
            <input 
              type="password" 
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirmez le mot de passe"
            />
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isLoading}
              className="reset-password-button"
            >
              {isLoading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
            </button>
          </div>

          <div className="form-links">
            <Link to="/login" className="back-to-login">
              Annuler
            </Link>
          </div>
        </form>

        <div className="reset-password-help">
          <h3>Conseils pour un bon mot de passe</h3>
          <ul>
            <li>Utilisez au moins 8 caractères</li>
            <li>Combinez lettres majuscules et minuscules</li>
            <li>Incluez des chiffres et des symboles</li>
            <li>Évitez les informations personnelles facilement devinables</li>
            <li>Utilisez un gestionnaire de mots de passe pour plus de sécurité</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;