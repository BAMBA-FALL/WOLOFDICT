// =============================================================================
// 💳 WOLOFDICT - SUBSCRIPTIONSERVICE AVEC PARTENAIRES
// Service de gestion des abonnements avec logique métier et partenaires
// =============================================================================

const logger = require('./LoggerService');
const { Op } = require('sequelize');

class SubscriptionService {
  constructor() {
    this.isInitialized = false;
    this.name = 'SubscriptionService';
    this.models = null;
    
    // Statistiques en cache
    this.stats = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      trialingSubscriptions: 0,
      canceledSubscriptions: 0,
      expiredSubscriptions: 0,
      pastDueSubscriptions: 0,
      unpaidSubscriptions: 0,
      currentMRR: 0,
      partnerSubscriptions: 0,
      partnerRevenue: 0
    };
  }

  async initialize() {
    try {
      // Import des modèles Sequelize
      try {
        this.models = require('../models');
        logger.info('Modèles Sequelize chargés dans SubscriptionService');
      } catch (error) {
        logger.warn('Modèles Sequelize non disponibles, mode mock activé');
      }
      
      // Mettre à jour les statistiques initiales
      await this.updateStats();
      
      this.isInitialized = true;
      logger.info('SubscriptionService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation SubscriptionService:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 Récupérer l'abonnement actuel d'un utilisateur avec partenaire
   */
  async getUserSubscription(userId) {
    try {
      if (!this.models || !this.models.Subscription) {
        logger.warn('Mode mock: getUserSubscription');
        return null;
      }

      const subscription = await this.models.Subscription.scope('active').findOne({
        where: { user_id: userId },
        include: [
          {
            model: this.models.Plan,
            as: 'plan'
          },
          {
            model: this.models.Partner,
            as: 'partner',
            required: false // Left join pour les abonnements sans partenaire
          }
        ],
        order: [['starts_at', 'DESC']]
      });

      return subscription;

    } catch (error) {
      logger.error('Erreur getUserSubscription:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Récupérer les statistiques d'usage avec partenaire
   */
  async getUserUsageStats(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return {
          plan: 'free',
          limits: {},
          current_usage: {},
          percentage_used: {},
          subscription_status: null,
          partner: null
        };
      }

      // Récupérer les limites du plan
      const planLimits = subscription.plan.limits || {};
      
      // Appliquer les modifications de limites du partenaire si applicable
      let effectiveLimits = { ...planLimits };
      if (subscription.partner && subscription.partner.plan_modifications) {
        effectiveLimits = this.applyPartnerModifications(effectiveLimits, subscription.partner.plan_modifications);
      }
      
      // Calculer l'usage actuel
      const currentUsage = await this.calculateCurrentUsage(userId);
      
      // Calculer les pourcentages d'utilisation
      const percentageUsed = {};
      Object.keys(effectiveLimits).forEach(limitType => {
        const limit = effectiveLimits[limitType];
        const used = currentUsage[limitType] || 0;
        
        if (limit > 0) {
          percentageUsed[limitType] = Math.round((used / limit) * 100);
        } else if (limit === -1) {
          percentageUsed[limitType] = 0; // Illimité
        }
      });

      return {
        plan: subscription.plan.slug,
        limits: effectiveLimits,
        current_usage: currentUsage,
        percentage_used: percentageUsed,
        subscription_status: subscription.status,
        expires_at: subscription.expires_at,
        trial_ends_at: subscription.trial_ends_at,
        auto_renew: subscription.auto_renew,
        current_price: subscription.current_price,
        currency: subscription.currency,
        partner: subscription.partner ? {
          id: subscription.partner.id,
          name: subscription.partner.name,
          slug: subscription.partner.slug,
          discount_applied: subscription.partner_discount_applied || 0
        } : null
      };

    } catch (error) {
      logger.error('Erreur getUserUsageStats:', error.message);
      throw error;
    }
  }

  /**
   * 🏢 Appliquer les modifications de partenaire aux limites de plan
   */
  applyPartnerModifications(planLimits, partnerModifications) {
    const modifiedLimits = { ...planLimits };
    
    if (partnerModifications && typeof partnerModifications === 'object') {
      Object.keys(partnerModifications).forEach(limitType => {
        const modification = partnerModifications[limitType];
        
        if (typeof modification === 'object') {
          // Modification complexe avec type et valeur
          const { type, value } = modification;
          const currentLimit = modifiedLimits[limitType] || 0;
          
          switch (type) {
            case 'multiply':
              modifiedLimits[limitType] = currentLimit * value;
              break;
            case 'add':
              modifiedLimits[limitType] = currentLimit + value;
              break;
            case 'set':
              modifiedLimits[limitType] = value;
              break;
          }
        } else {
          // Modification simple - remplacement direct
          modifiedLimits[limitType] = modification;
        }
      });
    }
    
    return modifiedLimits;
  }

  /**
   * 🔢 Calculer l'usage actuel d'un utilisateur
   */
  async calculateCurrentUsage(userId) {
    try {
      if (!this.models) {
        return {};
      }

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const usage = {};

      // Recherches quotidiennes
      if (this.models.SearchLog) {
        const dailySearches = await this.models.SearchLog.count({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: startOfDay }
          }
        });
        usage.daily_searches = dailySearches;
      }

      // Favoris total
      if (this.models.Favorite) {
        const totalFavorites = await this.models.Favorite.count({
          where: { user_id: userId }
        });
        usage.max_favorites = totalFavorites;
      }

      // Contributions quotidiennes
      if (this.models.UserContribution) {
        const dailyContributions = await this.models.UserContribution.count({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: startOfDay }
          }
        });
        usage.daily_contributions = dailyContributions;
      }

      // Posts forum quotidiens
      if (this.models.ForumPost) {
        const dailyPosts = await this.models.ForumPost.count({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: startOfDay }
          }
        });
        usage.forum_posts_per_day = dailyPosts;
      }

      // Appels API mensuels
      if (this.models.APIUsage) {
        const monthlyAPICalls = await this.models.APIUsage.count({
          where: {
            user_id: userId,
            created_at: { [Op.gte]: startOfMonth }
          }
        });
        usage.api_calls_per_month = monthlyAPICalls;
      }

      return usage;

    } catch (error) {
      logger.error('Erreur calculateCurrentUsage:', error.message);
      return {};
    }
  }

  /**
   * 📝 Créer un abonnement gratuit avec partenaire optionnel
   */
  async createFreeSubscription(userId, planId = null, partnerId = null) {
    try {
      if (!this.models || !this.models.Subscription) {
        logger.warn('Mode mock: createFreeSubscription');
        return {
          id: Date.now(),
          user_id: userId,
          plan_id: planId,
          partner_id: partnerId,
          status: 'active'
        };
      }

      // Récupérer le plan gratuit si pas spécifié
      if (!planId) {
        const freePlan = await this.models.Plan.findOne({
          where: { slug: 'free' }
        });
        if (!freePlan) {
          throw new Error('Plan gratuit non trouvé');
        }
        planId = freePlan.id;
      }

      // Vérifier qu'il n'y a pas déjà un abonnement actif
      const existingSubscription = await this.models.Subscription.scope('active').findOne({
        where: { user_id: userId }
      });

      if (existingSubscription) {
        logger.info('Abonnement gratuit déjà existant pour utilisateur:', userId);
        return existingSubscription;
      }

      // Récupérer le plan pour connaître le prix
      const plan = await this.models.Plan.findByPk(planId);

      // Vérifier le partenaire si spécifié
      let partner = null;
      if (partnerId) {
        partner = await this.models.Partner.findByPk(partnerId);
        if (!partner || !partner.is_active) {
          logger.warn('Partenaire invalide ou inactif:', partnerId);
          partnerId = null;
        }
      }

      // Créer l'abonnement gratuit
      const subscription = await this.models.Subscription.create({
        user_id: userId,
        plan_id: planId,
        partner_id: partnerId,
        starts_at: new Date(),
        expires_at: null,
        trial_ends_at: null,
        status: 'active',
        auto_renew: false,
        current_price: plan ? plan.price : 0.00,
        currency: plan ? plan.currency : 'EUR',
        stripe_subscription_id: null,
        paypal_subscription_id: null,
        payment_method: null,
        notes: `Abonnement gratuit créé automatiquement${partner ? ' via partenaire ' + partner.name : ''}`,
        usage_data: {},
        partner_discount_applied: 0,
        partner_commission_rate: partner ? partner.commission_rate : 0
      });

      // Log de création d'abonnement avec partenaire
      if (partner) {
        logger.logBusinessEvent('partner_subscription_created', {
          userId: userId,
          partnerId: partnerId,
          partnerName: partner.name,
          plan: 'free'
        });
      }

      logger.info('Abonnement gratuit créé pour utilisateur:', userId);
      await this.updateStats();

      return subscription;

    } catch (error) {
      logger.error('Erreur createFreeSubscription:', error.message);
      throw error;
    }
  }

  /**
   * ⭐ Créer un abonnement premium avec partenaire
   */
  async createPremiumSubscription(userId, planId, paymentData, partnerId = null) {
    try {
      if (!this.models || !this.models.Subscription) {
        throw new Error('Modèles non disponibles pour createPremiumSubscription');
      }

      // Récupérer le plan
      const plan = await this.models.Plan.findByPk(planId);
      if (!plan) {
        throw new Error('Plan non trouvé');
      }

      // Vérifier le partenaire si spécifié
      let partner = null;
      let discountAmount = 0;
      let finalPrice = plan.price;

      if (partnerId) {
        partner = await this.models.Partner.findByPk(partnerId);
        if (!partner || !partner.is_active) {
          throw new Error('Partenaire invalide ou inactif');
        }

        // Calculer la remise partenaire
        if (partner.discount_type === 'percentage' && partner.discount_value > 0) {
          discountAmount = (plan.price * partner.discount_value) / 100;
          finalPrice = plan.price - discountAmount;
        } else if (partner.discount_type === 'fixed' && partner.discount_value > 0) {
          discountAmount = Math.min(partner.discount_value, plan.price);
          finalPrice = plan.price - discountAmount;
        }

        // Log de l'application de remise partenaire
        logger.logBusinessEvent('partner_discount_applied', {
          userId: userId,
          partnerId: partnerId,
          partnerName: partner.name,
          originalPrice: plan.price,
          discountAmount: discountAmount,
          finalPrice: finalPrice,
          discountType: partner.discount_type
        });
      }

      // Annuler l'abonnement actuel s'il existe
      await this.cancelCurrentSubscription(userId);

      // Calculer les dates
      const startsAt = new Date();
      let expiresAt = null;
      let trialEndsAt = null;

      if (plan.trial_days > 0) {
        trialEndsAt = new Date(startsAt.getTime() + (plan.trial_days * 24 * 60 * 60 * 1000));
      }

      if (plan.billing_cycle !== 'lifetime') {
        const months = plan.billing_cycle === 'yearly' ? 12 : 1;
        expiresAt = new Date(startsAt);
        expiresAt.setMonth(expiresAt.getMonth() + months);
      }

      // Créer l'abonnement premium
      const subscription = await this.models.Subscription.create({
        user_id: userId,
        plan_id: planId,
        partner_id: partnerId,
        starts_at: startsAt,
        expires_at: expiresAt,
        trial_ends_at: trialEndsAt,
        canceled_at: null,
        status: plan.trial_days > 0 ? 'trialing' : 'active',
        auto_renew: true,
        current_price: finalPrice,
        currency: plan.currency,
        stripe_subscription_id: paymentData.stripe_subscription_id || null,
        paypal_subscription_id: paymentData.paypal_subscription_id || null,
        payment_method: paymentData.payment_method || 'stripe',
        notes: `Abonnement premium créé via ${paymentData.payment_method || 'stripe'}${partner ? ' avec partenaire ' + partner.name : ''}`,
        cancellation_reason: null,
        usage_data: {},
        partner_discount_applied: discountAmount,
        partner_commission_rate: partner ? partner.commission_rate : 0
      });

      // Log transactionnel avec partenaire
      logger.logTransaction('subscription_created', userId, planId, finalPrice, {
        subscriptionId: subscription.id,
        paymentMethod: paymentData.payment_method,
        currency: plan.currency,
        status: subscription.status,
        expiresAt: subscription.expires_at,
        partnerId: partnerId,
        partnerName: partner ? partner.name : null,
        originalPrice: plan.price,
        discountApplied: discountAmount
      });

      // Log événement métier avec partenaire
      logger.logBusinessEvent('user_upgraded', {
        userId: userId,
        fromPlan: 'free',
        toPlan: plan.slug,
        upgradeValue: finalPrice,
        trialPeriod: plan.trial_days > 0,
        partnerId: partnerId,
        partnerName: partner ? partner.name : null
      });

      logger.info('Abonnement premium créé:', {
        user_id: userId,
        plan: plan.slug,
        status: subscription.status,
        partner: partner ? partner.name : null
      });

      await this.updateStats();
      return subscription;

    } catch (error) {
      // Log d'échec avec partenaire
      logger.logTransaction('subscription_create_failed', userId, planId, null, {
        error: error.message,
        paymentMethod: paymentData.payment_method,
        errorCode: error.code,
        partnerId: partnerId
      });
      
      logger.error('Erreur createPremiumSubscription:', error.message);
      throw error;
    }
  }

  /**
   * 🔄 Changer de plan avec gestion partenaire
   */
  async changePlan(userId, newPlanId, paymentData = {}, newPartnerId = null) {
    try {
      if (!this.models || !this.models.Subscription) {
        throw new Error('Modèles non disponibles pour changePlan');
      }

      // Récupérer l'abonnement actuel
      const currentSubscription = await this.getUserSubscription(userId);
      if (!currentSubscription) {
        throw new Error('Aucun abonnement actuel trouvé');
      }

      // Récupérer le nouveau plan
      const newPlan = await this.models.Plan.findByPk(newPlanId);
      if (!newPlan) {
        throw new Error('Nouveau plan non trouvé');
      }

      // Gestion du partenaire
      let partner = null;
      let discountAmount = 0;
      let finalPrice = newPlan.price;

      if (newPartnerId) {
        partner = await this.models.Partner.findByPk(newPartnerId);
        if (!partner || !partner.is_active) {
          throw new Error('Partenaire invalide ou inactif');
        }

        // Calculer la remise partenaire
        if (partner.discount_type === 'percentage' && partner.discount_value > 0) {
          discountAmount = (newPlan.price * partner.discount_value) / 100;
          finalPrice = newPlan.price - discountAmount;
        } else if (partner.discount_type === 'fixed' && partner.discount_value > 0) {
          discountAmount = Math.min(partner.discount_value, newPlan.price);
          finalPrice = newPlan.price - discountAmount;
        }
      }

      // Calculer les nouvelles dates
      const now = new Date();
      let newExpiresAt = currentSubscription.expires_at;

      if (newPlan.billing_cycle !== 'lifetime' && newPlan.slug !== 'free') {
        const months = newPlan.billing_cycle === 'yearly' ? 12 : 1;
        newExpiresAt = new Date(now);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + months);
      } else if (newPlan.slug === 'free') {
        newExpiresAt = null;
      }

      // Mettre à jour l'abonnement
      await currentSubscription.update({
        plan_id: newPlanId,
        partner_id: newPartnerId,
        current_price: finalPrice,
        currency: newPlan.currency,
        expires_at: newExpiresAt,
        auto_renew: newPlan.slug !== 'free',
        status: newPlan.slug === 'free' ? 'active' : currentSubscription.status,
        stripe_subscription_id: paymentData.stripe_subscription_id || currentSubscription.stripe_subscription_id,
        paypal_subscription_id: paymentData.paypal_subscription_id || currentSubscription.paypal_subscription_id,
        payment_method: paymentData.payment_method || currentSubscription.payment_method,
        notes: `${currentSubscription.notes || ''}\nPlan changé de ${currentSubscription.plan.slug} vers ${newPlan.slug} le ${now.toISOString()}${partner ? ' avec partenaire ' + partner.name : ''}`,
        partner_discount_applied: discountAmount,
        partner_commission_rate: partner ? partner.commission_rate : 0
      });

      // Log du changement de plan avec partenaire
      logger.logBusinessEvent('plan_changed', {
        userId: userId,
        oldPlan: currentSubscription.plan.slug,
        newPlan: newPlan.slug,
        oldPrice: currentSubscription.current_price,
        newPrice: finalPrice,
        partnerId: newPartnerId,
        partnerName: partner ? partner.name : null,
        discountApplied: discountAmount
      });

      logger.info('Plan changé:', {
        user_id: userId,
        old_plan: currentSubscription.plan.slug,
        new_plan: newPlan.slug,
        partner: partner ? partner.name : null
      });

      await this.updateStats();
      return currentSubscription;

    } catch (error) {
      logger.error('Erreur changePlan:', error.message);
      throw error;
    }
  }

  /**
   * ❌ Annuler un abonnement avec tracking partenaire
   */
  async cancelSubscription(userId, reason = null) {
    try {
      if (!this.models || !this.models.Subscription) {
        throw new Error('Modèles non disponibles pour cancelSubscription');
      }

      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        throw new Error('Aucun abonnement actif trouvé');
      }

      // Log événement métier de rétention avec partenaire
      logger.logBusinessEvent('subscription_cancellation', {
        userId: userId,
        planSlug: subscription.plan.slug,
        reason: reason,
        subscriptionAge: this.calculateSubscriptionAge(subscription),
        revenueImpact: subscription.current_price,
        partnerId: subscription.partner_id,
        partnerName: subscription.partner ? subscription.partner.name : null
      });

      // Mettre à jour le statut
      await subscription.update({
        status: 'canceled',
        canceled_at: new Date(),
        auto_renew: false,
        cancellation_reason: reason,
        notes: `${subscription.notes || ''}\nAnnulé le ${new Date().toISOString()} - Raison: ${reason || 'Non spécifiée'}`
      });

      // Log transactionnel avec partenaire
      logger.logTransaction('subscription_canceled', userId, subscription.plan_id, 0, {
        subscriptionId: subscription.id,
        reason: reason,
        refundEligible: this.isRefundEligible(subscription),
        partnerId: subscription.partner_id,
        partnerName: subscription.partner ? subscription.partner.name : null
      });

      // Créer un abonnement gratuit automatiquement
      const freePlan = await this.models.Plan.findOne({
        where: { slug: 'free' }
      });

      if (freePlan) {
        await this.createFreeSubscription(userId, freePlan.id);
      }

      logger.info('Abonnement annulé:', {
        user_id: userId,
        plan: subscription.plan.slug,
        reason: reason,
        partner: subscription.partner ? subscription.partner.name : null
      });

      await this.updateStats();
      return subscription;

    } catch (error) {
      logger.logService('SubscriptionService', 'cancelSubscription', 'error', {
        userId, reason, error: error.message
      });
      throw error;
    }
  }

  /**
   * 📊 Mettre à jour les statistiques avec partenaires
   */
  async updateStats() {
    try {
      if (!this.models || !this.models.Subscription) {
        return;
      }

      // Statistiques par statut
      const statusStats = await this.models.Subscription.findAll({
        attributes: [
          'status',
          [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // Statistiques partenaires
      const partnerStats = await this.models.Subscription.findAll({
        attributes: [
          [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'count'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.col('current_price')), 'revenue']
        ],
        where: {
          partner_id: { [Op.not]: null },
          status: ['active', 'trialing']
        },
        raw: true
      });

      // Reset des stats
      this.stats = {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        trialingSubscriptions: 0,
        canceledSubscriptions: 0,
        expiredSubscriptions: 0,
        pastDueSubscriptions: 0,
        unpaidSubscriptions: 0,
        currentMRR: 0,
        partnerSubscriptions: 0,
        partnerRevenue: 0
      };

      // Calculer les statistiques par statut
      statusStats.forEach(stat => {
        const status = stat.status;
        const count = parseInt(stat.count);
        
        this.stats.totalSubscriptions += count;
        
        switch (status) {
          case 'active':
            this.stats.activeSubscriptions = count;
            break;
          case 'trialing':
            this.stats.trialingSubscriptions = count;
            break;
          case 'canceled':
            this.stats.canceledSubscriptions = count;
            break;
          case 'expired':
            this.stats.expiredSubscriptions = count;
            break;
          case 'past_due':
            this.stats.pastDueSubscriptions = count;
            break;
          case 'unpaid':
            this.stats.unpaidSubscriptions = count;
            break;
        }
      });

      // Calculer les statistiques partenaires
      if (partnerStats.length > 0) {
        this.stats.partnerSubscriptions = parseInt(partnerStats[0].count || 0);
        this.stats.partnerRevenue = parseFloat(partnerStats[0].revenue || 0);
      }

      // Calculer le MRR
      this.stats.currentMRR = await this.calculateMRR();

    } catch (error) {
      logger.error('Erreur updateStats:', error.message);
    }
  }

  /**
   * 💰 Calculer les revenus mensuels récurrents avec partenaires
   */
  async calculateMRR() {
    try {
      if (!this.models || !this.models.Subscription) {
        logger.warn('Mode mock: calculateMRR');
        return 0;
      }

      const activeSubscriptions = await this.models.Subscription.scope('active').findAll({
        include: [
          {
            model: this.models.Plan,
            as: 'plan'
          }
        ]
      });

      let mrr = 0;

      activeSubscriptions.forEach(subscription => {
        const price = parseFloat(subscription.current_price);
        
        // Convertir en montant mensuel
        if (subscription.plan.billing_cycle === 'yearly') {
          mrr += price / 12;
        } else if (subscription.plan.billing_cycle === 'monthly') {
          mrr += price;
        }
      });

      return Math.round(mrr * 100) / 100;

    } catch (error) {
      logger.error('Erreur calculateMRR:', error.message);
      return 0;
    }
  }

  /**
   * 🏢 Obtenir les statistiques par partenaire
   */
  async getStatsByPartner() {
    try {
      if (!this.models || !this.models.Subscription) {
        logger.warn('Mode mock: getStatsByPartner');
        return [];
      }

      const partnerStats = await this.models.Subscription.findAll({
        attributes: [
          'partner_id',
          'status',
          [this.models.sequelize.fn('COUNT', '*'), 'count'],
          [this.models.sequelize.fn('SUM', 'current_price'), 'total_revenue'],
          [this.models.sequelize.fn('SUM', 'partner_discount_applied'), 'total_discounts'],
          [this.models.sequelize.fn('AVG', 'partner_commission_rate'), 'avg_commission_rate']
        ],
        include: [
          {
            model: this.models.Partner,
            as: 'partner',
            attributes: ['slug', 'name'],
            required: true
          }
        ],
        where: {
          partner_id: { [Op.not]: null }
        },
        group: ['partner_id', 'status', 'partner.id'],
        raw: true
      });

      // Organiser les données par partenaire
      const partnerData = {};
      
      partnerStats.forEach(stat => {
        const partnerSlug = stat['partner.slug'];
        const partnerName = stat['partner.name'];
        const status = stat.status;
        const count = parseInt(stat.count);
        const revenue = parseFloat(stat.total_revenue || 0);
        const discounts = parseFloat(stat.total_discounts || 0);
        const commissionRate = parseFloat(stat.avg_commission_rate || 0);

        if (!partnerData[partnerSlug]) {
          partnerData[partnerSlug] = {
            name: partnerName,
            total_subscribers: 0,
            active_subscribers: 0,
            trialing_subscribers: 0,
            canceled_subscribers: 0,
            total_revenue: 0,
            total_discounts: 0,
            estimated_commission: 0,
            avg_commission_rate: commissionRate
          };
        }

        partnerData[partnerSlug].total_subscribers += count;
        partnerData[partnerSlug].total_revenue += revenue;
        partnerData[partnerSlug].total_discounts += discounts;
        partnerData[partnerSlug].estimated_commission += revenue * (commissionRate / 100);

        switch (status) {
          case 'active':
            partnerData[partnerSlug].active_subscribers = count;
            break;
          case 'trialing':
            partnerData[partnerSlug].trialing_subscribers = count;
            break;
          case 'canceled':
            partnerData[partnerSlug].canceled_subscribers = count;
            break;
        }
      });

      return Object.entries(partnerData).map(([slug, data]) => ({
        partner: slug,
        ...data,
        estimated_commission: Math.round(data.estimated_commission * 100) / 100
      }));

    } catch (error) {
      logger.error('Erreur getStatsByPartner:', error.message);
      return [];
    }
  }

  /**
   * 🏢 Créer un abonnement via code promotionnel partenaire
   */
  async createSubscriptionWithPromoCode(userId, planId, promoCode, paymentData) {
    try {
      if (!this.models || !this.models.Partner) {
        throw new Error('Modèles non disponibles');
      }

      // Rechercher le partenaire par code promo
      const partner = await this.models.Partner.findOne({
        where: {
          promo_code: promoCode,
          is_active: true
        }
      });

      if (!partner) {
        throw new Error('Code promotionnel invalide ou expiré');
      }

      // Vérifier les limites d'utilisation du code promo
      if (partner.usage_limit > 0) {
        const currentUsage = await this.models.Subscription.count({
          where: {
            partner_id: partner.id,
            status: { [Op.in]: ['active', 'trialing', 'canceled'] }
          }
        });

        if (currentUsage >= partner.usage_limit) {
          throw new Error('Limite d\'utilisation du code promotionnel atteinte');
        }
      }

      // Vérifier si l'utilisateur a déjà utilisé ce code promo
      const existingUsage = await this.models.Subscription.findOne({
        where: {
          user_id: userId,
          partner_id: partner.id
        }
      });

      if (existingUsage && !partner.allow_multiple_use) {
        throw new Error('Code promotionnel déjà utilisé par cet utilisateur');
      }

      // Log de l'utilisation du code promo
      logger.logBusinessEvent('promo_code_used', {
        userId: userId,
        partnerId: partner.id,
        partnerName: partner.name,
        promoCode: promoCode,
        planId: planId
      });

      // Créer l'abonnement avec le partenaire
      return await this.createPremiumSubscription(userId, planId, paymentData, partner.id);

    } catch (error) {
      logger.error('Erreur createSubscriptionWithPromoCode:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 Rechercher des abonnements avec partenaires
   */
  async searchSubscriptions(query, filters = {}) {
    try {
      if (!this.models || !this.models.Subscription) {
        return [];
      }

      const whereClause = { ...filters };

      // Recherche textuelle avec partenaires
      if (query) {
        whereClause[Op.or] = [
          { '$user.email$': { [Op.iLike]: `%${query}%` } },
          { '$user.username$': { [Op.iLike]: `%${query}%` } },
          { '$user.first_name$': { [Op.iLike]: `%${query}%` } },
          { '$user.last_name$': { [Op.iLike]: `%${query}%` } },
          { notes: { [Op.iLike]: `%${query}%` } }
        ];
      }

      return await this.models.Subscription.findAll({
        where: whereClause,
        include: [
          {
            model: this.models.Plan,
            as: 'plan',
            attributes: ['slug', 'name', 'price']
          },
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'email', 'username', 'first_name', 'last_name']
          },
          {
            model: this.models.Partner,
            as: 'partner',
            attributes: ['id', 'name', 'slug', 'commission_rate'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 50
      });

    } catch (error) {
      logger.error('Erreur searchSubscriptions:', error.message);
      return [];
    }
  }

  /**
   * 💳 Calculer la commission partenaire pour un abonnement
   */
  calculatePartnerCommission(subscription) {
    if (!subscription.partner_id || !subscription.partner_commission_rate) {
      return 0;
    }

    const revenue = parseFloat(subscription.current_price || 0);
    const commissionRate = parseFloat(subscription.partner_commission_rate || 0);
    
    return Math.round((revenue * commissionRate / 100) * 100) / 100;
  }

  /**
   * 📊 Générer un rapport de commissions partenaires
   */
  async generatePartnerCommissionReport(partnerId, startDate, endDate) {
    try {
      if (!this.models || !this.models.Subscription) {
        throw new Error('Modèles non disponibles');
      }

      const partner = await this.models.Partner.findByPk(partnerId);
      if (!partner) {
        throw new Error('Partenaire non trouvé');
      }

      // Récupérer tous les abonnements du partenaire dans la période
      const subscriptions = await this.models.Subscription.findAll({
        where: {
          partner_id: partnerId,
          starts_at: { [Op.between]: [startDate, endDate] },
          status: { [Op.in]: ['active', 'trialing', 'canceled', 'expired'] }
        },
        include: [
          {
            model: this.models.Plan,
            as: 'plan',
            attributes: ['slug', 'name', 'billing_cycle']
          },
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'email', 'username']
          }
        ]
      });

      let totalCommission = 0;
      let totalRevenue = 0;
      let totalDiscounts = 0;
      const subscriptionDetails = [];

      subscriptions.forEach(subscription => {
        const revenue = parseFloat(subscription.current_price || 0);
        const discount = parseFloat(subscription.partner_discount_applied || 0);
        const commission = this.calculatePartnerCommission(subscription);

        totalRevenue += revenue;
        totalDiscounts += discount;
        totalCommission += commission;

        subscriptionDetails.push({
          subscription_id: subscription.id,
          user_email: subscription.user.email,
          plan: subscription.plan.slug,
          starts_at: subscription.starts_at,
          status: subscription.status,
          revenue: revenue,
          discount_applied: discount,
          commission: commission
        });
      });

      return {
        partner: {
          id: partner.id,
          name: partner.name,
          slug: partner.slug,
          commission_rate: partner.commission_rate
        },
        period: {
          start: startDate,
          end: endDate
        },
        summary: {
          total_subscriptions: subscriptions.length,
          total_revenue: Math.round(totalRevenue * 100) / 100,
          total_discounts: Math.round(totalDiscounts * 100) / 100,
          total_commission: Math.round(totalCommission * 100) / 100,
          average_commission_per_subscription: subscriptions.length > 0 ? 
            Math.round((totalCommission / subscriptions.length) * 100) / 100 : 0
        },
        subscriptions: subscriptionDetails
      };

    } catch (error) {
      logger.error('Erreur generatePartnerCommissionReport:', error.message);
      throw error;
    }
  }

  /**
   * ⏰ Traiter les abonnements expirés avec gestion partenaire
   */
  async processExpiredSubscriptions() {
    const startTime = Date.now();
        
    try {
      if (!this.models || !this.models.Subscription) {
        logger.warn('Mode mock: processExpiredSubscriptions');
        return 0;
      }

      // Log de début de maintenance
      logger.logService('SubscriptionService', 'processExpiredSubscriptions', 'start');

      const now = new Date();
      
      // Rechercher les abonnements expirés
      const expiredSubscriptions = await this.models.Subscription.findAll({
        where: {
          expires_at: { [Op.lt]: now },
          status: ['active', 'past_due']
        },
        include: [
          {
            model: this.models.Plan,
            as: 'plan'
          },
          {
            model: this.models.Partner,
            as: 'partner',
            required: false
          }
        ]
      });

      let processedCount = 0;

      for (const subscription of expiredSubscriptions) {
        try {
          if (subscription.auto_renew) {
            // Log de tentative de renouvellement avec partenaire
            logger.logTransaction('auto_renewal_attempt', subscription.user_id, subscription.plan_id, subscription.current_price, {
              subscriptionId: subscription.id,
              paymentMethod: subscription.payment_method,
              partnerId: subscription.partner_id,
              partnerName: subscription.partner ? subscription.partner.name : null
            });
            
            // Marquer comme past_due
            await subscription.update({ 
              status: 'past_due',
              notes: `${subscription.notes || ''}\nMarqué past_due le ${now.toISOString()} - tentative renouvellement`
            });
          } else {
            // Log d'expiration sans renouvellement avec partenaire
            logger.logBusinessEvent('subscription_expired', {
              userId: subscription.user_id,
              planSlug: subscription.plan.slug,
              subscriptionAge: this.calculateSubscriptionAge(subscription),
              autoRenew: false,
              partnerId: subscription.partner_id,
              partnerName: subscription.partner ? subscription.partner.name : null
            });
            
            // Marquer comme expiré
            await subscription.update({ 
              status: 'expired',
              notes: `${subscription.notes || ''}\nExpiré le ${now.toISOString()}`
            });
            
            // Créer un abonnement gratuit
            await this.createFreeSubscription(subscription.user_id);
          }
          
          processedCount++;
          
        } catch (error) {
          // Log d'erreur pour un abonnement spécifique
          logger.logService('SubscriptionService', 'processExpiredSubscription', 'error', {
            subscriptionId: subscription.id,
            userId: subscription.user_id,
            partnerId: subscription.partner_id,
            error: error.message
          });
        }
      }

      // Traiter les essais expirés
      const expiredTrials = await this.models.Subscription.findAll({
        where: {
          trial_ends_at: { [Op.lt]: now },
          status: 'trialing'
        },
        include: [
          {
            model: this.models.Partner,
            as: 'partner',
            required: false
          }
        ]
      });

      for (const trial of expiredTrials) {
        try {
          // Log d'expiration d'essai avec partenaire
          if (trial.partner) {
            logger.logBusinessEvent('partner_trial_expired', {
              userId: trial.user_id,
              partnerId: trial.partner_id,
              partnerName: trial.partner.name,
              planId: trial.plan_id
            });
          }

          // Convertir en abonnement expiré
          await trial.update({ 
            status: 'expired',
            trial_ends_at: null,
            notes: `${trial.notes || ''}\nEssai expiré le ${now.toISOString()}`
          });
          
          // Créer un abonnement gratuit
          await this.createFreeSubscription(trial.user_id);
          processedCount++;
          
        } catch (error) {
          logger.error('Erreur traitement essai expiré:', {
            subscription_id: trial.id,
            partner_id: trial.partner_id,
            error: error.message
          });
        }
      }

      const processingTime = Date.now() - startTime;

      // Log de fin de maintenance avec métriques
      logger.logService('SubscriptionService', 'processExpiredSubscriptions', 'success', {
        processedCount: processedCount,
        totalExpired: expiredSubscriptions.length + expiredTrials.length,
        processingTime: processingTime,
        averageTimePerSubscription: processedCount > 0 ? processingTime / processedCount : 0
      });

      await this.updateStats();
      return processedCount;

    } catch (error) {
      logger.logService('SubscriptionService', 'processExpiredSubscriptions', 'error', {
        error: error.message,
        processingTime: Date.now() - startTime
      });
      return 0;
    }
  }

  /**
   * 🏢 Obtenir les métriques détaillées avec partenaires
   */
  async getDetailedMetrics(startDate = null, endDate = null) {
    try {
      if (!this.models || !this.models.Subscription) {
        logger.warn('Mode mock: getDetailedMetrics');
        return {};
      }

      const now = new Date();
      const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate || now;

      // Métriques générales
      const baseMetrics = await this.getBaseMetrics(start, end);

      // Métriques partenaires
      const partnerMetrics = await this.getPartnerMetrics(start, end);

      return {
        ...baseMetrics,
        partner_metrics: partnerMetrics
      };

    } catch (error) {
      logger.error('Erreur getDetailedMetrics:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Obtenir les métriques de base
   */
  async getBaseMetrics(startDate, endDate) {
    const newSubscriptions = await this.models.Subscription.count({
      where: {
        starts_at: { [Op.between]: [startDate, endDate] },
        status: { [Op.ne]: 'canceled' }
      }
    });

    const canceledSubscriptions = await this.models.Subscription.count({
      where: {
        canceled_at: { [Op.between]: [startDate, endDate] }
      }
    });

    const totalAtStart = await this.models.Subscription.count({
      where: {
        starts_at: { [Op.lt]: startDate },
        status: { [Op.in]: ['active', 'trialing', 'past_due'] }
      }
    });

    const churnRate = totalAtStart > 0 ? (canceledSubscriptions / totalAtStart) * 100 : 0;

    const revenue = await this.models.Subscription.findAll({
      attributes: [
        [this.models.sequelize.fn('SUM', this.models.sequelize.col('current_price')), 'total_revenue']
      ],
      where: {
        starts_at: { [Op.between]: [startDate, endDate] },
        status: { [Op.in]: ['active', 'trialing'] }
      },
      raw: true
    });

    const totalRevenue = parseFloat(revenue[0]?.total_revenue || 0);

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      new_subscriptions: newSubscriptions,
      canceled_subscriptions: canceledSubscriptions,
      churn_rate: Math.round(churnRate * 100) / 100,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      current_mrr: this.stats.currentMRR,
      active_subscribers: this.stats.activeSubscriptions,
      trial_subscribers: this.stats.trialingSubscriptions
    };
  }

  /**
   * 🏢 Obtenir les métriques partenaires
   */
  async getPartnerMetrics(startDate, endDate) {
    const partnerSubscriptions = await this.models.Subscription.findAll({
      attributes: [
        'partner_id',
        [this.models.sequelize.fn('COUNT', '*'), 'count'],
        [this.models.sequelize.fn('SUM', 'current_price'), 'revenue'],
        [this.models.sequelize.fn('SUM', 'partner_discount_applied'), 'discounts']
      ],
      include: [
        {
          model: this.models.Partner,
          as: 'partner',
          attributes: ['name', 'slug', 'commission_rate']
        }
      ],
      where: {
        partner_id: { [Op.not]: null },
        starts_at: { [Op.between]: [startDate, endDate] }
      },
      group: ['partner_id', 'partner.id'],
      raw: true
    });

    return partnerSubscriptions.map(stat => ({
      partner_name: stat['partner.name'],
      partner_slug: stat['partner.slug'],
      new_subscriptions: parseInt(stat.count),
      revenue: Math.round(parseFloat(stat.revenue || 0) * 100) / 100,
      discounts_given: Math.round(parseFloat(stat.discounts || 0) * 100) / 100,
      estimated_commission: Math.round((parseFloat(stat.revenue || 0) * parseFloat(stat['partner.commission_rate'] || 0) / 100) * 100) / 100
    }));
  }

  /**
   * 🔧 Utilitaires helper
   */
  calculateSubscriptionAge(subscription) {
    const now = new Date();
    const start = new Date(subscription.starts_at);
    return Math.floor((now - start) / (1000 * 60 * 60 * 24)); // en jours
  }

  isRefundEligible(subscription) {
    const daysSinceStart = this.calculateSubscriptionAge(subscription);
    return daysSinceStart <= 30; // Politique de remboursement 30 jours
  }

  /**
   * 🧹 Annuler l'abonnement actuel (utilitaire)
   */
  async cancelCurrentSubscription(userId) {
    try {
      if (!this.models || !this.models.Subscription) {
        return;
      }

      await this.models.Subscription.update(
        { 
          status: 'canceled',
          canceled_at: new Date(),
          auto_renew: false,
          cancellation_reason: 'Automatique lors changement de plan'
        },
        {
          where: {
            user_id: userId,
            status: ['active', 'trialing', 'past_due']
          }
        }
      );

    } catch (error) {
      logger.error('Erreur cancelCurrentSubscription:', error.message);
    }
  }

  /**
   * ✅ Vérifier si un utilisateur peut effectuer une action avec partenaire
   */
  async canUserPerformAction(userId, actionType) {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        return false;
      }

      const plan = subscription.plan;
      let limits = plan.limits || {};
      const features = plan.features || {};

      // Appliquer les modifications partenaire si applicable
      if (subscription.partner && subscription.partner.plan_modifications) {
        limits = this.applyPartnerModifications(limits, subscription.partner.plan_modifications);
      }

      // Vérifier si la fonctionnalité est disponible
      if (features[actionType] === false) {
        return false;
      }

      // Vérifier les limites d'usage
      const limit = limits[actionType];
      if (limit === undefined || limit === -1) {
        return true;
      }

      if (limit === 0 || limit === false) {
        return false;
      }

      // Vérifier l'usage actuel
      const currentUsage = await this.getUserUsageForLimit(userId, actionType);
      return currentUsage < limit;

    } catch (error) {
      logger.error('Erreur canUserPerformAction:', error.message);
      return false;
    }
  }

  /**
   * 📈 Vérifier l'usage pour une limite donnée
   */
  async getUserUsageForLimit(userId, limitType) {
    try {
      const usageStats = await this.calculateCurrentUsage(userId);
      return usageStats[limitType] || 0;

    } catch (error) {
      logger.error('Erreur getUserUsageForLimit:', error.message);
      return 0;
    }
  }

  /**
   * 📋 Obtenir le statut du service avec partenaires
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasModels: !!this.models,
      stats: this.stats,
      features: {
        free_subscriptions: true,
        premium_subscriptions: true,
        trials: true,
        plan_changes: true,
        usage_tracking: true,
        payment_sync: true,
        detailed_metrics: true,
        partner_integration: true,
        partner_commissions: true,
        promo_codes: true,
        partner_discounts: true
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🧹 Nettoyage du service
   */
  async cleanup() {
    this.stats = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      trialingSubscriptions: 0,
      canceledSubscriptions: 0,
      expiredSubscriptions: 0,
      pastDueSubscriptions: 0,
      unpaidSubscriptions: 0,
      currentMRR: 0,
      partnerSubscriptions: 0,
      partnerRevenue: 0
    };
    
    this.isInitialized = false;
    logger.info(this.name + ' nettoyé');
  }
}

module.exports = new SubscriptionService();