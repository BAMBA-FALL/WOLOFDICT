// =============================================================================
// 📄 middleware/subscription.js - MIDDLEWARES ABONNEMENT AVEC PARTENAIRES
// =============================================================================

const SubscriptionService = require('../services/SubscriptionService');
const logger = require('../services/LoggerService');

class SubscriptionMiddleware {
  /**
   * 🔐 Vérifier qu'un utilisateur a un abonnement valide
   */
  static requireSubscription(planTypes = ['premium', 'pro']) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentification requise',
            code: 'AUTH_REQUIRED'
          });
        }

        const subscription = await SubscriptionService.getUserSubscription(req.user.id);
        
        if (!subscription || subscription.status !== 'active') {
          // Log tentative d'accès sans abonnement
          logger.logBusinessEvent('subscription_access_denied', {
            userId: req.user.id,
            requestUrl: req.url,
            method: req.method,
            reason: 'no_active_subscription'
          });

          return res.status(402).json({
            success: false,
            error: 'Abonnement actif requis',
            code: 'SUBSCRIPTION_REQUIRED',
            requiredPlans: planTypes,
            currentStatus: subscription ? subscription.status : 'none'
          });
        }

        const allowedPlans = Array.isArray(planTypes) ? planTypes : [planTypes];
        if (!allowedPlans.includes(subscription.plan.slug)) {
          // Log tentative d'accès avec plan insuffisant
          logger.logBusinessEvent('subscription_access_denied', {
            userId: req.user.id,
            currentPlan: subscription.plan.slug,
            requiredPlans: allowedPlans,
            requestUrl: req.url,
            reason: 'insufficient_plan'
          });

          return res.status(402).json({
            success: false,
            error: 'Plan d\'abonnement insuffisant',
            code: 'SUBSCRIPTION_INSUFFICIENT',
            currentPlan: subscription.plan.slug,
            requiredPlans: allowedPlans,
            upgradeUrl: `/plans/upgrade?from=${subscription.plan.slug}`
          });
        }

        // Ajouter les infos d'abonnement à la requête
        req.subscription = subscription;
        req.plan = subscription.plan;
        req.partner = subscription.partner || null;

        // Log accès autorisé
        logger.logBusinessEvent('subscription_access_granted', {
          userId: req.user.id,
          plan: subscription.plan.slug,
          partnerId: subscription.partner_id,
          requestUrl: req.url
        });

        next();

      } catch (error) {
        logger.error('Erreur middleware subscription:', error.message);
        res.status(500).json({
          success: false,
          error: 'Erreur de vérification d\'abonnement',
          code: 'SUBSCRIPTION_CHECK_ERROR'
        });
      }
    };
  }

  /**
   * ⭐ Vérifier l'accès à une fonctionnalité avec support partenaire
   */
  static checkFeatureAccess(featureName, options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentification requise',
            code: 'AUTH_REQUIRED'
          });
        }

        const subscription = await SubscriptionService.getUserSubscription(req.user.id);
        
        if (!subscription || subscription.status !== 'active') {
          return res.status(402).json({
            success: false,
            error: 'Abonnement actif requis',
            code: 'SUBSCRIPTION_REQUIRED',
            feature: featureName
          });
        }

        // Vérifier les fonctionnalités du plan de base
        let hasAccess = subscription.plan.features && subscription.plan.features[featureName] === true;

        // Appliquer les modifications partenaire si applicable
        if (!hasAccess && subscription.partner && subscription.partner.plan_modifications) {
          const partnerModifications = subscription.partner.plan_modifications;
          if (partnerModifications.features && partnerModifications.features[featureName] === true) {
            hasAccess = true;
            
            // Log accès via partenaire
            logger.logBusinessEvent('partner_feature_access', {
              userId: req.user.id,
              feature: featureName,
              partnerId: subscription.partner_id,
              partnerName: subscription.partner.name
            });
          }
        }

        if (!hasAccess) {
          // Log tentative d'accès à fonctionnalité non disponible
          logger.logBusinessEvent('feature_access_denied', {
            userId: req.user.id,
            feature: featureName,
            plan: subscription.plan.slug,
            partnerId: subscription.partner_id
          });

          return res.status(402).json({
            success: false,
            error: `Fonctionnalité "${featureName}" non disponible`,
            code: 'FEATURE_NOT_AVAILABLE',
            feature: featureName,
            currentPlan: subscription.plan.slug,
            upgradeRequired: options.suggestUpgrade !== false
          });
        }

        // Ajouter les infos à la requête
        req.subscription = subscription;
        req.plan = subscription.plan;
        req.partner = subscription.partner || null;
        req.featureAccess = {
          feature: featureName,
          granted: true,
          source: subscription.partner ? 'partner' : 'plan'
        };

        next();

      } catch (error) {
        logger.error('Erreur middleware feature access:', error.message);
        res.status(500).json({
          success: false,
          error: 'Erreur de vérification de fonctionnalité',
          code: 'FEATURE_CHECK_ERROR'
        });
      }
    };
  }

  /**
   * 📊 Vérifier les limites d'usage avec support partenaire
   */
  static checkUsageLimit(limitType, options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentification requise',
            code: 'AUTH_REQUIRED'
          });
        }

        const canPerform = await SubscriptionService.canUserPerformAction(req.user.id, limitType);
        
        if (!canPerform) {
          const usageStats = await SubscriptionService.getUserUsageStats(req.user.id);
          const limit = usageStats.limits[limitType];
          const current = usageStats.current_usage[limitType] || 0;

          // Log dépassement de limite
          logger.logBusinessEvent('usage_limit_exceeded', {
            userId: req.user.id,
            limitType: limitType,
            limit: limit,
            current: current,
            plan: usageStats.plan,
            partnerId: usageStats.partner ? usageStats.partner.id : null,
            requestUrl: req.url
          });

          const response = {
            success: false,
            error: `Limite d'usage atteinte pour "${limitType}"`,
            code: 'USAGE_LIMIT_EXCEEDED',
            limitType,
            limit,
            current,
            plan: usageStats.plan,
            resetInfo: this.getLimitResetInfo(limitType)
          };

          // Ajouter info partenaire si applicable
          if (usageStats.partner) {
            response.partner = {
              name: usageStats.partner.name,
              hasEnhancedLimits: true
            };
          }

          // Suggérer mise à niveau si demandé
          if (options.suggestUpgrade !== false) {
            response.upgradeOptions = {
              message: 'Augmentez vos limites avec un plan supérieur',
              upgradeUrl: `/plans/upgrade?from=${usageStats.plan}&feature=${limitType}`
            };
          }

          return res.status(429).json(response);
        }

        // Log usage autorisé
        if (options.trackUsage !== false) {
          logger.logBusinessEvent('usage_authorized', {
            userId: req.user.id,
            limitType: limitType,
            requestUrl: req.url
          });
        }

        next();

      } catch (error) {
        logger.error('Erreur middleware usage limit:', error.message);
        res.status(500).json({
          success: false,
          error: 'Erreur de vérification de limite',
          code: 'USAGE_CHECK_ERROR'
        });
      }
    };
  }

  /**
   * 🏢 Middleware spécifique pour vérifier l'accès partenaire
   */
  static requirePartnerAccess(requiredPartnerSlug = null) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Authentification requise',
            code: 'AUTH_REQUIRED'
          });
        }

        const subscription = await SubscriptionService.getUserSubscription(req.user.id);
        
        if (!subscription || !subscription.partner) {
          return res.status(403).json({
            success: false,
            error: 'Accès partenaire requis',
            code: 'PARTNER_ACCESS_REQUIRED'
          });
        }

        // Vérifier un partenaire spécifique si demandé
        if (requiredPartnerSlug && subscription.partner.slug !== requiredPartnerSlug) {
          return res.status(403).json({
            success: false,
            error: 'Partenaire spécifique requis',
            code: 'SPECIFIC_PARTNER_REQUIRED',
            required: requiredPartnerSlug,
            current: subscription.partner.slug
          });
        }

        // Vérifier que le partenaire est actif
        if (!subscription.partner.is_active) {
          return res.status(403).json({
            success: false,
            error: 'Partenaire inactif',
            code: 'PARTNER_INACTIVE'
          });
        }

        req.subscription = subscription;
        req.partner = subscription.partner;

        next();

      } catch (error) {
        logger.error('Erreur middleware partner access:', error.message);
        res.status(500).json({
          success: false,
          error: 'Erreur de vérification partenaire',
          code: 'PARTNER_CHECK_ERROR'
        });
      }
    };
  }

  /**
   * 📈 Middleware pour tracker l'utilisation des fonctionnalités
   */
  static trackFeatureUsage(featureName, options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return next(); // Optionnel si pas d'utilisateur
        }

        const subscription = await SubscriptionService.getUserSubscription(req.user.id);
        
        // Log de l'utilisation de la fonctionnalité
        logger.logBusinessEvent('feature_usage', {
          userId: req.user.id,
          feature: featureName,
          plan: subscription ? subscription.plan.slug : 'free',
          partnerId: subscription ? subscription.partner_id : null,
          timestamp: new Date(),
          metadata: options.metadata || {}
        });

        // Mettre à jour les données d'usage si subscription existe
        if (subscription && options.updateUsage !== false) {
          const currentUsage = await SubscriptionService.getUserUsageForLimit(req.user.id, featureName);
          await SubscriptionService.updateSubscriptionUsage(req.user.id, {
            [featureName]: currentUsage + 1,
            [`${featureName}_last_used`]: new Date()
          });
        }

        next();

      } catch (error) {
        logger.error('Erreur middleware track usage:', error.message);
        next(); // Continue même en cas d'erreur de tracking
      }
    };
  }

  /**
   * 🎯 Middleware pour appliquer les remises partenaires sur les prix
   */
  static applyPartnerPricing() {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return next();
        }

        const subscription = await SubscriptionService.getUserSubscription(req.user.id);
        
        if (subscription && subscription.partner) {
          req.partnerPricing = {
            partnerId: subscription.partner_id,
            partnerName: subscription.partner.name,
            discountType: subscription.partner.discount_type,
            discountValue: subscription.partner.discount_value,
            hasDiscount: subscription.partner.discount_value > 0
          };
        }

        next();

      } catch (error) {
        logger.error('Erreur middleware partner pricing:', error.message);
        next();
      }
    };
  }

  /**
   * 🔄 Middleware pour vérifier le statut d'essai
   */
  static checkTrialStatus() {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return next();
        }

        const subscription = await SubscriptionService.getUserSubscription(req.user.id);
        
        if (subscription && subscription.status === 'trialing') {
          const trialEndsAt = new Date(subscription.trial_ends_at);
          const now = new Date();
          const daysRemaining = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));

          req.trialInfo = {
            isTrialing: true,
            endsAt: trialEndsAt,
            daysRemaining: Math.max(0, daysRemaining),
            isExpiringSoon: daysRemaining <= 3
          };

          // Avertir si l'essai expire bientôt
          if (daysRemaining <= 1) {
            res.set('X-Trial-Warning', 'expires-soon');
          }
        } else {
          req.trialInfo = {
            isTrialing: false
          };
        }

        next();

      } catch (error) {
        logger.error('Erreur middleware trial status:', error.message);
        next();
      }
    };
  }

  /**
   * 🛠️ Utilitaire pour obtenir les infos de réinitialisation des limites
   */
  static getLimitResetInfo(limitType) {
    const resetMap = {
      daily_searches: 'Réinitialisation quotidienne à minuit',
      daily_contributions: 'Réinitialisation quotidienne à minuit',
      forum_posts_per_day: 'Réinitialisation quotidienne à minuit',
      api_calls_per_month: 'Réinitialisation mensuelle le 1er du mois',
      max_favorites: 'Limite permanente'
    };

    return resetMap[limitType] || 'Contactez le support pour plus d\'informations';
  }

  /**
   * 🎮 Middleware combiné pour les API - vérifie auth + abonnement + limites
   */
  static requireAPIAccess(limitType, options = {}) {
    return [
      // Vérifier l'authentification
      (req, res, next) => {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Clé API ou authentification requise',
            code: 'AUTH_REQUIRED'
          });
        }
        next();
      },
      
      // Vérifier l'abonnement (au minimum plan basique pour l'API)
      this.requireSubscription(['basic', 'premium', 'pro']),
      
      // Vérifier les limites d'usage
      this.checkUsageLimit(limitType, options),
      
      // Tracker l'usage
      this.trackFeatureUsage(limitType, { 
        metadata: { 
          apiEndpoint: true,
          ...options.metadata 
        }
      })
    ];
  }
}

module.exports = SubscriptionMiddleware;