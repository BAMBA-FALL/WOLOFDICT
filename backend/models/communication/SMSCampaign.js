// =============================================================================
// 📊 WOLOFDICT - MODÈLE SMSCAMPAIGN
// Gestion des campagnes SMS en masse avec planification et statistiques
// =============================================================================

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SMSCampaign = sequelize.define('SMSCampaign', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    
    // Informations de base
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // Contenu du message
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 160] // SMS standard
      }
    },
    
    // Statut de la campagne
    status: {
      type: DataTypes.ENUM('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled', 'paused'),
      defaultValue: 'draft',
      allowNull: false
    },
    
    // Planification
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    send_started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    send_completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Ciblage
    target_audience: {
      type: DataTypes.ENUM('all', 'country', 'language', 'frequency', 'engagement', 'custom'),
      defaultValue: 'all',
      allowNull: false
    },
    
    audience_filters: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    },
    
    // Statistiques
    recipients_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    sent_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    delivered_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    failed_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    bounced_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    
    // Coût total
    total_cost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    },
    
    estimated_cost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false
    },
    
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'EUR',
      allowNull: false
    },
    
    // Configuration d'envoi
    send_rate_limit: {
      type: DataTypes.INTEGER,
      defaultValue: 60, // Messages par minute
      allowNull: false
    },
    
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      allowNull: false
    },
    
    provider_preference: {
      type: DataTypes.STRING(50),
      allowNull: true // null = utiliser le provider par défaut
    },
    
    // Créateur et permissions
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Campagne récurrente
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    
    recurrence_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidRecurrence(value) {
          if (this.is_recurring && !value) {
            throw new Error('Configuration de récurrence requise pour les campagnes récurrentes');
          }
        }
      }
    },
    
    next_run_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    
    // Gestion d'erreurs
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
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
    
    // Tags et métadonnées
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: false
    },
    
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false
    },
    
    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'sms_campaigns',
    timestamps: true,
    paranoid: true, // Support soft delete
    
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['scheduled_at']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['target_audience']
      },
      {
        fields: ['is_recurring', 'next_run_at']
      },
      {
        fields: ['send_started_at']
      },
      {
        using: 'gin',
        fields: ['audience_filters']
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
      beforeCreate: async (campaign, options) => {
        // Valider le message selon le type
        if (campaign.message && campaign.message.length > 160) {
          // Vérifier si c'est autorisé pour ce type de campagne
          const allowLongMessage = campaign.metadata?.allow_long_message || false;
          if (!allowLongMessage) {
            throw new Error('Message trop long pour un SMS standard (160 caractères max)');
          }
        }
      },
      
      beforeUpdate: async (campaign, options) => {
        // Mettre à jour les métriques calculées
        if (campaign.changed('sent_count') || campaign.changed('delivered_count') || campaign.changed('failed_count')) {
          // Les getters calculeront automatiquement les taux
        }
        
        // Gérer la récurrence
        if (campaign.changed('status') && campaign.status === 'sent' && campaign.is_recurring) {
          await campaign.scheduleNextRun();
        }
      }
    }
  });

  // =============================================================================
  // 🔧 MÉTHODES D'INSTANCE
  // =============================================================================

  SMSCampaign.prototype.getDeliveryRate = function() {
    if (this.sent_count === 0) return 0;
    return Math.round((this.delivered_count / this.sent_count) * 100);
  };

  SMSCampaign.prototype.getFailureRate = function() {
    if (this.sent_count === 0) return 0;
    return Math.round((this.failed_count / this.sent_count) * 100);
  };

  SMSCampaign.prototype.getBounceRate = function() {
    if (this.sent_count === 0) return 0;
    return Math.round((this.bounced_count / this.sent_count) * 100);
  };

  SMSCampaign.prototype.getSuccessRate = function() {
    if (this.recipients_count === 0) return 0;
    return Math.round((this.delivered_count / this.recipients_count) * 100);
  };

  SMSCampaign.prototype.getCostPerMessage = function() {
    if (this.sent_count === 0) return 0;
    return parseFloat((this.total_cost / this.sent_count).toFixed(4));
  };

  SMSCampaign.prototype.getCostPerDelivery = function() {
    if (this.delivered_count === 0) return 0;
    return parseFloat((this.total_cost / this.delivered_count).toFixed(4));
  };

  SMSCampaign.prototype.getDuration = function() {
    if (!this.send_started_at || !this.send_completed_at) return null;
    return this.send_completed_at.getTime() - this.send_started_at.getTime();
  };

  SMSCampaign.prototype.getDurationMinutes = function() {
    const duration = this.getDuration();
    return duration ? Math.round(duration / (1000 * 60)) : null;
  };

  SMSCampaign.prototype.canBeSent = function() {
    return ['draft', 'scheduled'].includes(this.status) && 
           this.message && 
           this.recipients_count > 0;
  };

  SMSCampaign.prototype.canBeEdited = function() {
    return ['draft', 'scheduled'].includes(this.status);
  };

  SMSCampaign.prototype.canBeCancelled = function() {
    return ['scheduled', 'sending'].includes(this.status);
  };

  SMSCampaign.prototype.isScheduledForSending = function() {
    return this.status === 'scheduled' && 
           this.scheduled_at && 
           new Date() >= this.scheduled_at;
  };

  SMSCampaign.prototype.markAsStarted = async function() {
    await this.update({
      status: 'sending',
      send_started_at: new Date()
    });
  };

  SMSCampaign.prototype.markAsCompleted = async function() {
    await this.update({
      status: 'sent',
      send_completed_at: new Date()
    });
  };

  SMSCampaign.prototype.markAsFailed = async function(errorMessage = null) {
    await this.update({
      status: 'failed',
      error_message: errorMessage,
      send_completed_at: new Date()
    });
  };

  SMSCampaign.prototype.pause = async function() {
    if (this.status === 'sending') {
      await this.update({ status: 'paused' });
    }
  };

  SMSCampaign.prototype.resume = async function() {
    if (this.status === 'paused') {
      await this.update({ status: 'sending' });
    }
  };

  SMSCampaign.prototype.cancel = async function() {
    if (this.canBeCancelled()) {
      await this.update({ 
        status: 'cancelled',
        send_completed_at: new Date()
      });
    }
  };

  SMSCampaign.prototype.duplicate = async function(newName = null) {
    const duplicateData = {
      name: newName || `${this.name} (Copie)`,
      description: this.description,
      message: this.message,
      target_audience: this.target_audience,
      audience_filters: this.audience_filters,
      send_rate_limit: this.send_rate_limit,
      priority: this.priority,
      provider_preference: this.provider_preference,
      tags: [...this.tags],
      metadata: { ...this.metadata },
      created_by: this.created_by,
      status: 'draft'
    };

    return await SMSCampaign.create(duplicateData);
  };

  SMSCampaign.prototype.scheduleNextRun = async function() {
    if (!this.is_recurring || !this.recurrence_config) return;

    const { frequency, interval = 1 } = this.recurrence_config;
    const nextRun = new Date();

    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + interval);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 * interval));
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + interval);
        break;
      case 'yearly':
        nextRun.setFullYear(nextRun.getFullYear() + interval);
        break;
    }

    await this.update({ next_run_at: nextRun });
  };

  SMSCampaign.prototype.updateRecipientCount = async function(count) {
    await this.update({ recipients_count: count });
  };

  SMSCampaign.prototype.updateCost = async function(additionalCost) {
    await this.update({ 
      total_cost: parseFloat(this.total_cost) + parseFloat(additionalCost)
    });
  };

  SMSCampaign.prototype.incrementSentCount = async function(count = 1) {
    await this.update({ 
      sent_count: this.sent_count + count 
    });
  };

  SMSCampaign.prototype.incrementDeliveredCount = async function(count = 1) {
    await this.update({ 
      delivered_count: this.delivered_count + count 
    });
  };

  SMSCampaign.prototype.incrementFailedCount = async function(count = 1) {
    await this.update({ 
      failed_count: this.failed_count + count 
    });
  };

  SMSCampaign.prototype.addTag = async function(tag) {
    if (!this.tags.includes(tag)) {
      await this.update({
        tags: [...this.tags, tag]
      });
    }
  };

  SMSCampaign.prototype.removeTag = async function(tag) {
    await this.update({
      tags: this.tags.filter(t => t !== tag)
    });
  };

  SMSCampaign.prototype.approve = async function(approvedByUserId) {
    await this.update({
      approved_by: approvedByUserId,
      approved_at: new Date()
    });
  };

  // =============================================================================
  // 🔧 MÉTHODES DE CLASSE
  // =============================================================================

  SMSCampaign.findReadyToSend = function() {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        status: 'scheduled',
        scheduled_at: { [Op.lte]: new Date() }
      },
      order: [['scheduled_at', 'ASC']]
    });
  };

  SMSCampaign.findRecurringDue = function() {
    const { Op } = require('sequelize');
    return this.findAll({
      where: {
        is_recurring: true,
        status: 'sent',
        next_run_at: { [Op.lte]: new Date() }
      },
      order: [['next_run_at', 'ASC']]
    });
  };

  SMSCampaign.findByStatus = function(status, options = {}) {
    return this.findAll({
      where: { 
        status,
        ...options.where 
      },
      ...options
    });
  };

  SMSCampaign.findByCreator = function(userId, options = {}) {
    return this.findAll({
      where: { 
        created_by: userId,
        ...options.where 
      },
      order: [['created_at', 'DESC']],
      ...options
    });
  };

  SMSCampaign.getPerformanceStats = async function(startDate, endDate = new Date()) {
    const { Op } = require('sequelize');
    return await this.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', '*'), 'campaign_count'],
        [sequelize.fn('SUM', 'recipients_count'), 'total_recipients'],
        [sequelize.fn('SUM', 'sent_count'), 'total_sent'],
        [sequelize.fn('SUM', 'delivered_count'), 'total_delivered'],
        [sequelize.fn('SUM', 'failed_count'), 'total_failed'],
        [sequelize.fn('SUM', 'total_cost'), 'total_cost'],
        [sequelize.fn('AVG', sequelize.literal('(delivered_count * 100.0 / NULLIF(sent_count, 0))')), 'avg_delivery_rate']
      ],
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['status'],
      raw: true
    });
  };

  SMSCampaign.getTotalStats = async function() {
    return await this.findAll({
      attributes: [
        [sequelize.fn('COUNT', '*'), 'total_campaigns'],
        [sequelize.fn('SUM', 'recipients_count'), 'total_recipients'],
        [sequelize.fn('SUM', 'sent_count'), 'total_sent'],
        [sequelize.fn('SUM', 'delivered_count'), 'total_delivered'],
        [sequelize.fn('SUM', 'failed_count'), 'total_failed'],
        [sequelize.fn('SUM', 'total_cost'), 'total_cost']
      ],
      raw: true
    });
  };

  SMSCampaign.findExpiredDrafts = function(daysOld = 30) {
    const { Op } = require('sequelize');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.findAll({
      where: {
        status: 'draft',
        created_at: { [Op.lt]: cutoffDate }
      }
    });
  };

  SMSCampaign.cleanupOldCampaigns = async function(daysOld = 365) {
    const { Op } = require('sequelize');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return await this.destroy({
      where: {
        status: { [Op.in]: ['sent', 'failed', 'cancelled'] },
        created_at: { [Op.lt]: cutoffDate }
      },
      force: true // Hard delete pour les anciennes campagnes
    });
  };

  // =============================================================================
  // 🔗 ASSOCIATIONS
  // =============================================================================

  SMSCampaign.associate = function(models) {
    // Association avec User (créateur)
    if (models.User) {
      SMSCampaign.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
      
      SMSCampaign.belongsTo(models.User, {
        foreignKey: 'approved_by',
        as: 'approver'
      });
    }
    
    // Association avec SMSMessage
    SMSCampaign.hasMany(models.SMSMessage, {
      foreignKey: 'campaign_id',
      sourceKey: 'id',
      as: 'messages'
    });
  };

  return SMSCampaign;
};