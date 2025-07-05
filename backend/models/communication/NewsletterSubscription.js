// models/communication/NewsletterSubscription.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const NewsletterSubscription = sequelize.define('NewsletterSubscription', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'Peut être null pour les non-inscrits'
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Pour personnaliser les emails'
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  language_preference: {
    type: DataTypes.ENUM('wolof', 'français', 'both'),
    allowNull: false,
    defaultValue: 'français'
  },
  subscription_source: {
    type: DataTypes.ENUM('website', 'mobile_app', 'event', 'referral', 'import', 'api'),
    allowNull: false,
    defaultValue: 'website'
  },
  subscription_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_confirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Email confirmé via double opt-in'
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  confirmation_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  confirmation_sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  unsubscribed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  unsubscribe_reason: {
    type: DataTypes.ENUM(
      'too_frequent', 'not_relevant', 'technical_issues', 
      'privacy_concerns', 'found_alternative', 'other'
    ),
    allowNull: true
  },
  unsubscribe_feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  unsubscribe_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  frequency_preference: {
    type: DataTypes.ENUM('daily', 'weekly', 'biweekly', 'monthly'),
    allowNull: false,
    defaultValue: 'weekly'
  },
  content_preferences: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      new_words: true,
      new_phrases: true,
      events: true,
      community_highlights: true,
      learning_tips: true,
      cultural_content: true,
      project_updates: false,
      technical_updates: false
    },
    comment: 'Préférences de contenu'
  },
  demographics: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Données démographiques optionnelles'
  },
  interests: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Centres d\'intérêt déclarés'
  },
  engagement_score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Score d\'engagement basé sur les interactions'
  },
  last_email_sent: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_email_opened: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_email_clicked: {
    type: DataTypes.DATE,
    allowNull: true
  },
  total_emails_sent: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  total_emails_opened: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  total_emails_clicked: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  bounce_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre d\'emails qui ont rebondi'
  },
  complaint_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de plaintes pour spam'
  },
  is_bouncing: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Email en rebond constant'
  },
  is_complained: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'A signalé comme spam'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Tags pour segmentation'
  },
  custom_fields: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Champs personnalisés'
  },
  referrer_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de provenance lors de l\'inscription'
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
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP lors de l\'inscription'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'newsletter_subscriptions',
  indexes: [
    { fields: ['email'] },
    { fields: ['user_id'] },
    { fields: ['is_active'] },
    { fields: ['is_confirmed'] },
    { fields: ['language_preference'] },
    { fields: ['frequency_preference'] },
    { fields: ['subscription_source'] },
    { fields: ['engagement_score'] },
    { fields: ['is_bouncing'] },
    { fields: ['is_complained'] },
    { fields: ['confirmation_token'] },
    { fields: ['unsubscribe_token'] },
    { fields: ['subscription_date'] },
    { fields: ['last_email_sent'] },
    { fields: ['last_email_opened'] }
  ],
  hooks: {
    beforeCreate: async (subscription) => {
      // Générer les tokens
      if (!subscription.confirmation_token) {
        subscription.confirmation_token = require('crypto')
          .randomBytes(32)
          .toString('hex');
      }
      if (!subscription.unsubscribe_token) {
        subscription.unsubscribe_token = require('crypto')
          .randomBytes(32)
          .toString('hex');
      }
    }
  }
});

// Méthodes d'instance
NewsletterSubscription.prototype.confirm = async function() {
  this.is_confirmed = true;
  this.confirmed_at = new Date();
  this.confirmation_token = null; // Supprimer le token après confirmation
  await this.save(['is_confirmed', 'confirmed_at', 'confirmation_token']);
};

NewsletterSubscription.prototype.unsubscribe = async function(reason = null, feedback = null) {
  this.is_active = false;
  this.unsubscribed_at = new Date();
  this.unsubscribe_reason = reason;
  this.unsubscribe_feedback = feedback;
  await this.save(['is_active', 'unsubscribed_at', 'unsubscribe_reason', 'unsubscribe_feedback']);
};

NewsletterSubscription.prototype.reactivate = async function() {
  this.is_active = true;
  this.unsubscribed_at = null;
  this.unsubscribe_reason = null;
  this.unsubscribe_feedback = null;
  await this.save(['is_active', 'unsubscribed_at', 'unsubscribe_reason', 'unsubscribe_feedback']);
};

NewsletterSubscription.prototype.recordEmailSent = async function() {
  this.total_emails_sent += 1;
  this.last_email_sent = new Date();
  await this.save(['total_emails_sent', 'last_email_sent']);
};

NewsletterSubscription.prototype.recordEmailOpened = async function() {
  this.total_emails_opened += 1;
  this.last_email_opened = new Date();
  await this.updateEngagementScore();
};

NewsletterSubscription.prototype.recordEmailClicked = async function() {
  this.total_emails_clicked += 1;
  this.last_email_clicked = new Date();
  await this.updateEngagementScore();
};

NewsletterSubscription.prototype.recordBounce = async function() {
  this.bounce_count += 1;
  if (this.bounce_count >= 3) {
    this.is_bouncing = true;
  }
  await this.save(['bounce_count', 'is_bouncing']);
};

NewsletterSubscription.prototype.recordComplaint = async function() {
  this.complaint_count += 1;
  this.is_complained = true;
  this.is_active = false; // Désabonner automatiquement
  await this.save(['complaint_count', 'is_complained', 'is_active']);
};

NewsletterSubscription.prototype.updateEngagementScore = async function() {
  // Calculer le score d'engagement basé sur les interactions
  const openRate = this.total_emails_sent > 0 ? this.total_emails_opened / this.total_emails_sent : 0;
  const clickRate = this.total_emails_opened > 0 ? this.total_emails_clicked / this.total_emails_opened : 0;
  const recentActivity = this.last_email_opened && 
    (new Date() - this.last_email_opened) < (30 * 24 * 60 * 60 * 1000) ? 1 : 0;
  
  this.engagement_score = (openRate * 40 + clickRate * 50 + recentActivity * 10).toFixed(2);
  await this.save(['engagement_score']);
};

NewsletterSubscription.prototype.shouldReceiveEmail = function(frequency) {
  if (!this.is_active || !this.is_confirmed || this.is_bouncing || this.is_complained) {
    return false;
  }
  
  if (!this.last_email_sent) {
    return true;
  }
  
  const now = new Date();
  const daysSinceLastEmail = (now - this.last_email_sent) / (1000 * 60 * 60 * 24);
  
  switch (frequency) {
    case 'daily':
      return daysSinceLastEmail >= 1;
    case 'weekly':
      return daysSinceLastEmail >= 7;
    case 'biweekly':
      return daysSinceLastEmail >= 14;
    case 'monthly':
      return daysSinceLastEmail >= 30;
    default:
      return false;
  }
};

// Méthodes de classe
NewsletterSubscription.findActiveSubscribers = function(options = {}) {
  return this.findAll({
    where: {
      is_active: true,
      is_confirmed: true,
      is_bouncing: false,
      is_complained: false,
      ...options.where
    },
    order: [['subscription_date', 'DESC']],
    ...options
  });
};

NewsletterSubscription.findByFrequency = function(frequency) {
  return this.findAll({
    where: {
      frequency_preference: frequency,
      is_active: true,
      is_confirmed: true,
      is_bouncing: false,
      is_complained: false
    }
  });
};

NewsletterSubscription.findHighEngagement = function(threshold = 70, limit = 100) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      engagement_score: { [Op.gte]: threshold },
      is_active: true,
      is_confirmed: true
    },
    order: [['engagement_score', 'DESC']],
    limit
  });
};

NewsletterSubscription.getSegmentStats = function() {
  return this.findAll({
    attributes: [
      'language_preference',
      'frequency_preference',
      'is_active',
      'is_confirmed',
      [sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.fn('AVG', sequelize.col('engagement_score')), 'avg_engagement']
    ],
    group: ['language_preference', 'frequency_preference', 'is_active', 'is_confirmed'],
    raw: true
  });
};

NewsletterSubscription.cleanupInactive = async function(daysInactive = 365) {
  const { Op } = require('sequelize');
  const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
  
  return await this.destroy({
    where: {
      [Op.or]: [
        { is_bouncing: true },
        { is_complained: true },
        {
          [Op.and]: [
            { is_active: false },
            { unsubscribed_at: { [Op.lt]: cutoffDate } }
          ]
        }
      ]
    }
  });
};

module.exports = NewsletterSubscription;