// =============================================================================
// 📨 WOLOFDICT - MODÈLE SMSMESSAGE
// Tracking complet des messages SMS avec retry et webhooks
// =============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SMSMessage = sequelize.define('SMSMessage', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Identifiant du message chez le fournisseur
    message_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    
    // Destinataire
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    
    // Référence à l'abonnement (optionnel)
    subscription_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'SMSSubscriptions',
        key: 'id'
      }
    },
    
    // Contenu du message
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1600] // Maximum pour SMS concat
      }
    },
    
    // Type de message
    type: {
      type: DataTypes.ENUM(
        'verification', 'notification', 'daily_word', 
        'new_word', 'reminder', 'campaign', 'system', 'emergency'
      ),
      defaultValue: 'notification',
      allowNull: false
    },
    
    // Statut du message
    status: {
      type: DataTypes.ENUM('queued', 'sent', 'delivered', 'failed', 'unknown'),
      defaultValue: 'queued',
      allowNull: false
    },
    
    // Priorité
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      allowNull: false
    },
    
    // Fournisseur utilisé
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    
    // Informations de coût et facturation
    cost: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true
    },
    
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR',
      allowNull: true
    },
    
    // Timestamps détaillés
    sent_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    failed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Informations d'erreur
    error_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Informations de retry
    retry_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    max_retries: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      allowNull: false
    },
    
    next_retry_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Webhook et tracking
    webhook_received_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    webhook_data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    
    // Métadonnées
    campaign_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    
    // Segmentation et tags
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false
    },
    
    // Données additionnelles
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    }
  }, {
    tableName: 'sms_messages',
    timestamps: true,
    paranoid: false,
    
    indexes: [
      {
        unique: true,
        fields: ['message_id']
      },
      {
        fields: ['phone_number']
      },
      {
        fields: ['subscription_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['type']
      },
      {
        fields: ['sent_at']
      },
      {
        fields: ['priority', 'status']
      },
      {
        fields: ['campaign_id']
      },
      {
        fields: ['provider']
      },
      {
        fields: ['next_retry_at']
      },
      {
        using: 'gin',
        fields: ['tags']
      },
      {
        using: 'gin',
        fields: ['metadata']
      }
    ],
    
    hooks: {
      beforeUpdate: async (message, options) => {
        // Mettre à jour automatiquement les timestamps selon le statut
        if (message.changed('status')) {
          const now = new Date();
          
          switch (message.status) {
            case 'sent':
              if (!message.sent_at) message.sent_at = now;
              break;
            case 'delivered':
              if (!message.delivered_at) message.delivered_at = now;
              break;
            case 'failed':
              if (!message.failed_at) message.failed_at = now;
              break;
          }
        }
      },
      
      afterUpdate: async (message, options) => {
        // Mettre à jour les statistiques de l'abonnement
        if (message.subscription_id && message.changed('status')) {
          const subscription = await message.getSubscription();
          if (subscription) {
            switch (message.status) {
              case 'sent':
                await subscription.recordSMSSent();
                break;
              case 'delivered':
                await subscription.recordSMSDelivered();
                break;
            }
          }
        }
      }
    }
  });

  // =============================================================================
  // 🔧 MÉTHODES D'INSTANCE
  // =============================================================================

  SMSMessage.prototype.markAsSent = async function() {
    await this.update({
      status: 'sent',
      sent_at: new Date()
    });
  };

  SMSMessage.prototype.markAsDelivered = async function() {
    await this.update({
      status: 'delivered',
      delivered_at: new Date()
    });
  };

  SMSMessage.prototype.markAsFailed = async function(errorCode = null, errorMessage = null) {
    await this.update({
      status: 'failed',
      failed_at: new Date(),
      error_code: errorCode,
      error_message: errorMessage
    });
  };

  SMSMessage.prototype.canRetry = function() {
    return this.status === 'failed' && 
           this.retry_count < this.max_retries &&
           (!this.next_retry_at || new Date() >= this.next_retry_at);
  };

  SMSMessage.prototype.scheduleRetry = async function(delayMinutes = 5) {
    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + delayMinutes * (this.retry_count + 1)); // Délai exponentiel
    
    await this.update({
      retry_count: this.retry_count + 1,
      next_retry_at: nextRetry,
      status: 'queued'
    });
  };

  SMSMessage.prototype.getDeliveryTime = function() {
    if (!this.sent_at || !this.delivered_at) return null;
    return this.delivered_at.getTime() - this.sent_at.getTime();
  };

  SMSMessage.prototype.getDeliveryTimeSeconds = function() {
    const deliveryTime = this.getDeliveryTime();
    return deliveryTime ? Math.round(deliveryTime / 1000) : null;
  };

  SMSMessage.prototype.isExpired = function(expiryHours = 24) {
    if (!this.created_at) return false;
    const expiryTime = new Date(this.created_at.getTime() + expiryHours * 60 * 60 * 1000);
    return new Date() > expiryTime;
  };

  SMSMessage.prototype.updateWebhookData = async function(webhookData) {
    await this.update({
      webhook_data: {
        ...this.webhook_data,
        ...webhookData
      },
      webhook_received_at: new Date()
    });
  };

  SMSMessage.prototype.addTag = async function(tag) {
    if (!this.tags.includes(tag)) {
      await this.update({
        tags: [...this.tags, tag]
      });
    }
  };

  SMSMessage.prototype.removeTag = async function(tag) {
    await this.update({
      tags: this.tags.filter(t => t !== tag)
    });
  };

  // =============================================================================
  // 🔧 MÉTHODES DE CLASSE
  // =============================================================================

  SMSMessage.findPendingRetries = function() {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        status: 'failed',
        retry_count: { [Op.lt]: sequelize.col('max_retries') },
        [Op.or]: [
          { next_retry_at: null },
          { next_retry_at: { [Op.lte]: new Date() } }
        ]
      },
      order: [['priority', 'DESC'], ['created_at', 'ASC']]
    });
  };

  SMSMessage.findQueuedMessages = function(limit = 100) {
    return this.findAll({
      where: {
        status: 'queued'
      },
      order: [['priority', 'DESC'], ['created_at', 'ASC']],
      limit
    });
  };

  SMSMessage.getDeliveryStats = async function(startDate, endDate = new Date()) {
    const { Op } = require('sequelize');
    return await this.findAll({
      attributes: [
        'status',
        'provider',
        'type',
        [sequelize.fn('COUNT', '*'), 'count'],
        [sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM (delivered_at - sent_at))')), 'avg_delivery_time_seconds'],
        [sequelize.fn('SUM', 'cost'), 'total_cost'],
        [sequelize.fn('AVG', 'cost'), 'avg_cost']
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['status', 'provider', 'type'],
      raw: true
    });
  };

  SMSMessage.getProviderStats = async function(startDate, endDate = new Date()) {
    const { Op } = require('sequelize');
    return await this.findAll({
      attributes: [
        'provider',
        [sequelize.fn('COUNT', '*'), 'total_messages'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'delivered\' THEN 1 ELSE 0 END')), 'delivered'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = \'failed\' THEN 1 ELSE 0 END')), 'failed'],
        [sequelize.fn('SUM', 'cost'), 'total_cost'],
        [sequelize.fn('AVG', sequelize.literal('EXTRACT(EPOCH FROM (delivered_at - sent_at))')), 'avg_delivery_time']
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['provider'],
      raw: true
    });
  };

  SMSMessage.cleanupOldMessages = async function(daysOld = 90) {
    const { Op } = require('sequelize');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return await this.destroy({
      where: {
        created_at: { [Op.lt]: cutoffDate },
        status: { [Op.in]: ['delivered', 'failed'] }
      }
    });
  };

  SMSMessage.findByPhoneNumber = function(phoneNumber, options = {}) {
    return this.findAll({
      where: {
        phone_number: phoneNumber,
        ...options.where
      },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  SMSMessage.findByCampaign = function(campaignId, options = {}) {
    return this.findAll({
      where: {
        campaign_id: campaignId,
        ...options.where
      },
      order: [['created_at', 'ASC']],
      ...options
    });
  };

  SMSMessage.findExpiredMessages = function(expiryHours = 24) {
    const { Op } = require('sequelize');
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() - expiryHours);
    
    return this.findAll({
      where: {
        status: { [Op.in]: ['queued', 'failed'] },
        created_at: { [Op.lt]: expiryTime }
      }
    });
  };

  SMSMessage.getTotalCostByPeriod = async function(startDate, endDate = new Date()) {
    const { Op } = require('sequelize');
    const result = await this.findAll({
      attributes: [
        [sequelize.fn('SUM', 'cost'), 'total_cost'],
        [sequelize.fn('COUNT', '*'), 'total_messages'],
        [sequelize.fn('AVG', 'cost'), 'avg_cost_per_message']
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        },
        status: { [Op.ne]: 'failed' }
      },
      raw: true
    });
    
    return result[0] || { total_cost: 0, total_messages: 0, avg_cost_per_message: 0 };
  };

  // =============================================================================
  // 🔗 ASSOCIATIONS
  // =============================================================================

  SMSMessage.associate = function(models) {
    // Association avec SMSSubscription
    SMSMessage.belongsTo(models.SMSSubscription, {
      foreignKey: 'subscription_id',
      as: 'subscription'
    });
    
    // Association avec User
    if (models.User) {
      SMSMessage.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
    
    // Association avec SMSCampaign si elle existe
    if (models.SMSCampaign) {
      SMSMessage.belongsTo(models.SMSCampaign, {
        foreignKey: 'campaign_id',
        targetKey: 'id',
        as: 'campaign'
      });
    }
  };

  return SMSMessage;
};