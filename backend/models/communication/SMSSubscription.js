// =============================================================================
// 📱 WOLOFDICT - MODÈLE SMSSUBSCRIPTION
// Gestion des abonnements SMS avec vérification et préférences
// =============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SMSSubscription = sequelize.define('SMSSubscription', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Informations du numéro
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        is: /^\+[1-9]\d{1,14}$/ // Format E.164
      }
    },
    
    country_code: {
      type: DataTypes.STRING(2),
      allowNull: false,
      validate: {
        isIn: [['SN', 'ML', 'BF', 'CI', 'GN', 'GM', 'MR', 'FR', 'US', 'CA']]
      }
    },
    
    // Liaison utilisateur
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    
    // Informations personnelles
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Statut de l'abonnement
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    
    // Vérification
    verification_code: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    
    verification_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    verification_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Préférences
    language_preference: {
      type: DataTypes.ENUM('français', 'wolof', 'english', 'both'),
      defaultValue: 'français',
      allowNull: false
    },
    
    frequency_preference: {
      type: DataTypes.ENUM('daily', 'weekly', 'biweekly', 'monthly'),
      defaultValue: 'weekly',
      allowNull: false
    },
    
    content_preferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        daily_word: true,
        new_words: true,
        reminders: false,
        events: true,
        system: true
      },
      allowNull: false
    },
    
    // Métadonnées d'abonnement
    subscription_source: {
      type: DataTypes.ENUM('website', 'mobile_app', 'api', 'import', 'referral'),
      defaultValue: 'website',
      allowNull: false
    },
    
    subscription_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    
    // Désabonnement
    unsubscribed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    unsubscribe_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Engagement et statistiques
    total_sms_sent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    total_sms_delivered: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    last_sms_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    last_sms_delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    engagement_score: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    
    // Tracking et métadonnées
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    utm_source: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    utm_medium: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    utm_campaign: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    // Tags pour segmentation
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false
    },
    
    // Notes administratives
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'sms_subscriptions',
    timestamps: true,
    paranoid: false,
    
    indexes: [
      {
        unique: true,
        fields: ['phone_number']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['country_code']
      },
      {
        fields: ['is_active', 'is_verified']
      },
      {
        fields: ['subscription_date']
      },
      {
        fields: ['engagement_score']
      },
      {
        using: 'gin',
        fields: ['content_preferences']
      },
      {
        using: 'gin',
        fields: ['tags']
      }
    ],
    
    hooks: {
      beforeCreate: async (subscription, options) => {
        // Générer code de vérification
        if (!subscription.verification_code) {
          subscription.verification_code = Math.floor(Math.random() * 1000000)
            .toString()
            .padStart(6, '0');
        }
      },
      
      beforeUpdate: async (subscription, options) => {
        // Mettre à jour le score d'engagement si nécessaire
        if (subscription.changed('total_sms_delivered') || subscription.changed('total_sms_sent')) {
          await subscription.updateEngagementScore();
        }
      }
    }
  });

  // =============================================================================
  // 🔧 MÉTHODES D'INSTANCE
  // =============================================================================

  SMSSubscription.prototype.updateEngagementScore = async function() {
    let score = 50; // Score de base
    
    // Facteur de livraison
    if (this.total_sms_sent > 0) {
      const deliveryRate = (this.total_sms_delivered / this.total_sms_sent) * 100;
      score += (deliveryRate - 50) * 0.5; // Bonus/malus basé sur 50% de référence
    }
    
    // Facteur temporel - réduire le score pour les anciens abonnés inactifs
    const daysSinceLastSMS = this.last_sms_delivered_at 
      ? Math.floor((Date.now() - this.last_sms_delivered_at.getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    
    if (daysSinceLastSMS > 30) {
      score -= Math.min(daysSinceLastSMS / 10, 30); // Max -30 points
    }
    
    // Facteur de vérification
    if (!this.is_verified) {
      score -= 20;
    }
    
    // Limiter entre 0 et 100
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    await this.update({ engagement_score: score });
    return score;
  };

  SMSSubscription.prototype.recordSMSSent = async function() {
    await this.update({
      total_sms_sent: this.total_sms_sent + 1,
      last_sms_sent_at: new Date()
    });
  };

  SMSSubscription.prototype.recordSMSDelivered = async function() {
    await this.update({
      total_sms_delivered: this.total_sms_delivered + 1,
      last_sms_delivered_at: new Date()
    });
  };

  SMSSubscription.prototype.shouldReceiveSMS = function(messageType) {
    if (!this.is_active || !this.is_verified) {
      return false;
    }
    
    // Vérifier les préférences de contenu
    const preferences = this.content_preferences || {};
    
    const typePreferenceMap = {
      'daily_word': 'daily_word',
      'new_word': 'new_words',
      'reminder': 'reminders',
      'event': 'events',
      'system': 'system'
    };
    
    const preferenceKey = typePreferenceMap[messageType];
    if (preferenceKey && preferences[preferenceKey] === false) {
      return false;
    }
    
    return true;
  };

  SMSSubscription.prototype.getDisplayName = function() {
    if (this.first_name && this.last_name) {
      return `${this.first_name} ${this.last_name}`;
    } else if (this.first_name) {
      return this.first_name;
    } else {
      return this.phone_number;
    }
  };

  SMSSubscription.prototype.verify = async function() {
    await this.update({
      is_verified: true,
      verified_at: new Date(),
      verification_code: null
    });
  };

  SMSSubscription.prototype.unsubscribe = async function(reason = null) {
    await this.update({
      is_active: false,
      unsubscribed_at: new Date(),
      unsubscribe_reason: reason
    });
  };

  SMSSubscription.prototype.reactivate = async function() {
    await this.update({
      is_active: true,
      unsubscribed_at: null,
      unsubscribe_reason: null
    });
  };

  // =============================================================================
  // 🔧 MÉTHODES DE CLASSE
  // =============================================================================

  SMSSubscription.findActiveSubscribers = function(options = {}) {
    return this.findAll({
      where: {
        is_active: true,
        is_verified: true,
        ...options.where
      },
      ...options
    });
  };

  SMSSubscription.findByCountry = function(countryCode, options = {}) {
    return this.findAll({
      where: {
        country_code: countryCode,
        is_active: true,
        ...options.where
      },
      ...options
    });
  };

  SMSSubscription.getCountryStats = async function() {
    return await this.findAll({
      attributes: [
        'country_code',
        [sequelize.fn('COUNT', '*'), 'total'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_active = true THEN 1 ELSE 0 END')), 'active'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_verified = true THEN 1 ELSE 0 END')), 'verified']
      ],
      group: ['country_code'],
      raw: true
    });
  };

  SMSSubscription.cleanupUnverified = async function(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return await this.destroy({
      where: {
        is_verified: false,
        created_at: { [require('sequelize').Op.lt]: cutoffDate }
      }
    });
  };

  SMSSubscription.findHighEngagement = function(minScore = 70, limit = null) {
    const options = {
      where: {
        engagement_score: { [require('sequelize').Op.gte]: minScore },
        is_active: true,
        is_verified: true
      },
      order: [['engagement_score', 'DESC']]
    };

    if (limit) {
      options.limit = limit;
    }

    return this.findAll(options);
  };

  SMSSubscription.getSegmentStats = async function() {
    return await this.findAll({
      attributes: [
        'country_code',
        'language_preference',
        'frequency_preference',
        [sequelize.fn('COUNT', '*'), 'count']
      ],
      where: {
        is_active: true,
        is_verified: true
      },
      group: ['country_code', 'language_preference', 'frequency_preference'],
      raw: true
    });
  };

  // =============================================================================
  // 🔗 ASSOCIATIONS
  // =============================================================================

  SMSSubscription.associate = function(models) {
    // Association avec User
    if (models.User) {
      SMSSubscription.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
    
    // Association avec SMSMessage
    SMSSubscription.hasMany(models.SMSMessage, {
      foreignKey: 'subscription_id',
      as: 'messages'
    });
  };

  return SMSSubscription;
};