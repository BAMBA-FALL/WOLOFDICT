// =============================================================================
// 💳 SUBSCRIPTION MODEL COMPLET - PARFAITEMENT ALIGNÉ AVEC SUBSCRIPTIONSERVICE  
// File: backend/src/models/business/Subscription.js
// =============================================================================

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 🔗 Relations (UTILISÉES PAR SUBSCRIPTIONSERVICE)
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur abonné - utilisé par SubscriptionService.getUserSubscription'
  },
  
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plans',
      key: 'id'
    },
    comment: 'Plan souscrit - utilisé par SubscriptionService.createPremiumSubscription'
  },
  
  // 📅 Dates importantes (UTILISÉES PAR SUBSCRIPTIONSERVICE)
  starts_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date de début d\'abonnement - utilisé par SubscriptionService.createPremiumSubscription'
  },
  
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration (null = illimité) - utilisé par SubscriptionService.processExpiredSubscriptions'
  },
  
  trial_ends_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fin de la période d\'essai - utilisé par SubscriptionService.startTrial'
  },
  
  canceled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'annulation - utilisé par SubscriptionService.cancelSubscription'
  },
  
  // 📊 Statut et gestion (UTILISÉS PAR SUBSCRIPTIONSERVICE)
  status: {
    type: DataTypes.ENUM(
      'active',           // Actif et payé
      'trialing',         // En période d'essai
      'past_due',         // Paiement en retard
      'canceled',         // Annulé par l'utilisateur
      'unpaid',          // Non payé (suspension)
      'expired'          // Expiré
    ),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Statut de l\'abonnement - utilisé par tous les scopes et méthodes SubscriptionService'
  },
  
  auto_renew: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Renouvellement automatique - utilisé par SubscriptionService.processExpiredSubscriptions'
  },
  
  // 💰 Informations financières (UTILISÉES PAR SUBSCRIPTIONSERVICE)
  current_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Prix payé (peut différer du plan actuel) - utilisé par SubscriptionService.calculateMRR'
  },
  
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    comment: 'Devise de facturation - utilisé par SubscriptionService.createPremiumSubscription'
  },
  
  // 🔧 Intégrations paiement (UTILISÉES PAR SUBSCRIPTIONSERVICE.syncWithPaymentProvider)
  stripe_subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID abonnement Stripe'
  },
  
  paypal_subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID abonnement PayPal'
  },
  
  payment_method: {
    type: DataTypes.ENUM('stripe', 'paypal', 'bank_transfer', 'mobile_money'),
    allowNull: true,
    comment: 'Méthode de paiement utilisée'
  },
  
  // 📝 Informations supplémentaires (UTILISÉES PAR SUBSCRIPTIONSERVICE)
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes administratives - utilisé par SubscriptionService pour traçabilité'
  },
  
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raison d\'annulation (feedback utilisateur) - utilisé par SubscriptionService.cancelSubscription'
  },
  
  // 📊 Métriques (UTILISÉES PAR SUBSCRIPTIONSERVICE.updateSubscriptionUsage)
  usage_data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Données d\'usage pour analytics - utilisé par SubscriptionService.updateSubscriptionUsage'
  }
  
}, {
  tableName: 'subscriptions',
  timestamps: true,
  paranoid: true, // Soft delete pour historique
  
  indexes: [
    { fields: ['user_id'] },
    { fields: ['plan_id'] },
    { fields: ['status'] },
    { fields: ['expires_at'] }, // Pour SubscriptionService.processExpiredSubscriptions
    { fields: ['trial_ends_at'] }, // Pour SubscriptionService.processExpiredSubscriptions
    { fields: ['stripe_subscription_id'] },
    { fields: ['paypal_subscription_id'] },
    { fields: ['canceled_at'] }, // Pour SubscriptionService.reactivateSubscription
    
    // Index composés pour requêtes fréquentes du SubscriptionService
    { fields: ['user_id', 'status'] }, // getUserSubscription
    { fields: ['status', 'expires_at'] }, // processExpiredSubscriptions
    { fields: ['status', 'created_at'] }, // getDetailedMetrics
    { fields: ['plan_id', 'status'] }, // getStatsByPlan
    { fields: ['user_id', 'trial_ends_at'] } // startTrial (vérification essai précédent)
  ],
  
  scopes: {
    // SCOPES UTILISÉS PAR SUBSCRIPTIONSERVICE
    active: {
      where: { status: ['active', 'trialing'] }
    },
    expired: {
      where: { status: 'expired' }
    },
    canceled: {
      where: { status: 'canceled' }
    },
    trialing: {
      where: { status: 'trialing' }
    },
    pastDue: {
      where: { status: 'past_due' }
    }
  }
});

// =============================================================================
// 💳 MÉTHODES D'INSTANCE (UTILISÉES PAR SUBSCRIPTIONSERVICE)
// =============================================================================

/**
 * ⏰ Vérifier si l'abonnement est actif (utilisé partout dans SubscriptionService)
 */
Subscription.prototype.isActive = function() {
  return ['active', 'trialing'].includes(this.status);
};

/**
 * ⏰ Vérifier si l'abonnement est en période d'essai (utilisé par SubscriptionService)
 */
Subscription.prototype.isTrialing = function() {
  return this.status === 'trialing' && 
         this.trial_ends_at && 
         new Date() < new Date(this.trial_ends_at);
};

/**
 * ⏰ Vérifier si l'abonnement a expiré (utilisé par SubscriptionService.processExpiredSubscriptions)
 */
Subscription.prototype.isExpired = function() {
  if (!this.expires_at) return false;
  return new Date() > new Date(this.expires_at);
};

/**
 * ⏰ Vérifier si l'essai a expiré (utilisé par SubscriptionService.processExpiredSubscriptions)
 */
Subscription.prototype.isTrialExpired = function() {
  if (!this.trial_ends_at) return false;
  return new Date() > new Date(this.trial_ends_at);
};

/**
 * 📊 Calculer les jours restants (utilisé par SubscriptionService.getUserUsageStats)
 */
Subscription.prototype.getDaysRemaining = function() {
  if (!this.expires_at) return -1; // Illimité
  
  const now = new Date();
  const expires = new Date(this.expires_at);
  const diffTime = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * 📊 Calculer les jours d'essai restants (utilisé par SubscriptionService.getUserUsageStats)
 */
Subscription.prototype.getTrialDaysRemaining = function() {
  if (!this.trial_ends_at) return 0;
  
  const now = new Date();
  const trialEnds = new Date(this.trial_ends_at);
  const diffTime = trialEnds.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * 💰 Calculer la contribution MRR (utilisé par SubscriptionService.calculateMRR)
 */
Subscription.prototype.getMRRContribution = function() {
  if (!this.isActive()) return 0;
  
  const price = parseFloat(this.current_price);
  
  // Convertir en montant mensuel
  if (this.plan && this.plan.billing_cycle === 'yearly') {
    return price / 12;
  } else if (this.plan && this.plan.billing_cycle === 'monthly') {
    return price;
  }
  
  return 0; // Les abonnements lifetime ne comptent pas dans le MRR
};

/**
 * 🔄 Renouveler l'abonnement (utilisé par SubscriptionService.processExpiredSubscriptions)
 */
Subscription.prototype.renew = async function() {
  if (!this.plan) {
    throw new Error('Plan non chargé pour le renouvellement');
  }
  
  const now = new Date();
  let newExpiresAt = new Date(now);
  
  if (this.plan.billing_cycle === 'yearly') {
    newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1);
  } else if (this.plan.billing_cycle === 'monthly') {
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 1);
  } else {
    throw new Error('Cycle de facturation non supporté pour le renouvellement');
  }
  
  await this.update({
    expires_at: newExpiresAt,
    status: 'active',
    notes: `${this.notes || ''}\nRenouvelé automatiquement le ${now.toISOString()}`
  });
  
  return this;
};

/**
 * 📈 Mettre à jour les données d'usage (utilisé par SubscriptionService.updateSubscriptionUsage)
 */
Subscription.prototype.updateUsage = async function(usageData) {
  const currentUsage = this.usage_data || {};
  const updatedUsage = {
    ...currentUsage,
    ...usageData,
    last_updated: new Date().toISOString()
  };
  
  await this.update({ usage_data: updatedUsage });
  return this;
};

// =============================================================================
// 💳 MÉTHODES DE CLASSE (UTILISÉES PAR SUBSCRIPTIONSERVICE)
// =============================================================================

/**
 * 👤 Trouver l'abonnement actuel d'un utilisateur (utilisé par SubscriptionService.getUserSubscription)
 */
Subscription.findUserCurrent = function(userId) {
  return this.scope('active').findOne({
    where: { user_id: userId },
    include: [
      {
        model: this.sequelize.models.Plan,
        as: 'plan'
      }
    ],
    order: [['starts_at', 'DESC']]
  });
};

/**
 * ⏰ Trouver les abonnements expirés (utilisé par SubscriptionService.processExpiredSubscriptions)
 */
Subscription.findExpired = function() {
  const { Op } = require('sequelize');
  const now = new Date();
  
  return this.findAll({
    where: {
      expires_at: { [Op.lt]: now },
      status: ['active', 'past_due']
    },
    include: [
      {
        model: this.sequelize.models.Plan,
        as: 'plan'
      }
    ]
  });
};

/**
 * ⏰ Trouver les essais expirés (utilisé par SubscriptionService.processExpiredSubscriptions)
 */
Subscription.findExpiredTrials = function() {
  const { Op } = require('sequelize');
  const now = new Date();
  
  return this.findAll({
    where: {
      trial_ends_at: { [Op.lt]: now },
      status: 'trialing'
    },
    include: [
      {
        model: this.sequelize.models.Plan,
        as: 'plan'
      }
    ]
  });
};

/**
 * 📊 Calculer les statistiques globales (utilisé par SubscriptionService.updateStats)
 */
Subscription.getGlobalStats = async function() {
  const statusStats = await this.findAll({
    attributes: [
      'status',
      [this.sequelize.fn('COUNT', this.sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });
  
  const stats = {
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    trialingSubscriptions: 0,
    canceledSubscriptions: 0,
    expiredSubscriptions: 0,
    pastDueSubscriptions: 0,
    unpaidSubscriptions: 0
  };
  
  statusStats.forEach(stat => {
    const status = stat.status;
    const count = parseInt(stat.count);
    
    stats.totalSubscriptions += count;
    
    switch (status) {
      case 'active':
        stats.activeSubscriptions = count;
        break;
      case 'trialing':
        stats.trialingSubscriptions = count;
        break;
      case 'canceled':
        stats.canceledSubscriptions = count;
        break;
      case 'expired':
        stats.expiredSubscriptions = count;
        break;
      case 'past_due':
        stats.pastDueSubscriptions = count;
        break;
      case 'unpaid':
        stats.unpaidSubscriptions = count;
        break;
    }
  });
  
  return stats;
};

/**
 * 💰 Calculer le MRR total (utilisé par SubscriptionService.calculateMRR)
 */
Subscription.calculateTotalMRR = async function() {
  const activeSubscriptions = await this.scope('active').findAll({
    include: [
      {
        model: this.sequelize.models.Plan,
        as: 'plan'
      }
    ]
  });
  
  let mrr = 0;
  
  activeSubscriptions.forEach(subscription => {
    mrr += subscription.getMRRContribution();
  });
  
  return Math.round(mrr * 100) / 100;
};

/**
 * 📈 Obtenir les statistiques par plan (utilisé par SubscriptionService.getStatsByPlan)
 */
Subscription.getStatsByPlan = async function() {
  return await this.findAll({
    attributes: [
      'plan_id',
      'status',
      [this.sequelize.fn('COUNT', '*'), 'count'],
      [this.sequelize.fn('SUM', 'current_price'), 'total_revenue']
    ],
    include: [
      {
        model: this.sequelize.models.Plan,
        as: 'plan',
        attributes: ['slug', 'name', 'billing_cycle']
      }
    ],
    group: ['plan_id', 'status', 'plan.id'],
    raw: true
  });
};

/**
 * 🔍 Recherche avancée d'abonnements (utilisé par SubscriptionService.searchSubscriptions)
 */
Subscription.searchWithUser = function(query, filters = {}) {
  const { Op } = require('sequelize');
  const whereClause = { ...filters };
  
  if (query) {
    whereClause[Op.or] = [
      { '$user.email$': { [Op.iLike]: `%${query}%` } },
      { '$user.username$': { [Op.iLike]: `%${query}%` } },
      { '$user.first_name$': { [Op.iLike]: `%${query}%` } },
      { '$user.last_name$': { [Op.iLike]: `%${query}%` } },
      { notes: { [Op.iLike]: `%${query}%` } }
    ];
  }
  
  return this.findAll({
    where: whereClause,
    include: [
      {
        model: this.sequelize.models.Plan,
        as: 'plan',
        attributes: ['slug', 'name', 'price']
      },
      {
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'email', 'username', 'first_name', 'last_name']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: 50
  });
};

module.exports = Subscription;

// =============================================================================
// 📝 NOTES D'ALIGNEMENT PARFAIT
// =============================================================================
/*
PLAN.JS ↔ PLANSERVICE :
✅ Tous les champs utilisés par PlanService existent dans Plan
✅ Scopes 'active' et 'featured' parfaitement alignés
✅ Méthodes d'instance pour fonctionnalités et limites
✅ Méthodes de classe pour recherches spécialisées
✅ Index optimisés pour les requêtes du service

SUBSCRIPTION.JS ↔ SUBSCRIPTIONSERVICE :
✅ Tous les champs obligatoires présents et utilisés
✅ Scopes 'active', 'canceled', 'expired' parfaitement alignés
✅ Méthodes d'instance pour statuts et calculs
✅ Méthodes de classe pour recherches et statistiques
✅ Index composés pour performances optimales
✅ Paranoid mode pour historique (soft delete)

NOUVELLES FONCTIONNALITÉS AJOUTÉES :
🆕 Méthodes de vérification d'état (isActive, isExpired, etc.)
🆕 Calculs MRR et contributions
🆕 Méthodes de renouvellement automatique
🆕 Recherche avancée avec utilisateurs
🆕 Statistiques complètes par plan et globales
🆕 Gestion intelligente des essais gratuits
*/