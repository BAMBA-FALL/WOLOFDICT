import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
  const { user, updateProfile } = useAuth();
  
  const [settings, setSettings] = useState({
    username: user?.username || '',
    email: user?.email || '',
    language: 'fr',
    notificationPreferences: {
      emailNotifications: true,
      contributionAlerts: true,
      validationUpdates: false
    },
    privacySettings: {
      profileVisibility: 'public',
      showContributions: true
    }
  });

  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Gestion des cases à cocher
    if (type === 'checkbox') {
      setSettings(prev => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [name]: checked
        }
      }));
    } 
    // Gestion des paramètres imbriqués
    else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } 
    // Gestion des paramètres simples
    else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Simulation de mise à jour du profil
      // Dans un vrai projet, appelez votre API de mise à jour
      await new Promise(resolve => setTimeout(resolve, 1500));

      updateProfile({
        username: settings.username,
        email: settings.email
      });

      setSuccess('Profil mis à jour avec succès');
    } catch (err) {
      setError('Impossible de mettre à jour le profil');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation de base
    if (passwordSettings.newPassword !== passwordSettings.confirmNewPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordSettings.newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }

    try {
      // Simulation de changement de mot de passe
      // Dans un vrai projet, appelez votre API de changement de mot de passe
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Réinitialisation du formulaire
      setPasswordSettings({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });

      setSuccess('Mot de passe modifié avec succès');
    } catch (err) {
      setError('Impossible de modifier le mot de passe');
    }
  };

  return (
    <div className="settings-page">
      <h1>Paramètres</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-sections">
        <section className="profile-settings">
          <h2>Paramètres du profil</h2>
          <form onSubmit={handleProfileUpdate} className="profile-form">
            <div className="form-group">
              <label htmlFor="username">Nom d'utilisateur</label>
              <input 
                type="text"
                id="username"
                name="username"
                value={settings.username}
                onChange={handleSettingsChange}
                required
                minLength={3}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email"
                id="email"
                name="email"
                value={settings.email}
                onChange={handleSettingsChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="language">Langue de l'interface</label>
              <select 
                id="language"
                name="language"
                value={settings.language}
                onChange={handleSettingsChange}
              >
                <option value="fr">Français</option>
                <option value="wo">Wolof</option>
                <option value="en">English</option>
              </select>
            </div>

            <button type="submit" className="update-profile-button">
              Mettre à jour le profil
            </button>
          </form>
        </section>

        <section className="notification-settings">
          <h2>Préférences de notification</h2>
          <form>
            <div className="checkbox-group">
              <label>
                <input 
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.notificationPreferences.emailNotifications}
                  onChange={handleSettingsChange}
                />
                Recevoir des notifications par email
              </label>
            </div>

            <div className="checkbox-group">
              <label>
                <input 
                  type="checkbox"
                  name="contributionAlerts"
                  checked={settings.notificationPreferences.contributionAlerts}
                  onChange={handleSettingsChange}
                />
                Alertes sur mes contributions
              </label>
            </div>

            <div className="checkbox-group">
              <label>
                <input 
                  type="checkbox"
                  name="validationUpdates"
                  checked={settings.notificationPreferences.validationUpdates}
                  onChange={handleSettingsChange}
                />
                Mises à jour de validation des mots
              </label>
            </div>
          </form>
        </section>

        <section className="privacy-settings">
          <h2>Paramètres de confidentialité</h2>
          <form>
            <div className="form-group">
              <label htmlFor="profileVisibility">Visibilité du profil</label>
              <select 
                id="profileVisibility"
                name="privacySettings.profileVisibility"
                value={settings.privacySettings.profileVisibility}
                onChange={handleSettingsChange}
              >
                <option value="public">Public</option>
                <option value="private">Privé</option>
                <option value="contributors">Contributeurs uniquement</option>
              </select>
            </div>

            <div className="checkbox-group">
              <label>
                <input 
                  type="checkbox"
                  name="showContributions"
                  checked={settings.privacySettings.showContributions}
                  onChange={handleSettingsChange}
                />
                Afficher mes contributions publiquement
              </label>
            </div>
          </form>
        </section>

        <section className="password-settings">
          <h2>Changer de mot de passe</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Mot de passe actuel</label>
              <input 
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordSettings.currentPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input 
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordSettings.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
              <small>Le mot de passe doit contenir au moins 8 caractères</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</label>
              <input 
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={passwordSettings.confirmNewPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
            </div>

            <button type="submit" className="change-password-button">
              Changer le mot de passe
            </button>
          </form>
        </section>

        <section className="account-danger-zone">
          <h2>Zone de danger</h2>
          <div className="danger-actions">
            <button className="deactivate-account-button">
              Désactiver mon compte
            </button>
            
            {user?.role === 'admin' && (
              <button className="reset-system-button">
                Réinitialiser les paramètres système
              </button>
            )}
          </div>
          <p>
            <strong>Attention :</strong> Ces actions sont irréversibles et 
            supprimeront définitivement vos données.
          </p>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;