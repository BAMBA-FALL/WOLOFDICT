// models/user/UserProfile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  
  // =============================================================================
  // 🌍 PRÉFÉRENCES LINGUISTIQUES
  // =============================================================================
  native_language: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Langue maternelle de l\'utilisateur'
  },
  learning_goals: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Objectifs d\'apprentissage personnalisés'
  },
  languages_spoken: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Langues parlées avec niveaux'
  },
  
  // =============================================================================
  // 🔔 PRÉFÉRENCES DE NOTIFICATION
  // =============================================================================
  notification_preferences: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email_notifications: true,
      push_notifications: true,
      weekly_digest: true,
      new_words: true,
      community_updates: true,
      events: true,
      security_alerts: true, // Nouveau pour AuthService
      login_alerts: true     // Nouveau pour AuthService
    },
    comment: 'Préférences de notification étendues'
  },
  
  // =============================================================================
  // 🔒 PARAMÈTRES DE CONFIDENTIALITÉ
  // =============================================================================
  privacy_settings: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      show_profile: true,
      show_contributions: true,
      show_activity: false,
      show_favorites: false,
      show_online_status: false,
      allow_direct_messages: true,
      show_last_seen: false
    },
    comment: 'Paramètres de confidentialité détaillés'
  },
  
  // =============================================================================
  // 🌐 INFORMATIONS SOCIALES
  // =============================================================================
  social_links: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Liens vers réseaux sociaux'
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  
  // =============================================================================
  // 👤 INFORMATIONS PERSONNELLES (CHIFFRÉES)
  // =============================================================================
  birth_date: {
    type: DataTypes.TEXT, // Chiffré par EncryptionService
    allowNull: true,
    comment: 'Date de naissance chiffrée'
  },
  gender: {
    type: DataTypes.TEXT, // Chiffré par EncryptionService
    allowNull: true,
    comment: 'Genre chiffré'
  },
  
  // =============================================================================
  // 🎓 INFORMATIONS PROFESSIONNELLES
  // =============================================================================
  education_level: {
    type: DataTypes.ENUM('elementary', 'secondary', 'undergraduate', 'graduate', 'postgraduate'),
    allowNull: true
  },
  profession: {
    type: DataTypes.TEXT, // Chiffré par EncryptionService
    allowNull: true,
    comment: 'Profession chiffrée'
  },
  interests: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Centres d\'intérêt'
  },
  
  // =============================================================================
  // 🔐 SÉCURITÉ ET AUDIT
  // =============================================================================
  profile_visibility: {
    type: DataTypes.ENUM('public', 'community', 'friends', 'private'),
    allowNull: false,
    defaultValue: 'community',
    comment: 'Niveau de visibilité du profil'
  },
  data_processing_consent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Consentement traitement données RGPD'
  },
  marketing_consent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Consentement marketing'
  },
  analytics_consent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Consentement analytics anonymes'
  },
  last_profile_update: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière mise à jour du profil'
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['native_language'] },
    { fields: ['education_level'] },
    { fields: ['profile_visibility'] },
    { fields: ['created_at'] }
  ],
  hooks: {
    beforeUpdate: (profile) => {
      profile.last_profile_update = new Date();
    }
  }
});

// =============================================================================
// 🔐 MÉTHODES DE CHIFFREMENT/DÉCHIFFREMENT
// =============================================================================

/**
 * Chiffrer les données sensibles via AuthService
 */
UserProfile.prototype.encryptSensitiveData = async function() {
  try {
    const AuthService = require('../../services/AuthService');
    if (!AuthService || !AuthService.isInitialized) return;

    const { encryptionService } = AuthService;
    
    // Chiffrer birth_date si présent et non chiffré
    if (this.birth_date && !this.birth_date.includes('{"iv":')) {
      this.birth_date = encryptionService.encryptField(this.birth_date);
    }
    
    // Chiffrer gender si présent et non chiffré
    if (this.gender && !this.gender.includes('{"iv":')) {
      this.gender = encryptionService.encryptField(this.gender);
    }
    
    // Chiffrer profession si présent et non chiffré
    if (this.profession && !this.profession.includes('{"iv":')) {
      this.profession = encryptionService.encryptField(this.profession);
    }
    
  } catch (error) {
    console.warn('Erreur chiffrement données sensibles profil:', error.message);
  }
};

/**
 * Obtenir les données déchiffrées
 */
UserProfile.prototype.getDecryptedData = function() {
  try {
    const AuthService = require('../../services/AuthService');
    if (!AuthService || !AuthService.isInitialized) {
      return {
        birth_date: this.birth_date,
        gender: this.gender,
        profession: this.profession
      };
    }

    const { encryptionService } = AuthService;
    
    return {
      birth_date: this.birth_date ? encryptionService.decryptField(this.birth_date) : null,
      gender: this.gender ? encryptionService.decryptField(this.gender) : null,
      profession: this.profession ? encryptionService.decryptField(this.profession) : null
    };
    
  } catch (error) {
    console.warn('Erreur déchiffrement données profil:', error.message);
    return {
      birth_date: this.birth_date,
      gender: this.gender,
      profession: this.profession
    };
  }
};

/**
 * Obtenir un profil sanitisé (sans données sensibles)
 */
UserProfile.prototype.getSanitizedProfile = function() {
  const profile = { ...this.toJSON() };
  
  // Supprimer les données sensibles
  delete profile.birth_date;
  delete profile.gender;
  delete profile.profession;
  
  // Masquer certaines données selon privacy_settings
  if (!profile.privacy_settings?.show_profile) {
    delete profile.social_links;
    delete profile.website;
    delete profile.interests;
  }
  
  return profile;
};

// =============================================================================
// 📊 MÉTHODES DE CLASSE
// =============================================================================

/**
 * Rechercher par préférences linguistiques
 */
UserProfile.findByLanguagePreferences = function(language, options = {}) {
  return this.findAll({
    where: {
      [sequelize.Op.or]: [
        { native_language: language },
        sequelize.literal(`JSON_CONTAINS(languages_spoken, '"${language}"')`)
      ],
      ...options.where
    },
    ...options
  });
};

/**
 * Statistiques des profils
 */
UserProfile.getProfileStats = async function() {
  const stats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_profiles'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN birth_date IS NOT NULL THEN 1 END')), 'with_birth_date'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN profession IS NOT NULL THEN 1 END')), 'with_profession'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN data_processing_consent = true THEN 1 END')), 'gdpr_consent'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN profile_visibility = "public" THEN 1 END')), 'public_profiles']
    ],
    raw: true
  });
  
  return stats[0];
};

/**
 * Nettoyer les données expirées (RGPD)
 */
UserProfile.cleanupExpiredData = async function(retentionDays = 2555) { // 7 ans par défaut
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  return await this.update(
    {
      birth_date: null,
      profession: null,
      social_links: {},
      interests: []
    },
    {
      where: {
        updated_at: {
          [sequelize.Op.lt]: cutoffDate
        },
        data_processing_consent: false
      }
    }
  );
};

module.exports = UserProfile;