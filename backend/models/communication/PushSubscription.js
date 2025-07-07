// =============================================================================
// 📱 PUSH SUBSCRIPTION MODEL - Abonnements aux notifications push
// File: backend/src/models/communication/PushSubscription.js
// =============================================================================

const { DataTypes, Op } = require('sequelize');
const sequelize = require('../../config/database');

const PushSubscription = sequelize.define('PushSubscription', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },

  // 🔗 Données de l'abonnement push
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true,
    comment: 'URL de endpoint du service push'
  },

  p256dh_key: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Clé publique p256dh pour chiffrement'
  },

  auth_key: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Clé d\'authentification'
  },

  // 👤 Association utilisateur
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'Utilisateur propriétaire (peut être null pour visiteurs anonymes)'
  },

  // 📱 Informations du dispositif
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent du navigateur/dispositif'
  },

  device_type: {
    type: DataTypes.ENUM('desktop', 'mobile', 'tablet', 'unknown'),
    allowNull: false,
    defaultValue: 'unknown',
    comment: 'Type de dispositif'
  },

  browser_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nom du navigateur (Chrome, Firefox, etc.)'
  },

  browser_version: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Version du navigateur'
  },

  os_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Système d\'exploitation'
  },

  // ⚙️ Préférences de notification
  preferences: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      new_words: true,
      new_phrases: true,
      daily_word: true,
      events: true,
      achievements: true,
      reminders: false,
      community: true,
      system: true
    },
    comment: 'Préférences utilisateur pour les types de notifications'
  },

  // 🕐 Préférences horaires
  timezone: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'UTC',
    comment: 'Fuseau horaire de l\'utilisateur'
  },

  quiet_hours_start: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '22:00:00',
    comment: 'Début des heures silencieuses'
  },

  quiet_hours_end: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '08:00:00',
    comment: 'Fin des heures silencieuses'
  },

  // 📊 Statut et gestion
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Abonnement actif'
  },

  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Abonnement vérifié (a reçu au moins une notification)'
  },

  // 📈 Métriques d'engagement
  total_notifications_sent: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre total de notifications envoyées'
  },

  total_notifications_clicked: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre total de notifications cliquées'
  },

  last_notification_sent: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de la dernière notification envoyée'
  },

  last_notification_clicked: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date du dernier clic sur notification'
  },

  last_seen: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière activité détectée'
  },

  // 🚫 Gestion des erreurs
  error_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre d\'erreurs d\'envoi consécutives'
  },

  last_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Dernière erreur rencontrée'
  },

  last_error_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de la dernière erreur'
  },

  // 🏷️ Métadonnées
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Tags pour segmentation'
  },

  subscription_source: {
    type: DataTypes.ENUM('website', 'mobile_app', 'browser_prompt', 'onboarding', 'settings'),
    allowNull: false,
    defaultValue: 'website',
    comment: 'Source de l\'abonnement'
  },

  // 🌍 Données géographiques
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Adresse IP lors de l\'abonnement'
  },

  country_code: {
    type: DataTypes.STRING(2),
    allowNull: true,
    comment: 'Code pays (ISO 3166-1 alpha-2)'
  },

  language_preference: {
    type: DataTypes.ENUM('wolof', 'français', 'english', 'auto'),
    allowNull: false,
    defaultValue: 'auto',
    comment: 'Langue préférée pour les notifications'
  }

}, {
  tableName: 'push_subscriptions',
  timestamps: true,
  paranoid: true, // Soft delete

  indexes: [
    // Index principaux
    { fields: ['endpoint'], unique: true },
    { fields: ['user_id'] },
    { fields: ['is_active'] },
    { fields: ['is_verified'] },
    
    // Index pour gestion d'erreurs
    { fields: ['error_count'] },
    { fields: ['last_error_at'] },
    
    // Index pour analytics
    { fields: ['device_type'] },
    { fields: ['browser_name'] },
    { fields: ['subscription_source'] },
    { fields: ['country_code'] },
    { fields: ['language_preference'] },
    
    // Index pour métriques
    { fields: ['total_notifications_sent'] },
    { fields: ['last_notification_sent'] },
    { fields: ['last_seen'] },
    
    // Index composés
    { fields: ['is_active', 'is_verified'] },
    { fields: ['user_id', 'is_active'] },
    { fields: ['device_type', 'is_active'] },
    { fields: ['created_at', 'is_active'] }
  ],

  // Scopes prédéfinis
  scopes: {
    // Abonnements actifs
    active: {
      where: { is_active: true }
    },

    // Abonnements vérifiés
    verified: {
      where: { 
        is_active: true,
        is_verified: true 
      }
    },

    // Abonnements avec erreurs
    withErrors: {
      where: {
        error_count: { [Op.gt]: 0 }
      }
    },

    // Abonnements récents (7 derniers jours)
    recent: {
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    },

    // Abonnements engagés (ont cliqué récemment)
    engaged: {
      where: {
        last_notification_clicked: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    },

    // Par dispositif
    mobile: {
      where: { device_type: 'mobile' }
    },

    desktop: {
      where: { device_type: 'desktop' }
    },

    // Par langue
    wolof: {
      where: { language_preference: ['wolof', 'auto'] }
    },

    french: {
      where: { language_preference: ['français', 'auto'] }
    }
  },

  // Hooks
  hooks: {
    // Analyser le user agent lors de la création
    beforeCreate: async (subscription, options) => {
      if (subscription.user_agent) {
        const deviceInfo = parseUserAgent(subscription.user_agent);
        subscription.device_type = deviceInfo.device_type;
        subscription.browser_name = deviceInfo.browser_name;
        subscription.browser_version = deviceInfo.browser_version;
        subscription.os_name = deviceInfo.os_name;
      }
    },

    // Réinitialiser les erreurs lors de la réactivation
    beforeUpdate: async (subscription, options) => {
      if (subscription.changed('is_active') && subscription.is_active) {
        subscription.error_count = 0;
        subscription.last_error = null;
        subscription.last_error_at = null;
      }
    }
  }
});

// =============================================================================
// 🔗 ASSOCIATIONS
// =============================================================================

PushSubscription.associate = function(models) {
  // Propriétaire de l'abonnement
  PushSubscription.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user',
    onDelete: 'SET NULL'
  });

  // Notifications envoyées à cet abonnement
  PushSubscription.hasMany(models.PushNotification, {
    foreignKey: 'subscription_id',
    as: 'notifications',
    onDelete: 'CASCADE'
  });
};

// =============================================================================
// 🛠️ MÉTHODES D'INSTANCE
// =============================================================================

// 📤 Enregistrer l'envoi d'une notification
PushSubscription.prototype.recordNotificationSent = async function() {
  this.total_notifications_sent += 1;
  this.last_notification_sent = new Date();
  this.is_verified = true; // Marquer comme vérifié après le premier envoi
  await this.save(['total_notifications_sent', 'last_notification_sent', 'is_verified']);
};

// 👆 Enregistrer un clic sur notification
PushSubscription.prototype.recordNotificationClicked = async function() {
  this.total_notifications_clicked += 1;
  this.last_notification_clicked = new Date();
  await this.save(['total_notifications_clicked', 'last_notification_clicked']);
};

// 👀 Mettre à jour la dernière activité
PushSubscription.prototype.updateLastSeen = async function() {
  this.last_seen = new Date();
  await this.save(['last_seen']);
};

// ❌ Enregistrer une erreur d'envoi
PushSubscription.prototype.recordError = async function(errorMessage) {
  this.error_count += 1;
  this.last_error = errorMessage;
  this.last_error_at = new Date();
  
  // Désactiver après 5 erreurs consécutives
  if (this.error_count >= 5) {
    this.is_active = false;
  }
  
  await this.save(['error_count', 'last_error', 'last_error_at', 'is_active']);
};

// ✅ Réinitialiser les erreurs après succès
PushSubscription.prototype.resetErrors = async function() {
  if (this.error_count > 0) {
    this.error_count = 0;
    this.last_error = null;
    this.last_error_at = null;
    await this.save(['error_count', 'last_error', 'last_error_at']);
  }
};

// 📊 Calculer le taux d'engagement
PushSubscription.prototype.getEngagementRate = function() {
  if (this.total_notifications_sent === 0) return 0;
  return Math.round((this.total_notifications_clicked / this.total_notifications_sent) * 100);
};

// 🕐 Vérifier si on est dans les heures silencieuses
PushSubscription.prototype.isInQuietHours = function() {
  if (!this.quiet_hours_start || !this.quiet_hours_end) return false;
  
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
  
  const startTime = this.quiet_hours_start;
  const endTime = this.quiet_hours_end;
  
  // Gestion du passage à minuit
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
};

// ✅ Vérifier si une notification doit être envoyée
PushSubscription.prototype.shouldReceiveNotification = function(notificationType) {
  if (!this.is_active) return false;
  if (this.isInQuietHours()) return false;
  if (!this.preferences) return true;
  
  return this.preferences[notificationType] !== false;
};

// 🔄 Mettre à jour les préférences
PushSubscription.prototype.updatePreferences = async function(newPreferences) {
  const updatedPreferences = {
    ...this.preferences,
    ...newPreferences
  };
  
  this.preferences = updatedPreferences;
  await this.save(['preferences']);
  
  return updatedPreferences;
};

// =============================================================================
// 🏭 MÉTHODES DE CLASSE (STATIQUES)
// =============================================================================

// 📊 Obtenir les statistiques globales
PushSubscription.getOverallStats = async function() {
  const stats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', '*'), 'total_subscriptions'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_active = true THEN 1 ELSE 0 END')), 'active_subscriptions'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_verified = true THEN 1 ELSE 0 END')), 'verified_subscriptions'],
      [sequelize.fn('SUM', sequelize.col('total_notifications_sent')), 'total_notifications_sent'],
      [sequelize.fn('SUM', sequelize.col('total_notifications_clicked')), 'total_notifications_clicked'],
      [sequelize.fn('AVG', sequelize.literal('(total_notifications_clicked * 100.0 / NULLIF(total_notifications_sent, 0))')), 'avg_engagement_rate']
    ],
    raw: true
  });

  return stats[0];
};

// 📱 Statistiques par dispositif
PushSubscription.getDeviceStats = async function() {
  return await this.findAll({
    attributes: [
      'device_type',
      [sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.fn('AVG', sequelize.literal('(total_notifications_clicked * 100.0 / NULLIF(total_notifications_sent, 0))')), 'avg_engagement']
    ],
    where: { is_active: true },
    group: ['device_type'],
    raw: true
  });
};

// 🌍 Statistiques par pays
PushSubscription.getCountryStats = async function() {
  return await this.findAll({
    attributes: [
      'country_code',
      [sequelize.fn('COUNT', '*'), 'count']
    ],
    where: { 
      is_active: true,
      country_code: { [Op.not]: null }
    },
    group: ['country_code'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']],
    limit: 20,
    raw: true
  });
};

// 🔍 Trouver les abonnements avec préférence spécifique
PushSubscription.findByPreference = function(preferenceKey, enabled = true) {
  return this.findAll({
    where: {
      is_active: true,
      [`preferences.${preferenceKey}`]: enabled
    }
  });
};

// 📈 Trouver les plus engagés
PushSubscription.findMostEngaged = function(limit = 100) {
  return this.findAll({
    where: {
      is_active: true,
      total_notifications_sent: { [Op.gt]: 0 }
    },
    order: [
      [sequelize.literal('(total_notifications_clicked * 100.0 / total_notifications_sent)'), 'DESC']
    ],
    limit
  });
};

// 🧹 Nettoyer les abonnements inactifs
PushSubscription.cleanupInactive = async function(daysInactive = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  return await this.destroy({
    where: {
      [Op.or]: [
        { is_active: false },
        { 
          error_count: { [Op.gte]: 5 },
          last_error_at: { [Op.lt]: cutoffDate }
        }
      ]
    }
  });
};

// 🔄 Réactiver les abonnements après résolution d'erreurs
PushSubscription.reactivateAfterErrors = async function() {
  const updated = await this.update(
    { 
      is_active: true,
      error_count: 0,
      last_error: null,
      last_error_at: null
    },
    {
      where: {
        is_active: false,
        error_count: { [Op.lt]: 10 }, // Seulement si pas trop d'erreurs
        last_error_at: {
          [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Erreurs de plus de 24h
        }
      }
    }
  );

  return updated[0]; // Nombre d'enregistrements mis à jour
};

// =============================================================================
// 🛠️ FONCTIONS UTILITAIRES
// =============================================================================

// Analyser le user agent (fonction simplifiée)
function parseUserAgent(userAgent) {
  const ua = userAgent.toLowerCase();
  
  let device_type = 'unknown';
  let browser_name = 'unknown';
  let browser_version = null;
  let os_name = 'unknown';

  // Détection du type de dispositif
  if (ua.includes('mobile') || ua.includes('android')) {
    device_type = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device_type = 'tablet';
  } else {
    device_type = 'desktop';
  }

  // Détection du navigateur
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser_name = 'Chrome';
    const match = ua.match(/chrome\/(\d+)/);
    browser_version = match ? match[1] : null;
  } else if (ua.includes('firefox')) {
    browser_name = 'Firefox';
    const match = ua.match(/firefox\/(\d+)/);
    browser_version = match ? match[1] : null;
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser_name = 'Safari';
    const match = ua.match(/version\/(\d+)/);
    browser_version = match ? match[1] : null;
  } else if (ua.includes('edg')) {
    browser_name = 'Edge';
    const match = ua.match(/edg\/(\d+)/);
    browser_version = match ? match[1] : null;
  }

  // Détection de l'OS
  if (ua.includes('windows')) {
    os_name = 'Windows';
  } else if (ua.includes('mac os') || ua.includes('macos')) {
    os_name = 'macOS';
  } else if (ua.includes('linux')) {
    os_name = 'Linux';
  } else if (ua.includes('android')) {
    os_name = 'Android';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os_name = 'iOS';
  }

  return {
    device_type,
    browser_name,
    browser_version,
    os_name
  };
}

module.exports = PushSubscription;