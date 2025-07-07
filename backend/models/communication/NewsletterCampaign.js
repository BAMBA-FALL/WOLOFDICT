// =============================================================================
// 📨 NEWSLETTER CAMPAIGN MODEL - Campagnes newsletter
// File: backend/src/models/communication/NewsletterCampaign.js
// =============================================================================

const { DataTypes, Op } = require('sequelize');
const sequelize = require('../../config/database');

const NewsletterCampaign = sequelize.define('NewsletterCampaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 📝 Contenu de la campagne
  subject: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Sujet de l\'email'
  },
  
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
    comment: 'Contenu HTML de la newsletter'
  },
  
  preview_text: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Texte de prévisualisation (snippet)'
  },
  
  // 🎨 Template et données
  template_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'newsletter',
    comment: 'Nom du template utilisé'
  },
  
  template_data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Variables pour le template (JSON)'
  },
  
  // 📊 Statut et planification
  status: {
    type: DataTypes.ENUM(
      'draft',      // Brouillon
      'scheduled',  // Planifiée
      'sending',    // En cours d'envoi
      'sent',       // Envoyée
      'paused',     // Mise en pause
      'failed',     // Échec d'envoi
      'cancelled'   // Annulée
    ),
    allowNull: false,
    defaultValue: 'draft',
    comment: 'Statut de la campagne'
  },
  
  // 📅 Dates de gestion
  send_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date programmée d\'envoi'
  },
  
  send_started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de début d\'envoi réel'
  },
  
  send_completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fin d\'envoi'
  },
  
  // 👥 Ciblage d'audience
  target_audience: {
    type: DataTypes.ENUM(
      'all',           // Tous les abonnés actifs
      'premium',       // Abonnés premium uniquement
      'free',          // Abonnés gratuits uniquement
      'contributors',  // Contributeurs uniquement
      'engaged',       // Abonnés engagés (ouvrent les emails)
      'inactive',      // Abonnés inactifs
      'custom'         // Segmentation personnalisée
    ),
    allowNull: false,
    defaultValue: 'all',
    comment: 'Audience cible pour la campagne'
  },
  
  audience_filters: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Filtres personnalisés pour l\'audience (JSON)'
  },
  
  // 📊 Métriques d'envoi
  recipients_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de destinataires'
  },
  
  successful_sends: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Envois réussis'
  },
  
  failed_sends: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Envois échoués'
  },
  
  bounced_sends: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Emails rebondis'
  },
  
  // 📈 Métriques d'engagement
  total_opens: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre total d\'ouvertures'
  },
  
  unique_opens: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Ouvertures uniques'
  },
  
  total_clicks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre total de clics'
  },
  
  unique_clicks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Clics uniques'
  },
  
  unsubscribes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Désabonnements suite à cette campagne'
  },
  
  spam_complaints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Signalements spam'
  },
  
  // 👤 Métadonnées de création
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur créateur de la campagne'
  },
  
  // 🔗 Paramètres avancés
  from_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'WolofDict',
    comment: 'Nom de l\'expéditeur'
  },
  
  from_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Email de l\'expéditeur'
  },
  
  reply_to: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Adresse de réponse'
  },
  
  // 🏷️ Catégorisation
  campaign_type: {
    type: DataTypes.ENUM(
      'newsletter',     // Newsletter régulière
      'announcement',   // Annonce spéciale
      'welcome',        // Email de bienvenue
      'product_update', // Mise à jour produit
      'event',          // Événement
      'educational',    // Contenu éducatif
      'promotion'       // Promotion/offre
    ),
    allowNull: false,
    defaultValue: 'newsletter',
    comment: 'Type de campagne'
  },
  
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Tags pour organisation'
  },
  
  // 🧪 Tests A/B
  ab_test_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Test A/B activé'
  },
  
  ab_test_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuration du test A/B'
  },
  
  // 📝 Notes et erreurs
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes administratives'
  },
  
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message d\'erreur en cas d\'échec'
  },
  
  // 🔄 Récurrence (pour newsletters automatiques)
  is_recurring: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Campagne récurrente'
  },
  
  recurrence_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuration de récurrence'
  },
  
  next_send_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Prochain envoi pour campagnes récurrentes'
  }
  
}, {
  tableName: 'newsletter_campaigns',
  timestamps: true,
  paranoid: true, // Soft delete pour garder l'historique
  
  indexes: [
    // Index principaux
    { fields: ['status'] },
    { fields: ['created_by'] },
    { fields: ['campaign_type'] },
    { fields: ['target_audience'] },
    
    // Index pour planification
    { fields: ['send_at'] },
    { fields: ['next_send_at'] },
    { fields: ['is_recurring'] },
    
    // Index pour analytics
    { fields: ['send_completed_at'] },
    { fields: ['status', 'send_completed_at'] },
    { fields: ['created_at', 'status'] },
    
    // Index composés
    { fields: ['status', 'send_at'] },
    { fields: ['campaign_type', 'status'] },
    { fields: ['target_audience', 'status'] }
  ],
  
  // Scopes prédéfinis
  scopes: {
    // Brouillons
    drafts: {
      where: { status: 'draft' }
    },
    
    // Campagnes planifiées
    scheduled: {
      where: { status: 'scheduled' }
    },
    
    // Campagnes envoyées
    sent: {
      where: { status: 'sent' }
    },
    
    // Campagnes en cours
    sending: {
      where: { status: 'sending' }
    },
    
    // Campagnes récentes (30 derniers jours)
    recent: {
      where: {
        created_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    },
    
    // Campagnes performantes (taux d'ouverture > 25%)
    highPerforming: {
      where: sequelize.where(
        sequelize.literal('(unique_opens * 100.0 / NULLIF(successful_sends, 0))'),
        { [Op.gt]: 25 }
      )
    },
    
    // Campagnes récurrentes
    recurring: {
      where: { is_recurring: true }
    },
    
    // Par type
    newsletters: {
      where: { campaign_type: 'newsletter' }
    },
    
    announcements: {
      where: { campaign_type: 'announcement' }
    }
  },
  
  // Hooks
  hooks: {
    // Définir from_email par défaut
    beforeCreate: async (campaign, options) => {
      if (!campaign.from_email) {
        campaign.from_email = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@wolofdict.com';
      }
      if (!campaign.reply_to) {
        campaign.reply_to = campaign.from_email;
      }
    },
    
    // Calculer next_send_at pour campagnes récurrentes
    afterUpdate: async (campaign, options) => {
      if (campaign.changed('status') && campaign.status === 'sent' && campaign.is_recurring) {
        // Calculer la prochaine date d'envoi
        const config = campaign.recurrence_config || {};
        const interval = config.interval || 'weekly';
        
        let nextSend = new Date();
        switch (interval) {
          case 'daily':
            nextSend.setDate(nextSend.getDate() + 1);
            break;
          case 'weekly':
            nextSend.setDate(nextSend.getDate() + 7);
            break;
          case 'monthly':
            nextSend.setMonth(nextSend.getMonth() + 1);
            break;
        }
        
        await campaign.update({ next_send_at: nextSend }, { hooks: false });
      }
    }
  }
});

// =============================================================================
// 🔗 ASSOCIATIONS
// =============================================================================

NewsletterCampaign.associate = function(models) {
  // Créateur de la campagne
  NewsletterCampaign.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'creator',
    onDelete: 'RESTRICT'
  });
  
  // Relation avec les abonnés (envois)
  NewsletterCampaign.belongsToMany(models.NewsletterSubscription, {
    through: 'newsletter_campaign_sends',
    foreignKey: 'campaign_id',
    otherKey: 'subscription_id',
    as: 'subscribers'
  });
};

// =============================================================================
// 🛠️ MÉTHODES D'INSTANCE
// =============================================================================

NewsletterCampaign.prototype.getOpenRate = function() {
  if (this.successful_sends === 0) return 0;
  return Math.round((this.unique_opens / this.successful_sends) * 100);
};

NewsletterCampaign.prototype.getClickRate = function() {
  if (this.unique_opens === 0) return 0;
  return Math.round((this.unique_clicks / this.unique_opens) * 100);
};

NewsletterCampaign.prototype.getClickToOpenRate = function() {
  if (this.unique_opens === 0) return 0;
  return Math.round((this.unique_clicks / this.unique_opens) * 100);
};

NewsletterCampaign.prototype.getBounceRate = function() {
  if (this.recipients_count === 0) return 0;
  return Math.round((this.bounced_sends / this.recipients_count) * 100);
};

NewsletterCampaign.prototype.getUnsubscribeRate = function() {
  if (this.successful_sends === 0) return 0;
  return Math.round((this.unsubscribes / this.successful_sends) * 100);
};

NewsletterCampaign.prototype.getDeliveryRate = function() {
  if (this.recipients_count === 0) return 0;
  return Math.round((this.successful_sends / this.recipients_count) * 100);
};

NewsletterCampaign.prototype.getEngagementScore = function() {
  // Score d'engagement basé sur ouvertures et clics
  const openWeight = 0.7;
  const clickWeight = 0.3;
  
  const openScore = this.getOpenRate() * openWeight;
  const clickScore = this.getClickRate() * this.successful_sends / 100 * clickWeight;
  
  return Math.round(openScore + clickScore);
};

NewsletterCampaign.prototype.canBeSent = function() {
  return ['draft', 'scheduled'].includes(this.status) && this.subject && this.content;
};

NewsletterCampaign.prototype.canBeEdited = function() {
  return ['draft', 'scheduled'].includes(this.status);
};

NewsletterCampaign.prototype.isScheduledForSending = function() {
  return this.status === 'scheduled' && 
         this.send_at && 
         new Date() >= this.send_at;
};

NewsletterCampaign.prototype.getPerformanceMetrics = function() {
  return {
    delivery_rate: this.getDeliveryRate(),
    open_rate: this.getOpenRate(),
    click_rate: this.getClickRate(),
    click_to_open_rate: this.getClickToOpenRate(),
    bounce_rate: this.getBounceRate(),
    unsubscribe_rate: this.getUnsubscribeRate(),
    engagement_score: this.getEngagementScore(),
    recipients: this.recipients_count,
    successful_sends: this.successful_sends,
    unique_opens: this.unique_opens,
    unique_clicks: this.unique_clicks,
    total_opens: this.total_opens,
    total_clicks: this.total_clicks,
    bounced_sends: this.bounced_sends,
    failed_sends: this.failed_sends,
    unsubscribes: this.unsubscribes,
    spam_complaints: this.spam_complaints
  };
};

// 🎯 Vérifier si la campagne est prête pour envoi automatique
NewsletterCampaign.prototype.isReadyForAutoSend = function() {
  return this.isScheduledForSending() && this.canBeSent();
};

// 📊 Calculer le ROI approximatif (si on a des données de conversion)
NewsletterCampaign.prototype.calculateROI = function(conversionRate = 0, averageOrderValue = 0) {
  if (!conversionRate || !averageOrderValue) return null;
  
  const conversions = Math.round(this.unique_clicks * (conversionRate / 100));
  const revenue = conversions * averageOrderValue;
  
  return {
    conversions,
    revenue,
    cost_per_conversion: conversions > 0 ? Math.round(revenue / conversions) : 0,
    roi_percentage: Math.round(((revenue - this.estimatedCost()) / this.estimatedCost()) * 100)
  };
};

// 💰 Estimation du coût de la campagne
NewsletterCampaign.prototype.estimatedCost = function() {
  // Coût estimé : 0.001€ par email envoyé (approximation)
  const costPerEmail = 0.001;
  return Math.round(this.successful_sends * costPerEmail * 100) / 100;
};

// 🔄 Dupliquer une campagne pour réutilisation
NewsletterCampaign.prototype.duplicate = async function(newSubject = null) {
  const duplicateData = {
    subject: newSubject || `[COPIE] ${this.subject}`,
    content: this.content,
    preview_text: this.preview_text,
    template_name: this.template_name,
    template_data: this.template_data,
    target_audience: this.target_audience,
    audience_filters: this.audience_filters,
    campaign_type: this.campaign_type,
    from_name: this.from_name,
    from_email: this.from_email,
    reply_to: this.reply_to,
    tags: [...(this.tags || []), 'duplicate'],
    created_by: this.created_by,
    // Réinitialiser les métriques et dates
    status: 'draft',
    send_at: null,
    send_started_at: null,
    send_completed_at: null,
    recipients_count: 0,
    successful_sends: 0,
    failed_sends: 0,
    bounced_sends: 0,
    total_opens: 0,
    unique_opens: 0,
    total_clicks: 0,
    unique_clicks: 0,
    unsubscribes: 0,
    spam_complaints: 0,
    is_recurring: false,
    recurrence_config: null,
    next_send_at: null
  };

  return await NewsletterCampaign.create(duplicateData);
};

// 📈 Comparer avec une autre campagne
NewsletterCampaign.prototype.compareWith = function(otherCampaign) {
  return {
    campaign1: {
      id: this.id,
      subject: this.subject,
      metrics: this.getPerformanceMetrics()
    },
    campaign2: {
      id: otherCampaign.id,
      subject: otherCampaign.subject,
      metrics: otherCampaign.getPerformanceMetrics()
    },
    comparison: {
      open_rate_diff: this.getOpenRate() - otherCampaign.getOpenRate(),
      click_rate_diff: this.getClickRate() - otherCampaign.getClickRate(),
      engagement_diff: this.getEngagementScore() - otherCampaign.getEngagementScore(),
      better_performer: this.getEngagementScore() > otherCampaign.getEngagementScore() ? 'campaign1' : 'campaign2'
    }
  };
};

// =============================================================================
// 🏭 MÉTHODES DE CLASSE (STATIQUES)
// =============================================================================

// 📊 Obtenir les statistiques globales des campagnes
NewsletterCampaign.getOverallStats = async function() {
  const stats = await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', '*'), 'total_campaigns'],
      [sequelize.fn('SUM', sequelize.col('recipients_count')), 'total_recipients'],
      [sequelize.fn('SUM', sequelize.col('successful_sends')), 'total_sends'],
      [sequelize.fn('SUM', sequelize.col('unique_opens')), 'total_opens'],
      [sequelize.fn('SUM', sequelize.col('unique_clicks')), 'total_clicks'],
      [sequelize.fn('AVG', sequelize.literal('(unique_opens * 100.0 / NULLIF(successful_sends, 0))')), 'avg_open_rate'],
      [sequelize.fn('AVG', sequelize.literal('(unique_clicks * 100.0 / NULLIF(unique_opens, 0))')), 'avg_click_rate']
    ],
    where: {
      status: 'sent'
    },
    raw: true
  });

  return stats[0];
};

// 🏆 Trouver les campagnes les plus performantes
NewsletterCampaign.findTopPerforming = function(limit = 10, metric = 'engagement') {
  let orderBy;
  
  switch (metric) {
    case 'open_rate':
      orderBy = sequelize.literal('(unique_opens * 100.0 / NULLIF(successful_sends, 0)) DESC');
      break;
    case 'click_rate':
      orderBy = sequelize.literal('(unique_clicks * 100.0 / NULLIF(unique_opens, 0)) DESC');
      break;
    case 'engagement':
    default:
      orderBy = sequelize.literal('((unique_opens * 70.0 / NULLIF(successful_sends, 0)) + (unique_clicks * 30.0 / NULLIF(unique_opens, 0))) DESC');
      break;
  }

  return this.findAll({
    where: {
      status: 'sent',
      successful_sends: { [Op.gt]: 0 }
    },
    order: [orderBy],
    limit
  });
};

// 📅 Trouver les campagnes planifiées prêtes à être envoyées
NewsletterCampaign.findReadyToSend = function() {
  return this.findAll({
    where: {
      status: 'scheduled',
      send_at: { [Op.lte]: new Date() }
    },
    order: [['send_at', 'ASC']]
  });
};

// 🔄 Trouver les campagnes récurrentes prêtes
NewsletterCampaign.findRecurringReady = function() {
  return this.findAll({
    where: {
      is_recurring: true,
      status: 'sent',
      next_send_at: { [Op.lte]: new Date() }
    },
    order: [['next_send_at', 'ASC']]
  });
};

// 📈 Analyser les tendances par période
NewsletterCampaign.getTrendsByPeriod = async function(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.findAll({
    attributes: [
      [sequelize.fn('DATE', sequelize.col('send_completed_at')), 'date'],
      [sequelize.fn('COUNT', '*'), 'campaigns_count'],
      [sequelize.fn('SUM', sequelize.col('recipients_count')), 'total_recipients'],
      [sequelize.fn('AVG', sequelize.literal('(unique_opens * 100.0 / NULLIF(successful_sends, 0))')), 'avg_open_rate'],
      [sequelize.fn('AVG', sequelize.literal('(unique_clicks * 100.0 / NULLIF(unique_opens, 0))')), 'avg_click_rate']
    ],
    where: {
      status: 'sent',
      send_completed_at: { [Op.gte]: startDate }
    },
    group: [sequelize.fn('DATE', sequelize.col('send_completed_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('send_completed_at')), 'ASC']],
    raw: true
  });
};

// 🎯 Analyser les performances par audience
NewsletterCampaign.getPerformanceByAudience = async function() {
  return await this.findAll({
    attributes: [
      'target_audience',
      [sequelize.fn('COUNT', '*'), 'campaigns_count'],
      [sequelize.fn('AVG', sequelize.col('recipients_count')), 'avg_recipients'],
      [sequelize.fn('AVG', sequelize.literal('(unique_opens * 100.0 / NULLIF(successful_sends, 0))')), 'avg_open_rate'],
      [sequelize.fn('AVG', sequelize.literal('(unique_clicks * 100.0 / NULLIF(unique_opens, 0))')), 'avg_click_rate']
    ],
    where: {
      status: 'sent',
      successful_sends: { [Op.gt]: 0 }
    },
    group: ['target_audience'],
    raw: true
  });
};

// 🧹 Nettoyer les anciennes campagnes brouillons
NewsletterCampaign.cleanupOldDrafts = async function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return await this.destroy({
    where: {
      status: 'draft',
      created_at: { [Op.lt]: cutoffDate }
    }
  });
};

module.exports = NewsletterCampaign;