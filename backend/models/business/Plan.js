// =============================================================================
// 📋 PLAN MODEL COMPLET - PARFAITEMENT ALIGNÉ AVEC PLANSERVICE
// File: backend/src/models/business/Plan.js
// =============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 📝 Informations de base
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Nom du plan (Free, Premium, Pro)'
  },
  
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Identifiant URL-friendly'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée du plan'
  },
  
  // 💰 Tarification
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Prix en devise principale'
  },
  
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR',
    comment: 'Code devise ISO (EUR, USD, XOF)'
  },
  
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly', 'lifetime', 'one_time'),
    allowNull: false,
    defaultValue: 'monthly',
    comment: 'Cycle de facturation'
  },
  
  trial_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Jours d\'essai gratuit'
  },
  
  // 🎯 Limitations et fonctionnalités (UTILISÉS PAR PLANSERVICE)
  features: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Fonctionnalités incluses (JSON) - utilisé par PlanService.checkFeatureAccess'
  },
  
  limits: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Limites d\'usage (JSON) - utilisé par PlanService.getUsageLimit'
  },
  
  // 🛠️ Configuration
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Plan disponible à la souscription - utilisé par PlanService.getAllPlans'
  },
  
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Plan mis en avant (Most Popular) - utilisé par PlanService.getFeaturedPlan'
  },
  
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Ordre d\'affichage - utilisé par PlanService.getAllPlans'
  },
  
  // 🎨 Personnalisation (UTILISÉS PAR PLANSERVICE.getDefaultPlans)
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: 'Couleur hex pour l\'interface (#FF5733)'
  },
  
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Icône ou emoji pour le plan'
  },
  
  // 📊 Métadonnées (UTILISÉES PAR SUBSCRIPTIONSERVICE.syncWithPaymentProvider)
  stripe_price_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID prix Stripe pour intégration'
  },
  
  paypal_plan_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID plan PayPal pour intégration'
  }
  
}, {
  tableName: 'plans',
  timestamps: true,
  paranoid: false,
  
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['is_active'] },
    { fields: ['is_featured'] }, // Index pour PlanService.getFeaturedPlan
    { fields: ['sort_order'] },
    { fields: ['is_active', 'sort_order'] }, // Index composé pour PlanService.getAllPlans
    { fields: ['stripe_price_id'] }, // Index pour recherche par Stripe ID
    { fields: ['paypal_plan_id'] } // Index pour recherche par PayPal ID
  ],
  
  scopes: {
    active: {
      where: { is_active: true },
      order: [['sort_order', 'ASC']] // Utilisé par PlanService.getAllPlans
    },
    featured: {
      where: { is_featured: true, is_active: true } // Utilisé par PlanService.getFeaturedPlan
    }
  }
});

// =============================================================================
// 📋 MÉTHODES D'INSTANCE (UTILISÉES PAR PLANSERVICE)
// =============================================================================

/**
 * ✅ Vérifier si une fonctionnalité est disponible (utilisé par PlanService.checkFeatureAccess)
 */
Plan.prototype.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

/**
 * 🔢 Obtenir la limite pour un type d'usage (utilisé par PlanService.getUsageLimit)
 */
Plan.prototype.getLimit = function(limitType) {
  const limit = this.limits[limitType];
  return limit !== undefined ? limit : 0;
};

/**
 * 💰 Calculer le prix avec options (utilisé par PlanService.calculatePrice)
 */
Plan.prototype.calculatePrice = function(options = {}) {
  let price = parseFloat(this.price);
  
  // Remise annuelle (-17% standard)
  if (options.yearly && this.billing_cycle === 'monthly') {
    price = price * 12 * 0.83; // 17% de remise
  }
  
  // Remises spéciales
  if (options.discount_percent) {
    price = price * (1 - options.discount_percent / 100);
  }
  
  return Math.round(price * 100) / 100; // Arrondir à 2 décimales
};

/**
 * 🎯 Vérifier si le plan supporte les essais gratuits (utilisé par SubscriptionService.startTrial)
 */
Plan.prototype.supportsTrial = function() {
  return this.trial_days > 0;
};

/**
 * 📊 Obtenir les statistiques du plan (utilisé par PlanService.getPlanStats)
 */
Plan.prototype.getStats = async function() {
  if (!this.sequelize.models.Subscription) {
    return {
      active_subscriptions: 0,
      total_subscriptions: 0,
      monthly_revenue: 0
    };
  }
  
  const Subscription = this.sequelize.models.Subscription;
  
  const stats = await Subscription.findAll({
    attributes: [
      [Subscription.sequelize.fn('COUNT', '*'), 'total'],
      [Subscription.sequelize.fn('COUNT', 
        Subscription.sequelize.literal("CASE WHEN status IN ('active', 'trialing') THEN 1 END")
      ), 'active']
    ],
    where: { plan_id: this.id },
    raw: true
  });
  
  const totalSubscriptions = parseInt(stats[0]?.total || 0);
  const activeSubscriptions = parseInt(stats[0]?.active || 0);
  const monthlyRevenue = activeSubscriptions * parseFloat(this.price);
  
  return {
    active_subscriptions: activeSubscriptions,
    total_subscriptions: totalSubscriptions,
    monthly_revenue: this.billing_cycle === 'yearly' ? monthlyRevenue / 12 : monthlyRevenue
  };
};

// =============================================================================
// 📋 MÉTHODES DE CLASSE (UTILISÉES PAR PLANSERVICE)
// =============================================================================

/**
 * 🆓 Trouver le plan gratuit (utilisé par PlanService.getFreePlan)
 */
Plan.findFree = function() {
  return this.findOne({
    where: { slug: 'free', is_active: true }
  });
};

/**
 * ⭐ Trouver le plan en vedette (utilisé par PlanService.getFeaturedPlan)
 */
Plan.findFeatured = function() {
  return this.scope('featured').findOne();
};

/**
 * 📊 Obtenir la matrice des fonctionnalités (utilisé par PlanService.comparePlans)
 */
Plan.getFeatureMatrix = async function() {
  const plans = await this.scope('active').findAll();
  
  const allFeatures = new Set();
  const allLimits = new Set();
  
  plans.forEach(plan => {
    Object.keys(plan.features || {}).forEach(feature => allFeatures.add(feature));
    Object.keys(plan.limits || {}).forEach(limit => allLimits.add(limit));
  });
  
  return {
    plans: plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      price: plan.price,
      currency: plan.currency,
      billing_cycle: plan.billing_cycle,
      trial_days: plan.trial_days,
      features: plan.features,
      limits: plan.limits,
      color: plan.color,
      icon: plan.icon
    })),
    feature_matrix: Array.from(allFeatures),
    limit_matrix: Array.from(allLimits)
  };
};

module.exports = Plan;
