// =============================================================================
// 📱 WOLOFDICT - INDEX DES MODÈLES SMS
// Organisation et associations des modèles SMS
// =============================================================================

const SMSSubscription = require('./SMSSubscription');
const SMSMessage = require('./SMSMessage');
const SMSCampaign = require('./SMSCampaign');

/**
 * 🔧 Initialiser les modèles SMS
 * @param {Sequelize} sequelize - Instance Sequelize
 * @returns {Object} Modèles initialisés
 */
function initializeSMSModels(sequelize) {
  // Initialiser tous les modèles
  const models = {
    SMSSubscription: SMSSubscription(sequelize),
    SMSMessage: SMSMessage(sequelize),
    SMSCampaign: SMSCampaign(sequelize)
  };

  // Configurer les associations
  Object.values(models).forEach(model => {
    if (model.associate) {
      model.associate(models);
    }
  });

  return models;
}

/**
 * 🔗 Configurer les associations avec les autres modèles
 * @param {Object} smsModels - Modèles SMS
 * @param {Object} allModels - Tous les modèles de l'application
 */
function configureSMSAssociations(smsModels, allModels) {
  const { SMSSubscription, SMSMessage, SMSCampaign } = smsModels;

  // ===== ASSOCIATIONS AVEC USER =====
  if (allModels.User) {
    // Un utilisateur peut avoir plusieurs abonnements SMS
    allModels.User.hasMany(SMSSubscription, {
      foreignKey: 'user_id',
      as: 'smsSubscriptions'
    });

    // Un utilisateur peut envoyer plusieurs messages SMS
    allModels.User.hasMany(SMSMessage, {
      foreignKey: 'user_id',
      as: 'smsMessages'
    });

    // Un utilisateur peut créer plusieurs campagnes SMS
    allModels.User.hasMany(SMSCampaign, {
      foreignKey: 'created_by',
      as: 'smsCreatedCampaigns'
    });

    // Un utilisateur peut approuver plusieurs campagnes SMS
    allModels.User.hasMany(SMSCampaign, {
      foreignKey: 'approved_by',
      as: 'smsApprovedCampaigns'
    });
  }

  // ===== ASSOCIATIONS INTERNES SMS =====
  
  // SMSSubscription vers SMSMessage
  SMSSubscription.hasMany(SMSMessage, {
    foreignKey: 'subscription_id',
    as: 'messages',
    onDelete: 'SET NULL'
  });

  SMSMessage.belongsTo(SMSSubscription, {
    foreignKey: 'subscription_id',
    as: 'subscription'
  });

  // SMSCampaign vers SMSMessage
  SMSCampaign.hasMany(SMSMessage, {
    foreignKey: 'campaign_id',
    sourceKey: 'id',
    as: 'messages',
    onDelete: 'SET NULL'
  });

  SMSMessage.belongsTo(SMSCampaign, {
    foreignKey: 'campaign_id',
    targetKey: 'id',
    as: 'campaign'
  });

  // ===== ASSOCIATIONS AVEC D'AUTRES SERVICES =====

  // Newsletter service (si disponible)
  if (allModels.NewsletterSubscription) {
    // Lier les abonnements SMS et Newsletter par user_id
    SMSSubscription.belongsTo(allModels.NewsletterSubscription, {
      foreignKey: 'user_id',
      targetKey: 'user_id',
      as: 'newsletterSubscription',
      constraints: false
    });
  }

  // Push service (si disponible)
  if (allModels.PushSubscription) {
    // Lier les abonnements SMS et Push par user_id
    SMSSubscription.belongsTo(allModels.PushSubscription, {
      foreignKey: 'user_id',
      targetKey: 'user_id',
      as: 'pushSubscription',
      constraints: false
    });
  }

  return smsModels;
}

/**
 * 📊 Méthodes utilitaires pour les modèles SMS
 */
const SMSModelUtils = {
  /**
   * 🔍 Rechercher un abonné par téléphone ou email
   */
  async findSubscriberByContact(phoneOrEmail, models) {
    const { SMSSubscription } = models;
    
    // Essayer d'abord par numéro de téléphone
    if (phoneOrEmail.startsWith('+') || /^\d+$/.test(phoneOrEmail)) {
      return await SMSSubscription.findOne({
        where: { phone_number: phoneOrEmail }
      });
    }
    
    // Sinon chercher par user associé via email
    if (models.User) {
      const user = await models.User.findOne({
        where: { email: phoneOrEmail },
        include: [{
          model: SMSSubscription,
          as: 'smsSubscriptions',
          where: { is_active: true }
        }]
      });
      
      return user?.smsSubscriptions?.[0] || null;
    }
    
    return null;
  },

  /**
   * 📱 Obtenir tous les contacts d'un utilisateur
   */
  async getUserContacts(userId, models) {
    const { SMSSubscription, User } = models;
    
    const contacts = {
      sms: null,
      email: null,
      newsletter: null,
      push: null
    };

    // SMS
    contacts.sms = await SMSSubscription.findOne({
      where: { user_id: userId, is_active: true }
    });

    // Email via User
    if (User) {
      const user = await User.findByPk(userId);
      contacts.email = user?.email || null;
    }

    // Newsletter (si disponible)
    if (models.NewsletterSubscription) {
      contacts.newsletter = await models.NewsletterSubscription.findOne({
        where: { user_id: userId, is_active: true }
      });
    }

    // Push (si disponible)
    if (models.PushSubscription) {
      contacts.push = await models.PushSubscription.findOne({
        where: { user_id: userId, is_active: true }
      });
    }

    return contacts;
  },

  /**
   * 📊 Statistiques globales SMS
   */
  async getGlobalSMSStats(models) {
    const { SMSSubscription, SMSMessage, SMSCampaign } = models;
    
    const stats = {};

    // Statistiques des abonnements
    const subscriptionStats = await SMSSubscription.findAll({
      attributes: [
        [models.sequelize.fn('COUNT', '*'), 'total'],
        [models.sequelize.fn('SUM', models.sequelize.literal('CASE WHEN is_active = true THEN 1 ELSE 0 END')), 'active'],
        [models.sequelize.fn('SUM', models.sequelize.literal('CASE WHEN is_verified = true THEN 1 ELSE 0 END')), 'verified']
      ],
      raw: true
    });

    stats.subscriptions = subscriptionStats[0] || { total: 0, active: 0, verified: 0 };

    // Statistiques des messages (derniers 30 jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const messageStats = await SMSMessage.findAll({
      attributes: [
        [models.sequelize.fn('COUNT', '*'), 'total'],
        [models.sequelize.fn('SUM', models.sequelize.literal('CASE WHEN status = \'delivered\' THEN 1 ELSE 0 END')), 'delivered'],
        [models.sequelize.fn('SUM', models.sequelize.literal('CASE WHEN status = \'failed\' THEN 1 ELSE 0 END')), 'failed'],
        [models.sequelize.fn('SUM', 'cost'), 'total_cost']
      ],
      where: {
        created_at: { [models.sequelize.Op.gte]: thirtyDaysAgo }
      },
      raw: true
    });

    stats.messages = messageStats[0] || { total: 0, delivered: 0, failed: 0, total_cost: 0 };

    // Statistiques des campagnes
    const campaignStats = await SMSCampaign.findAll({
      attributes: [
        'status',
        [models.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    stats.campaigns = {};
    campaignStats.forEach(stat => {
      stats.campaigns[stat.status] = parseInt(stat.count);
    });

    return stats;
  },

  /**
   * 🧹 Nettoyage global des données SMS
   */
  async cleanupAllSMSData(models, options = {}) {
    const { SMSSubscription, SMSMessage, SMSCampaign } = models;
    const results = {};

    // Nettoyer les abonnements non vérifiés
    if (options.cleanupUnverified !== false) {
      results.unverifiedSubscriptions = await SMSSubscription.cleanupUnverified(
        options.unverifiedDays || 30
      );
    }

    // Nettoyer les anciens messages
    if (options.cleanupMessages !== false) {
      results.oldMessages = await SMSMessage.cleanupOldMessages(
        options.messageDays || 90
      );
    }

    // Nettoyer les anciennes campagnes
    if (options.cleanupCampaigns !== false) {
      results.oldCampaigns = await SMSCampaign.cleanupOldCampaigns(
        options.campaignDays || 365
      );
    }

    return results;
  }
};

module.exports = {
  initializeSMSModels,
  configureSMSAssociations,
  SMSModelUtils,
  
  // Export direct des fonctions de modèles pour faciliter l'import
  SMSSubscription,
  SMSMessage,
  SMSCampaign
};