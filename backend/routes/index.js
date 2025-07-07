// =============================================================================
// 🌍 WOLOFDICT - ROUTER PRINCIPAL
// Fichier : backend/src/routes/index.js
// Description : Point d'entrée pour toutes les routes API avec système business
// =============================================================================

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { trackUsage } = require('../middleware/subscription');

// =============================================================================
// 📊 IMPORTS DES ROUTES
// =============================================================================

// 🔐 Authentification & Utilisateurs
const authRoutes = require('./api/auth');
const userRoutes = require('./api/users');

// 💰 Business & Monétisation (NOUVEAU)
const planRoutes = require('./api/business/plans');
const subscriptionRoutes = require('./api/business/subscriptions');
const paymentRoutes = require('./api/business/payments');

// 📚 Contenu Linguistique
const wordRoutes = require('./api/content/words');
const phraseRoutes = require('./api/content/phrases');
const proverbRoutes = require('./api/content/proverbs');
const alphabetRoutes = require('./api/content/alphabet');

// 🏷️ Catégorisation
const categoryRoutes = require('./api/categorization/categories');
const tagRoutes = require('./api/categorization/tags');

// 🎵 Multimédia
const audioRoutes = require('./api/media/audio');
const imageRoutes = require('./api/media/images');

// 💫 Interactions
const favoriteRoutes = require('./api/interaction/favorites');
const likeRoutes = require('./api/interaction/likes');
const ratingRoutes = require('./api/interaction/ratings');
const contributionRoutes = require('./api/interaction/contributions');

// 💬 Communauté
const forumRoutes = require('./api/community/forum');
const eventRoutes = require('./api/community/events');
const projectRoutes = require('./api/community/projects');

// 📊 Statistiques & Analytics
const searchRoutes = require('./api/search/search');
const analyticsRoutes = require('./api/analytics/analytics');
const statsRoutes = require('./api/stats/stats');

// 📢 Communication
const notificationRoutes = require('./api/communication/notifications');
const newsletterRoutes = require('./api/communication/newsletter');
const announcementRoutes = require('./api/communication/announcements');

// 🛠️ Administration
const adminRoutes = require('./api/admin/admin');
const moderationRoutes = require('./api/admin/moderation');
const reportRoutes = require('./api/admin/reports');

// 🔗 Intégrations
const integrationRoutes = require('./api/integration/integrations');
const apiKeyRoutes = require('./api/integration/api-keys');

// 📱 Mobile
const mobileRoutes = require('./api/mobile/mobile');

// 🔔 Webhooks (séparés car pas d'auth)
const stripeWebhooks = require('./webhooks/stripe');
const paypalWebhooks = require('./webhooks/paypal');

// =============================================================================
// 🛡️ MIDDLEWARES GLOBAUX
// =============================================================================

// Rate limiting global (ajusté selon le plan)
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Limites selon le plan utilisateur
    if (req.user?.plan?.slug === 'pro') return 10000;
    if (req.user?.plan?.slug === 'premium') return 5000;
    return 1000; // Plan free
  },
  message: {
    error: 'Trop de requêtes',
    retry_after: 900,
    upgrade_suggestion: 'Passez au plan Premium pour des limites plus élevées'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware pour ajouter les infos du plan à chaque requête
const attachPlanInfo = async (req, res, next) => {
  if (req.user) {
    try {
      const { Subscription, Plan } = require('../models');
      
      const subscription = await Subscription.findOne({
        where: { 
          user_id: req.user.id,
          status: ['active', 'trialing']
        },
        include: [{ model: Plan, as: 'plan' }]
      });

      if (subscription) {
        req.user.plan = subscription.plan;
        req.user.subscription = subscription;
      } else {
        // Plan gratuit par défaut
        req.user.plan = await Plan.findOne({ where: { slug: 'free' } });
      }
    } catch (error) {
      console.error('Erreur attachement plan:', error);
    }
  }
  next();
};

// =============================================================================
// 🏠 ROUTES DE BASE
// =============================================================================

/**
 * @route   GET /api/v1/health
 * @desc    Health check de l'API
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    features: {
      business: true,
      payments: true,
      analytics: true,
      ai_ready: true
    }
  });
});

/**
 * @route   GET /api/v1/status
 * @desc    Statut détaillé des services
 * @access  Public
 */
router.get('/status', async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    // Test connexion base de données
    await sequelize.authenticate();
    
    res.json({
      status: 'operational',
      services: {
        database: 'connected',
        redis: process.env.REDIS_URL ? 'connected' : 'disabled',
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'disabled',
        paypal: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'disabled',
        storage: 'available'
      },
      stats: {
        total_users: await require('../models').User.count(),
        total_words: await require('../models').Word.count(),
        active_subscriptions: await require('../models').Subscription.count({
          where: { status: ['active', 'trialing'] }
        })
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service temporairement indisponible',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   GET /api/v1/info
 * @desc    Informations générales sur l'API
 * @access  Public
 */
router.get('/info', (req, res) => {
  res.json({
    name: 'WolofDict API',
    description: 'API pour la plateforme collaborative de langue wolof',
    version: process.env.API_VERSION || '1.0.0',
    documentation: '/docs',
    support: 'support@wolofdict.com',
    languages: ['wolof', 'french', 'english'],
    features: {
      dictionary: 'Dictionnaire collaboratif wolof',
      learning: 'Outils d\'apprentissage adaptatifs',
      community: 'Communauté active et forum',
      business: 'Modèle freemium avec plans premium',
      ai: 'IA native wolof en développement'
    },
    plans: {
      free: 'Accès gratuit avec fonctionnalités de base',
      premium: 'Accès complet avec contenu premium - 9.99€/mois',
      pro: 'Outils professionnels et API - 29.99€/mois'
    }
  });
});

// =============================================================================
// 🔗 MONTAGE DES ROUTES PRINCIPALES
// =============================================================================

// Application des middlewares globaux
router.use(globalRateLimit);
router.use(optionalAuth); // Auth optionnelle pour personnaliser l'expérience
router.use(attachPlanInfo); // Ajouter infos plan utilisateur

// =============================================================================
// 🔐 AUTHENTIFICATION & UTILISATEURS
// =============================================================================

/**
 * Routes d'authentification
 * - Inscription/connexion
 * - OAuth social
 * - Reset mot de passe
 */
router.use('/auth', authRoutes);

/**
 * Routes utilisateurs
 * - Profils utilisateurs
 * - Préférences
 * - Statistiques personnelles
 */
router.use('/users', userRoutes);

// =============================================================================
// 💰 BUSINESS & MONÉTISATION
// =============================================================================

/**
 * Routes plans tarifaires
 * - Liste des plans disponibles
 * - Comparaison des fonctionnalités
 * - Gestion admin des plans
 */
router.use('/plans', planRoutes);

/**
 * Routes abonnements
 * - Souscription/modification
 * - Gestion du cycle de vie
 * - Analytics abonnements
 */
router.use('/subscriptions', subscriptionRoutes);

/**
 * Routes paiements
 * - Intentions de paiement
 * - Historique transactions
 * - Remboursements
 */
router.use('/payments', paymentRoutes);

// =============================================================================
// 📚 CONTENU LINGUISTIQUE
// =============================================================================

/**
 * Routes mots du dictionnaire
 * - CRUD mots avec limites selon plan
 * - Recherche avancée (filtres premium)
 * - Mots exclusifs premium
 */
router.use('/words', wordRoutes);

/**
 * Routes phrases et expressions
 * - Phrases par catégorie/difficulté
 * - Variations dialectales (premium)
 * - Collection premium
 */
router.use('/phrases', phraseRoutes);

/**
 * Routes proverbes et sagesses
 * - Proverbes authentiques
 * - Audio premium
 * - Analytics utilisation
 */
router.use('/proverbs', proverbRoutes);

/**
 * Routes alphabet wolof
 * - Lettres avec audio
 * - Exemples par lettre
 * - Phonétique IPA
 */
router.use('/alphabet', alphabetRoutes);

// =============================================================================
// 🏷️ CATÉGORISATION
// =============================================================================

/**
 * Routes catégories
 * - Hiérarchie des catégories
 * - Contenu par catégorie
 * - Catégories premium
 */
router.use('/categories', categoryRoutes);

/**
 * Routes tags
 * - Tags populaires/tendance
 * - Contenu par tag
 * - Limite création selon plan
 */
router.use('/tags', tagRoutes);

// =============================================================================
// 🎵 MULTIMÉDIA
// =============================================================================

/**
 * Routes audio
 * - Enregistrements HD (premium)
 * - Upload avec limites selon plan
 * - Streaming optimisé
 */
router.use('/audio', audioRoutes);

/**
 * Routes images
 * - Images culturelles
 * - Résolution selon plan
 * - Upload avec quotas
 */
router.use('/images', imageRoutes);

// =============================================================================
// 💫 INTERACTIONS UTILISATEURS
// =============================================================================

/**
 * Routes favoris
 * - Gestion favoris avec limites
 * - Collections premium
 * - Synchronisation cross-device
 */
router.use('/favorites', favoriteRoutes);

/**
 * Routes likes
 * - Système de likes avec quotas
 * - Statistiques d'engagement
 * - Historique selon plan
 */
router.use('/likes', likeRoutes);

/**
 * Routes évaluations
 * - Notes et commentaires
 * - Analytics détaillées (premium)
 * - Modération intelligente
 */
router.use('/ratings', ratingRoutes);

/**
 * Routes contributions
 * - Contributions communautaires
 * - Système de récompenses
 * - Validation collaborative
 */
router.use('/contributions', contributionRoutes);

// =============================================================================
// 💬 COMMUNAUTÉ
// =============================================================================

/**
 * Routes forum
 * - Discussions par catégorie
 * - Quotas posts selon plan
 * - Modération automatique
 */
router.use('/forum', forumRoutes);

/**
 * Routes événements
 * - Événements communautaires
 * - Priorité premium
 * - Calendrier avancé
 */
router.use('/events', eventRoutes);

/**
 * Routes projets collaboratifs
 * - Projets de traduction
 * - Outils premium
 * - Gestion d'équipe
 */
router.use('/projects', projectRoutes);

// =============================================================================
// 🔍 RECHERCHE & ANALYTICS
// =============================================================================

/**
 * Routes recherche
 * - Recherche globale
 * - Filtres avancés (premium)
 * - Suggestions intelligentes
 */
router.use('/search', searchRoutes);

/**
 * Routes analytics
 * - Tableaux de bord
 * - Métriques détaillées (premium)
 * - Insights personnalisés
 */
router.use('/analytics', analyticsRoutes);

/**
 * Routes statistiques
 * - Stats globales
 * - Tendances (premium)
 * - Rapports exportables
 */
router.use('/stats', statsRoutes);

// =============================================================================
// 📢 COMMUNICATION
// =============================================================================

/**
 * Routes notifications
 * - Notifications push
 * - Préférences granulaires (premium)
 * - Historique étendu
 */
router.use('/notifications', notificationRoutes);

/**
 * Routes newsletter
 * - Abonnement newsletter
 * - Contenu premium
 * - Personnalisation avancée
 */
router.use('/newsletter', newsletterRoutes);

/**
 * Routes annonces
 * - Annonces officielles
 * - Ciblage par plan
 * - Analytics engagement
 */
router.use('/announcements', announcementRoutes);

// =============================================================================
// 🛠️ ADMINISTRATION
// =============================================================================

/**
 * Routes administration
 * - Gestion utilisateurs
 * - Configuration système
 * - Paramètres business
 */
router.use('/admin', adminRoutes);

/**
 * Routes modération
 * - Outils de modération
 * - File d'attente
 * - Actions automatiques
 */
router.use('/moderation', moderationRoutes);

/**
 * Routes signalements
 * - Contenus signalés
 * - Résolution rapide
 * - Analytics modération
 */
router.use('/reports', reportRoutes);

// =============================================================================
// 🔗 INTÉGRATIONS
// =============================================================================

/**
 * Routes intégrations
 * - Services externes
 * - Intégrations premium
 * - OAuth providers
 */
router.use('/integrations', integrationRoutes);

/**
 * Routes clés API
 * - Gestion clés développeurs
 * - Quotas selon plan
 * - Monitoring usage
 */
router.use('/api-keys', apiKeyRoutes);

// =============================================================================
// 📱 MOBILE
// =============================================================================

/**
 * Routes API mobile
 * - Endpoints optimisés mobile
 * - Fonctionnalités premium
 * - Synchronisation offline
 */
router.use('/mobile', mobileRoutes);

// =============================================================================
// 🔔 WEBHOOKS (SANS AUTHENTIFICATION)
// =============================================================================

/**
 * Webhooks Stripe
 * - Événements paiements
 * - Gestion abonnements
 * - Vérification signatures
 */
router.use('/webhooks/stripe', stripeWebhooks);

/**
 * Webhooks PayPal
 * - Notifications paiements
 * - Gestion transactions
 * - Vérification IPN
 */
router.use('/webhooks/paypal', paypalWebhooks);

// =============================================================================
// 🎯 ROUTES SPÉCIALES
// =============================================================================

/**
 * @route   GET /api/v1/features
 * @desc    Liste des fonctionnalités disponibles selon le plan
 * @access  Public (optionalAuth)
 */
router.get('/features', (req, res) => {
  const userPlan = req.user?.plan?.slug || 'free';
  
  const features = {
    free: {
      dictionary: { words: 2000, search_daily: 50 },
      audio: { quality: 'standard', downloads: false },
      favorites: { max: 100 },
      forum: { posts_daily: 5 },
      support: 'community'
    },
    premium: {
      dictionary: { words: 10000, search_daily: -1 },
      audio: { quality: 'hd', downloads: true },
      favorites: { max: -1, collections: true },
      forum: { posts_daily: -1 },
      analytics: { personal: true },
      support: 'email'
    },
    pro: {
      dictionary: { words: -1, search_daily: -1 },
      audio: { quality: 'studio', downloads: true },
      favorites: { max: -1, collections: true },
      forum: { posts_daily: -1, moderation: true },
      analytics: { personal: true, business: true },
      api: { calls_monthly: 10000 },
      support: 'phone'
    }
  };

  res.json({
    current_plan: userPlan,
    features: features[userPlan],
    all_plans: features,
    upgrade_url: userPlan !== 'pro' ? '/plans' : null
  });
});

/**
 * @route   GET /api/v1/usage
 * @desc    Usage actuel de l'utilisateur vs limites
 * @access  Private
 */
router.get('/usage', authenticateToken, trackUsage('usage_check'), async (req, res) => {
  try {
    const SubscriptionService = require('../services/business/SubscriptionService');
    const usage = await SubscriptionService.getUserUsage(req.user.id);
    const limits = req.user.plan.limits;
    
    // Calculer pourcentages
    const percentages = {};
    Object.keys(limits).forEach(key => {
      if (limits[key] > 0) {
        percentages[key] = Math.round((usage[key] / limits[key]) * 100);
      }
    });

    res.json({
      plan: req.user.plan.name,
      usage,
      limits,
      percentages,
      warnings: Object.keys(percentages).filter(key => percentages[key] >= 80),
      exceeded: Object.keys(percentages).filter(key => percentages[key] >= 100)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération usage' });
  }
});

// =============================================================================
// 🚫 GESTION D'ERREURS
// =============================================================================

/**
 * Route 404 - Not Found
 */
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    suggestions: [
      'Vérifiez l\'URL',
      'Consultez la documentation API',
      'Contactez le support si le problème persiste'
    ],
    documentation: '/docs'
  });
});

/**
 * Middleware de gestion d'erreurs
 */
router.use((err, req, res, next) => {
  console.error('Erreur API:', err);

  // Erreurs business spécifiques
  if (err.type === 'payment_error') {
    return res.status(402).json({
      error: 'Erreur de paiement',
      message: err.message,
      retry_url: err.payment_id ? `/api/v1/payments/retry/${err.payment_id}` : null,
      support: 'support@wolofdict.com'
    });
  }

  if (err.type === 'subscription_error') {
    return res.status(403).json({
      error: 'Problème d\'abonnement',
      message: err.message,
      upgrade_url: '/plans',
      current_plan: req.user?.plan?.name || 'free'
    });
  }

  if (err.type === 'plan_limit_error') {
    return res.status(429).json({
      error: 'Limite du plan atteinte',
      message: err.message,
      current_plan: req.user?.plan?.name || 'free',
      limit_type: err.limit_type,
      upgrade_suggestions: {
        premium: 'Passez au plan Premium pour des limites plus élevées',
        pro: 'Le plan Pro offre un accès illimité'
      }
    });
  }

  // Erreurs génériques
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.details || err.message
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Authentification requise',
      login_url: '/auth/login'
    });
  }

  // Erreur serveur générique
  res.status(500).json({
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
    timestamp: new Date().toISOString(),
    request_id: req.id || 'unknown'
  });
});

// =============================================================================
// 📊 MÉTRIQUES ET MONITORING
// =============================================================================

/**
 * Middleware de logging pour toutes les requêtes
 */
router.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log structuré pour monitoring
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      user_id: req.user?.id || 'anonymous',
      user_plan: req.user?.plan?.slug || 'free',
      ip: req.ip,
      user_agent: req.get('User-Agent'),
      referer: req.get('Referer')
    }));
  });
  
  next();
});

// =============================================================================
// 🎯 EXPORT
// =============================================================================

module.exports = router;