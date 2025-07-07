// =============================================================================
// 📨 PUSH NOTIFICATION MODEL - Historique des notifications push
// File: backend/src/models/communication/PushNotification.js
// =============================================================================

const { DataTypes, Op } = require('sequelize');
const sequelize = require('../../config/database');

const PushNotification = sequelize.define('PushNotification', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },

  // 🔗 Relations
  subscription_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'push_subscriptions',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'Abonnement push destinataire'
  },

  campaign_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'newsletter_campaigns',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'Campagne liée (si applicable)'
  },

  // 📝 Contenu de la notification
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Titre de la notification'
  },

  body: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Corps de la notification'
  },

  icon: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de l\'icône'
  },

  badge: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL du badge'
  },

  image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de l\'image (rich notification)'
  },

  // 🎯 Type et catégorisation
  type: {
    type: DataTypes.ENUM(
      'new_word',
      'new_phrase', 
      'daily_word',
      'event',
      'achievement',
      'reminder',
      'system',
      'community',
      'custom'
    ),
    allowNull: false,
    defaultValue: 'custom',
    comment: 'Type de notification'
  },

  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Catégorie personnalisée'
  },

  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal',
    comment: 'Priorité de la notification'
  },

  // 🔗 Données et actions
  data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Données personnalisées de la notification'
  },

  url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: 'URL de destination au clic'
  },

  actions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Actions disponibles sur la notification'
  },

  // ⚙️ Configuration d'affichage
  require_interaction: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Notification persistante nécessitant une interaction'
  },

  silent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Notification silencieuse'
  },

  vibrate: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Pattern de vibration [durée1, pause1, durée2, ...]'
  },

  // 📊 Statut et tracking
  status: {
    type: DataTypes.ENUM(
      'pending',    // En attente d'envoi
      'sending',    // En cours d'envoi
      'sent',       // Envoyée avec succès
      'delivered',  // Livrée (confirmée par le client)
      'clicked',    // Cliquée par l'utilisateur
      'dismissed',  // Fermée sans interaction
      'failed',     // Échec d'envoi
      'expired'     // Expirée
    ),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Statut de la notification'
  },

  // 📅 Timestamps détaillés
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de planification (pour notifications différées)'
  },

  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'envoi effective'
  },

  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de livraison confirmée'
  },

  clicked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de clic par l\'utilisateur'
  },

  dismissed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fermeture/rejet'
  },

  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration'
  },

  // ❌ Gestion d'erreurs
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message d\'erreur en cas d\'échec'
  },

  error_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Code d\'erreur'
  },

  retry_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de tentatives d\'envoi'
  },

  max_retries: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 3,
    comment: 'Nombre maximum de tentatives'
  },

  // 🏷️ Métadonnées
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Tags pour organisation et filtrage'
  },

  source: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Source de la notification (système, admin, api, etc.)'
  },

  // 📱 Informations du dispositif (snapshot)
  device_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Informations du dispositif au moment de l\'envoi'
  },

  // 🎯 Personnalisation
  language: {
    type: DataTypes.ENUM('wolof', 'français', 'english'),
    allowNull: true,
    comment: 'Langue de la notification'
  },

  timezone: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Fuseau horaire de l\'utilisateur'
  }

}, {
  tableName: 'push_notifications',
  timestamps: true,
  paranoid: false, // Pas de soft delete pour l'historique

  indexes: [
    // Index principaux
    { fields: ['subscription_id'] },
    { fields: ['campaign_id'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    
    // Index pour tracking
    { fields: ['sent_at'] },
    { fields: ['clicked_at'] },
    { fields: ['delivered_at'] },
    
    // Index pour planification
    { fields: ['scheduled_at'] },
    { fields: ['expires_at'] },
    
    // Index pour analytics
    { fields: ['created_at'] },
    { fields: ['type', 'status'] },
    { fields: ['language'] },
    { fields: ['source'] },
    
    // Index composés
    { fields: ['subscription_id', 'status'] },
    { fields: ['type', 'sent_at'] },
    { fields: ['status', 'scheduled_at'] },
    { fields: ['created_at', 'type', 'status'] }
  ],

  // Scopes prédéfinis
  scopes: {
    // Notifications envoyées
    sent: {
      where: { status: 'sent' }
    },

    // Notifications cliquées
    clicked: {
      where: { status: 'clicked' }
    },

    // Notifications en échec
    failed: {
      where: { status: 'failed' }
    },

    // Notifications récentes (24h)
    recent: {
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    },

    // Notifications planifiées
    scheduled: {
      where: {
        status: 'pending',
        scheduled_at: { [Op.not]: null }
      }
    },

    // Notifications expirées
    expired: {
      where: {
        [Op.or]: [
          { status: 'expired' },
          {
            expires_at: { [Op.lt]: new Date() },
            status: { [Op.in]: ['pending', 'sending'] }
          }
        ]
      }
    },

    // Par type
    newWords: {
      where: { type: 'new_word' }
    },

    dailyWords: {
      where: { type: 'daily_word' }
    },

    achievements: {
      where: { type: 'achievement' }
    },

    // Par priorité
    highPriority: {
      where: { priority: ['high', 'urgent'] }
    },

    // Notifications interactives
    interactive: {
      where: {
        [Op.or]: [
          { require_interaction: true },
          { actions: { [Op.not]: null } }
        ]
      }
    }
  },

  // Hooks
  hooks: {
    // Définir expires_at par défaut
    beforeCreate: async (notification, options) => {
      if (!notification.expires_at) {
        // Expiration par défaut: 7 jours
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7);
        notification.expires_at = expirationDate;
      }

      // Capturer les infos du dispositif depuis l'abonnement
      if (notification.subscription_id && !notification.device_info) {
        try {
          const subscription = await sequelize.models.PushSubscription.findByPk(notification.subscription_id);
          if (subscription) {
            notification.device_info = {
              device_type: subscription.device_type,
              browser_name: subscription.browser_name,
              browser_version: subscription.browser_version,
              os_name: subscription.os_name
            };
            notification.language = subscription.language_preference !== 'auto' ? subscription.language_preference : null;
            notification.timezone = subscription.timezone;
          }
        } catch (error) {
          // Ignorer l'erreur si on ne peut pas récupérer les infos
        }
      }
    },

    // Marquer comme expirée si nécessaire
    beforeFind: async (options) => {
      // Auto-expirer les notifications anciennes lors des requêtes
      await PushNotification.update(
        { status: 'expired' },
        {
          where: {
            expires_at: { [Op.lt]: new Date() },
            status: { [Op.in]: ['pending', 'sending'] }
          }
        }
      );
    }
  }
});

// =============================================================================
// 🔗 ASSOCIATIONS
// =============================================================================

PushNotification.associate = function(models) {
  // Abonnement destinataire
  PushNotification.belongsTo(models.PushSubscription, {
    foreignKey: 'subscription_id',
    as: 'subscription',
    onDelete: 'CASCADE'
  });

  // Campagne liée (optionnel)
  PushNotification.belongsTo(models.NewsletterCampaign, {
    foreignKey: 'campaign_id',
    as: 'campaign',
    onDelete: 'SET NULL'
  });
};

// =============================================================================
// 🛠️ MÉTHODES D'INSTANCE
// =============================================================================

// 📤 Marquer comme envoyée
PushNotification.prototype.markAsSent = async function() {
  this.status = 'sent';
  this.sent_at = new Date();
  await this.save(['status', 'sent_at']);
};

// 📬 Marquer comme livrée
PushNotification.prototype.markAsDelivered = async function() {
  this.status = 'delivered';
  this.delivered_at = new Date();
  await this.save(['status', 'delivered_at']);
};

// 👆 Marquer comme cliquée
PushNotification.prototype.markAsClicked = async function() {
  this.status = 'clicked';
  this.clicked_at = new Date();
  await this.save(['status', 'clicked_at']);
  
  // Mettre à jour les stats de l'abonnement
  if (this.subscription_id) {
    try {
      const subscription = await sequelize.models.PushSubscription.findByPk(this.subscription_id);
      if (subscription) {
        await subscription.recordNotificationClicked();
      }
    } catch (error) {
      // Ignorer l'erreur
    }
  }
};

// 🚫 Marquer comme rejetée
PushNotification.prototype.markAsDismissed = async function() {
  this.status = 'dismissed';
  this.dismissed_at = new Date();
  await this.save(['status', 'dismissed_at']);
};

// ❌ Marquer comme échouée
PushNotification.prototype.markAsFailed = async function(errorMessage, errorCode = null) {
  this.status = 'failed';
  this.error_message = errorMessage;
  this.error_code = errorCode;
  this.retry_count += 1;
  await this.save(['status', 'error_message', 'error_code', 'retry_count']);
};

// 🔄 Vérifier si on peut réessayer
PushNotification.prototype.canRetry = function() {
  return this.status === 'failed' && 
         this.retry_count < this.max_retries &&
         (!this.expires_at || this.expires_at > new Date());
};

// ⏱️ Vérifier si expirée
PushNotification.prototype.isExpired = function() {
  return this.expires_at && this.expires_at <= new Date();
};

// 📊 Calculer le temps de réponse (envoi -> clic)
PushNotification.prototype.getResponseTime = function() {
  if (!this.sent_at || !this.clicked_at) return null;
  return this.clicked_at - this.sent_at; // en millisecondes
};

// 🎯 Vérifier si la notification est interactive
PushNotification.prototype.isInteractive = function() {
  return this.require_interaction || (this.actions && this.actions.length > 0);
};

// =============================================================================
// 🏭 MÉTHODES DE CLASSE (STATIQUES)
// =============================================================================

// 📊 Obtenir les statistiques globales
PushNotification.getOverallStats = async function(dateRange = null) {
  let whereClause = {};
  
  if (dateRange) {
    whereClause.created_at = {
      [Op.between]: [dateRange.start, dateRange.end]
    };
  }

  const stats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', '*'), 'total_notifications'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'sent\' THEN 1 ELSE 0 END')), 'sent_count'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'delivered\' THEN 1 ELSE 0 END')), 'delivered_count'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'clicked\' THEN 1 ELSE 0 END')), 'clicked_count'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'failed\' THEN 1 ELSE 0 END')), 'failed_count'],
      [sequelize.fn('AVG', sequelize.literal('CASE WHEN clicked_at IS NOT NULL AND sent_at IS NOT NULL THEN EXTRACT(EPOCH FROM (clicked_at - sent_at)) ELSE NULL END')), 'avg_response_time']
    ],
    where: whereClause,
    raw: true
  });

  const result = stats[0];
  
  return {
    total: parseInt(result.total_notifications) || 0,
    sent: parseInt(result.sent_count) || 0,
    delivered: parseInt(result.delivered_count) || 0,
    clicked: parseInt(result.clicked_count) || 0,
    failed: parseInt(result.failed_count) || 0,
    delivery_rate: result.sent_count > 0 ? Math.round((result.sent_count / result.total_notifications) * 100) : 0,
    click_rate: result.sent_count > 0 ? Math.round((result.clicked_count / result.sent_count) * 100) : 0,
    avg_response_time_seconds: result.avg_response_time ? Math.round(result.avg_response_time) : null
  };
};

// 📈 Statistiques par type de notification
PushNotification.getStatsByType = async function(dateRange = null) {
  let whereClause = {};
  
  if (dateRange) {
    whereClause.created_at = {
      [Op.between]: [dateRange.start, dateRange.end]
    };
  }

  return await this.findAll({
    attributes: [
      'type',
      [sequelize.fn('COUNT', '*'), 'total'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'clicked\' THEN 1 ELSE 0 END')), 'clicked'],
      [sequelize.fn('AVG', sequelize.literal('CASE WHEN clicked_at IS NOT NULL AND sent_at IS NOT NULL THEN EXTRACT(EPOCH FROM (clicked_at - sent_at)) ELSE NULL END')), 'avg_response_time']
    ],
    where: whereClause,
    group: ['type'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']],
    raw: true
  });
};

// 📱 Statistiques par dispositif
PushNotification.getStatsByDevice = async function() {
  return await this.findAll({
    attributes: [
      [sequelize.literal("device_info->>'device_type'"), 'device_type'],
      [sequelize.fn('COUNT', '*'), 'total'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'clicked\' THEN 1 ELSE 0 END')), 'clicked']
    ],
    where: {
      device_info: { [Op.not]: null },
      status: { [Op.in]: ['sent', 'delivered', 'clicked'] }
    },
    group: [sequelize.literal("device_info->>'device_type'")],
    raw: true
  });
};

// 🔍 Trouver les notifications à réessayer
PushNotification.findRetryable = function() {
  return this.findAll({
    where: {
      status: 'failed',
      retry_count: { [Op.lt]: sequelize.col('max_retries') },
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    },
    order: [['created_at', 'ASC']]
  });
};

// ⏰ Trouver les notifications planifiées prêtes
PushNotification.findScheduledReady = function() {
  return this.findAll({
    where: {
      status: 'pending',
      scheduled_at: { [Op.lte]: new Date() },
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    },
    order: [['scheduled_at', 'ASC']]
  });
};

// 📊 Analyser les performances par heure
PushNotification.getHourlyPerformance = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.findAll({
    attributes: [
      [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM sent_at')), 'hour'],
      [sequelize.fn('COUNT', '*'), 'total_sent'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'clicked\' THEN 1 ELSE 0 END')), 'total_clicked'],
      [sequelize.fn('AVG', sequelize.literal('CASE WHEN clicked_at IS NOT NULL AND sent_at IS NOT NULL THEN EXTRACT(EPOCH FROM (clicked_at - sent_at)) ELSE NULL END')), 'avg_response_time']
    ],
    where: {
      sent_at: { [Op.gte]: startDate },
      status: { [Op.in]: ['sent', 'delivered', 'clicked'] }
    },
    group: [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM sent_at'))],
    order: [[sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM sent_at')), 'ASC']],
    raw: true
  });
};

// 🏆 Trouver les notifications les plus performantes
PushNotification.findTopPerforming = function(limit = 10, type = null) {
  let whereClause = {
    status: { [Op.in]: ['sent', 'delivered', 'clicked'] }
  };

  if (type) {
    whereClause.type = type;
  }

  return this.findAll({
    attributes: [
      'id', 'title', 'type', 'sent_at', 'clicked_at',
      [sequelize.literal('CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END'), 'clicked']
    ],
    where: whereClause,
    order: [
      [sequelize.literal('CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END'), 'DESC'],
      ['sent_at', 'DESC']
    ],
    limit
  });
};

// 🧹 Nettoyer les anciennes notifications
PushNotification.cleanupOld = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await this.destroy({
    where: {
      created_at: { [Op.lt]: cutoffDate },
      status: { [Op.in]: ['delivered', 'clicked', 'dismissed', 'failed', 'expired'] }
    }
  });
};

// 📊 Obtenir le taux d'engagement par période
PushNotification.getEngagementTrends = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('sent_at')), 'date'],
      [sequelize.fn('COUNT', '*'), 'total_sent'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'clicked\' THEN 1 ELSE 0 END')), 'total_clicked'],
      [sequelize.literal('ROUND((SUM(CASE WHEN status = \'clicked\' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2)'), 'click_rate']
    ],
    where: {
      sent_at: { [Op.gte]: startDate },
      status: { [Op.in]: ['sent', 'delivered', 'clicked'] }
    },
    group: [sequelize.fn('DATE', sequelize.col('sent_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('sent_at')), 'ASC']],
    raw: true
  });
};

// 🎯 Analyser les préférences de contenu
PushNotification.getContentPreferences = async function() {
  return await this.findAll({
    attributes: [
      'type',
      [sequelize.fn('COUNT', '*'), 'total_sent'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'clicked\' THEN 1 ELSE 0 END')), 'total_clicked'],
      [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'dismissed\' THEN 1 ELSE 0 END')), 'total_dismissed'],
      [sequelize.literal('ROUND((SUM(CASE WHEN status = \'clicked\' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)), 2)'), 'engagement_rate']
    ],
    where: {
      status: { [Op.in]: ['sent', 'delivered', 'clicked', 'dismissed'] }
    },
    group: ['type'],
    order: [[sequelize.literal('engagement_rate'), 'DESC']],
    raw: true
  });
};

module.exports = PushNotification;