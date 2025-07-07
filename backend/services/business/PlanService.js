// =============================================================================
// 💰 WOLOFDICT - PLANSERVICE COMPLET
// Service de gestion des plans tarifaires avec logique métier
// =============================================================================

const logger = require('./LoggerService');

class PlanService {
  constructor() {
    this.isInitialized = false;
    this.name = 'PlanService';
    this.models = null;
    this.defaultPlans = this.getDefaultPlans();
  }

  async initialize() {
    try {
      // Import des modèles Sequelize
      try {
        this.models = require('../models');
        logger.info('Modèles Sequelize chargés dans PlanService');
      } catch (error) {
        logger.warn('Modèles Sequelize non disponibles, mode mock activé');
      }

      // Vérifier/créer les plans par défaut
      await this.ensureDefaultPlans();
      
      this.isInitialized = true;
      logger.info('PlanService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation PlanService:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Configuration des plans par défaut WolofDict
   */
  getDefaultPlans() {
    return [
      {
        name: 'Free',
        slug: 'free',
        description: 'Accès gratuit aux fonctionnalités de base de WolofDict',
        price: 0.00,
        currency: 'EUR',
        billing_cycle: 'monthly',
        trial_days: 0,
        features: {
          dictionary_access: true,
          basic_search: true,
          audio_standard: true,
          favorites_limited: true,
          forum_basic: true,
          mobile_app: true,
          customer_support: 'community'
        },
        limits: {
          daily_searches: 50,
          max_favorites: 100,
          daily_contributions: 5,
          forum_posts_per_day: 5,
          api_calls_per_month: 0,
          premium_content: false,
          offline_access: false,
          advanced_analytics: false
        },
        is_active: true,
        is_featured: false,
        sort_order: 1,
        color: '#6B7280',
        icon: '🆓',
        stripe_price_id: null,
        paypal_plan_id: null
      },
      {
        name: 'Premium',
        slug: 'premium',
        description: 'Accès complet avec fonctionnalités avancées et contenu exclusif',
        price: 9.99,
        currency: 'EUR',
        billing_cycle: 'monthly',
        trial_days: 7,
        features: {
          dictionary_access: true,
          advanced_search: true,
          audio_hd: true,
          favorites_unlimited: true,
          forum_advanced: true,
          mobile_app: true,
          offline_access: true,
          premium_content: true,
          export_tools: true,
          customer_support: 'email'
        },
        limits: {
          daily_searches: -1, // Illimité
          max_favorites: -1,
          daily_contributions: 25,
          forum_posts_per_day: 50,
          api_calls_per_month: 1000,
          premium_content: true,
          offline_access: true,
          advanced_analytics: true
        },
        is_active: true,
        is_featured: true,
        sort_order: 2,
        color: '#3B82F6',
        icon: '💎',
        stripe_price_id: null, // À configurer
        paypal_plan_id: null
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: 'Solution complète pour enseignants, chercheurs et institutions',
        price: 29.99,
        currency: 'EUR',
        billing_cycle: 'monthly',
        trial_days: 14,
        features: {
          dictionary_access: true,
          advanced_search: true,
          audio_hd: true,
          favorites_unlimited: true,
          forum_advanced: true,
          mobile_app: true,
          offline_access: true,
          premium_content: true,
          export_tools: true,
          teacher_tools: true,
          analytics_dashboard: true,
          api_access: true,
          priority_support: true,
          custom_integrations: true,
          customer_support: 'phone'
        },
        limits: {
          daily_searches: -1,
          max_favorites: -1,
          daily_contributions: 100,
          forum_posts_per_day: -1,
          api_calls_per_month: 10000,
          premium_content: true,
          offline_access: true,
          advanced_analytics: true,
          teacher_dashboard: true,
          bulk_operations: true
        },
        is_active: true,
        is_featured: false,
        sort_order: 3,
        color: '#10B981',
        icon: '🏆',
        stripe_price_id: null, // À configurer
        paypal_plan_id: null
      }
    ];
  }

  /**
   * 🔍 Récupérer tous les plans actifs
   */
  async getAllPlans() {
    try {
      if (this.models && this.models.Plan) {
        const plans = await this.models.Plan.findAll({
          where: { is_active: true },
          order: [['sort_order', 'ASC']]
        });
        return plans;
      } else {
        // Mode mock
        logger.warn('Mode mock: getAllPlans');
        return this.defaultPlans.filter(plan => plan.is_active);
      }
    } catch (error) {
      logger.error('Erreur getAllPlans:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 Récupérer un plan par slug
   */
  async getPlanBySlug(slug) {
    try {
      if (this.models && this.models.Plan) {
        const plan = await this.models.Plan.findOne({
          where: { slug, is_active: true }
        });
        return plan;
      } else {
        // Mode mock
        logger.warn('Mode mock: getPlanBySlug');
        return this.defaultPlans.find(plan => plan.slug === slug && plan.is_active);
      }
    } catch (error) {
      logger.error('Erreur getPlanBySlug:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 Récupérer un plan par ID
   */
  async getPlanById(id) {
    try {
      if (this.models && this.models.Plan) {
        const plan = await this.models.Plan.findByPk(id);
        return plan;
      } else {
        // Mode mock
        logger.warn('Mode mock: getPlanById');
        return this.defaultPlans.find(plan => plan.id === id);
      }
    } catch (error) {
      logger.error('Erreur getPlanById:', error.message);
      throw error;
    }
  }

  /**
   * 🆓 Récupérer le plan gratuit
   */
  async getFreePlan() {
    try {
      return await this.getPlanBySlug('free');
    } catch (error) {
      logger.error('Erreur getFreePlan:', error.message);
      throw error;
    }
  }

  /**
   * ⭐ Récupérer le plan en vedette
   */
  async getFeaturedPlan() {
    try {
      if (this.models && this.models.Plan) {
        const plan = await this.models.Plan.findOne({
          where: { is_featured: true, is_active: true }
        });
        return plan;
      } else {
        // Mode mock
        return this.defaultPlans.find(plan => plan.is_featured && plan.is_active);
      }
    } catch (error) {
      logger.error('Erreur getFeaturedPlan:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Comparer les plans (matrice des fonctionnalités)
   */
  async comparePlans() {
    try {
      const plans = await this.getAllPlans();
      
      // Extraire toutes les fonctionnalités et limites
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
          is_featured: plan.is_featured,
          color: plan.color,
          icon: plan.icon,
          features: plan.features,
          limits: plan.limits
        })),
        feature_matrix: Array.from(allFeatures),
        limit_matrix: Array.from(allLimits)
      };
    } catch (error) {
      logger.error('Erreur comparePlans:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Matrice des fonctionnalités
   */
  async getFeatureMatrix() {
    try {
      const comparison = await this.comparePlans();
      return {
        features: comparison.feature_matrix,
        limits: comparison.limit_matrix,
        plans: comparison.plans
      };
    } catch (error) {
      logger.error('Erreur getFeatureMatrix:', error.message);
      throw error;
    }
  }

  /**
   * ✨ Créer un nouveau plan
   */
  async createPlan(planData) {
    try {
      if (!this.models || !this.models.Plan) {
        throw new Error('Modèles non disponibles pour createPlan');
      }

      // Validation des données requises
      if (!planData.name || !planData.slug) {
        throw new Error('Nom et slug requis');
      }

      // Vérifier l'unicité du slug
      const existingPlan = await this.models.Plan.findOne({
        where: { slug: planData.slug }
      });

      if (existingPlan) {
        throw new Error('Un plan avec ce slug existe déjà');
      }

      // Valeurs par défaut
      const plan = await this.models.Plan.create({
        name: planData.name,
        slug: planData.slug,
        description: planData.description || '',
        price: planData.price || 0.00,
        currency: planData.currency || 'EUR',
        billing_cycle: planData.billing_cycle || 'monthly',
        trial_days: planData.trial_days || 0,
        features: planData.features || {},
        limits: planData.limits || {},
        is_active: planData.is_active !== undefined ? planData.is_active : true,
        is_featured: planData.is_featured || false,
        sort_order: planData.sort_order || 0,
        color: planData.color || '#6B7280',
        icon: planData.icon || '📦',
        stripe_price_id: planData.stripe_price_id || null,
        paypal_plan_id: planData.paypal_plan_id || null
      });

      logger.info('Plan créé:', plan.slug);
      return plan;

    } catch (error) {
      logger.error('Erreur createPlan:', error.message);
      throw error;
    }
  }

  /**
   * 📝 Mettre à jour un plan
   */
  async updatePlan(planId, updates) {
    try {
      if (!this.models || !this.models.Plan) {
        throw new Error('Modèles non disponibles pour updatePlan');
      }

      const plan = await this.models.Plan.findByPk(planId);
      if (!plan) {
        throw new Error('Plan non trouvé');
      }

      // Vérifier l'unicité du slug si modifié
      if (updates.slug && updates.slug !== plan.slug) {
        const existingPlan = await this.models.Plan.findOne({
          where: { slug: updates.slug }
        });
        if (existingPlan) {
          throw new Error('Un plan avec ce slug existe déjà');
        }
      }

      await plan.update(updates);
      logger.info('Plan mis à jour:', plan.slug);
      return plan;

    } catch (error) {
      logger.error('Erreur updatePlan:', error.message);
      throw error;
    }
  }

  /**
   * 🗑️ Supprimer un plan (soft delete)
   */
  async deletePlan(planId) {
    try {
      if (!this.models || !this.models.Plan) {
        throw new Error('Modèles non disponibles pour deletePlan');
      }

      const plan = await this.models.Plan.findByPk(planId);
      if (!plan) {
        throw new Error('Plan non trouvé');
      }

      // Vérifier qu'il n'y a pas d'abonnements actifs
      if (this.models.Subscription) {
        const activeSubscriptions = await this.models.Subscription.count({
          where: { 
            plan_id: planId, 
            status: ['active', 'trialing'] 
          }
        });

        if (activeSubscriptions > 0) {
          throw new Error('Impossible de supprimer un plan avec des abonnements actifs');
        }
      }

      // Désactiver plutôt que supprimer
      await plan.update({ is_active: false });
      logger.info('Plan désactivé:', plan.slug);
      return true;

    } catch (error) {
      logger.error('Erreur deletePlan:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Vérifier si un utilisateur peut accéder à une fonctionnalité
   */
  async checkFeatureAccess(planSlug, featureName) {
    try {
      const plan = await this.getPlanBySlug(planSlug);
      if (!plan) {
        return false;
      }

      return plan.features[featureName] === true;
    } catch (error) {
      logger.error('Erreur checkFeatureAccess:', error.message);
      return false;
    }
  }

  /**
   * 🔢 Récupérer la limite d'usage pour un plan
   */
  async getUsageLimit(planSlug, limitType) {
    try {
      const plan = await this.getPlanBySlug(planSlug);
      if (!plan) {
        return 0;
      }

      const limit = plan.limits[limitType];
      return limit !== undefined ? limit : 0;
    } catch (error) {
      logger.error('Erreur getUsageLimit:', error.message);
      return 0;
    }
  }

  /**
   * 💰 Calculer le prix avec remises éventuelles
   */
  calculatePrice(plan, options = {}) {
    let price = parseFloat(plan.price);
    
    // Remise annuelle (-17% standard)
    if (options.yearly && plan.billing_cycle === 'monthly') {
      price = price * 12 * 0.83; // 17% de remise
    }

    // Remises spéciales
    if (options.discount_percent) {
      price = price * (1 - options.discount_percent / 100);
    }

    return Math.round(price * 100) / 100; // Arrondir à 2 décimales
  }

  /**
   * 🔧 Assurer la présence des plans par défaut
   */
  async ensureDefaultPlans() {
    try {
      if (!this.models || !this.models.Plan) {
        logger.warn('Modèles non disponibles, plans par défaut non créés');
        return;
      }

      for (const defaultPlan of this.defaultPlans) {
        const existingPlan = await this.models.Plan.findOne({
          where: { slug: defaultPlan.slug }
        });

        if (!existingPlan) {
          await this.models.Plan.create(defaultPlan);
          logger.info('Plan par défaut créé:', defaultPlan.slug);
        }
      }

    } catch (error) {
      logger.error('Erreur ensureDefaultPlans:', error.message);
      // Non-bloquant
    }
  }

  /**
   * 📊 Statistiques des plans
   */
  async getPlanStats() {
    try {
      if (!this.models || !this.models.Plan || !this.models.Subscription) {
        logger.warn('Mode mock: getPlanStats');
        return {
          total_plans: this.defaultPlans.length,
          active_plans: this.defaultPlans.filter(p => p.is_active).length
        };
      }

      const plans = await this.models.Plan.findAll({
        include: [
          {
            model: this.models.Subscription,
            as: 'subscriptions',
            where: { status: ['active', 'trialing'] },
            required: false
          }
        ]
      });

      return plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        price: plan.price,
        active_subscriptions: plan.subscriptions ? plan.subscriptions.length : 0,
        monthly_revenue: plan.subscriptions ? 
          plan.subscriptions.length * parseFloat(plan.price) : 0
      }));

    } catch (error) {
      logger.error('Erreur getPlanStats:', error.message);
      throw error;
    }
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasModels: !!this.models,
      defaultPlansCount: this.defaultPlans.length,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new PlanService();