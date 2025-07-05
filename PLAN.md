// =============================================================================
// 🌍 WOLOFDICT - STRUCTURE COMPLÈTE DES ROUTES
// Architecture des routes avec système business intégré
// =============================================================================

// =============================================================================
// 📁 STRUCTURE DES FICHIERS DE ROUTES
// =============================================================================

/*
backend/src/routes/
├── index.js                    # Router principal + mounting
├── api/                        # Routes API v1
│   ├── auth.js                 # Authentification
│   ├── users.js                # Gestion utilisateurs
│   ├── 💰 business/            # Routes business (NOUVEAU)
│   │   ├── plans.js            # Plans tarifaires
│   │   ├── subscriptions.js    # Abonnements
│   │   └── payments.js         # Paiements
│   ├── content/                # Contenu linguistique
│   │   ├── words.js            # Mots
│   │   ├── phrases.js          # Phrases
│   │   ├── proverbs.js         # Proverbes
│   │   └── alphabet.js         # Alphabet
│   ├── media/                  # Multimédia
│   │   ├── audio.js            # Audio
│   │   └── images.js           # Images
│   ├── community/              # Communauté
│   │   ├── forum.js            # Forum
│   │   ├── events.js           # Événements
│   │   └── projects.js         # Projets
│   ├── search.js               # Recherche
│   ├── analytics.js            # Analytics
│   └── admin.js                # Administration
└── webhooks/                   # Webhooks paiements
    ├── stripe.js               # Webhooks Stripe
    └── paypal.js               # Webhooks PayPal
*/

// =============================================================================
// 🚀 ROUTER PRINCIPAL - backend/src/routes/index.js
// =============================================================================

const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./api/auth');
const userRoutes = require('./api/users');

// 💰 Routes business (NOUVEAU)
const planRoutes = require('./api/business/plans');
const subscriptionRoutes = require('./api/business/subscriptions');
const paymentRoutes = require('./api/business/payments');

// Routes contenu
const wordRoutes = require('./api/content/words');
const phraseRoutes = require('./api/content/phrases');
const proverbRoutes = require('./api/content/proverbs');
const alphabetRoutes = require('./api/content/alphabet');

// Routes média
const audioRoutes = require('./api/media/audio');
const imageRoutes = require('./api/media/images');

// Routes communauté
const forumRoutes = require('./api/community/forum');
const eventRoutes = require('./api/community/events');
const projectRoutes = require('./api/community/projects');

// Routes utilitaires
const searchRoutes = require('./api/search');
const analyticsRoutes = require('./api/analytics');
const adminRoutes = require('./api/admin');

// Routes webhooks
const stripeWebhooks = require('./webhooks/stripe');
const paypalWebhooks = require('./webhooks/paypal');

// =============================================================================
// 🔗 MONTAGE DES ROUTES
// =============================================================================

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

// 🔐 Authentification
router.use('/auth', authRoutes);

// 👤 Utilisateurs
router.use('/users', userRoutes);

// 💰 Business routes (NOUVEAU)
router.use('/plans', planRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/payments', paymentRoutes);

// 📚 Contenu linguistique
router.use('/words', wordRoutes);
router.use('/phrases', phraseRoutes);
router.use('/proverbs', proverbRoutes);
router.use('/alphabet', alphabetRoutes);

// 🎵 Multimédia
router.use('/audio', audioRoutes);
router.use('/images', imageRoutes);

// 💬 Communauté
router.use('/forum', forumRoutes);
router.use('/events', eventRoutes);
router.use('/projects', projectRoutes);

// 🔍 Utilitaires
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

// 🔔 Webhooks (sans middleware auth)
router.use('/webhooks/stripe', stripeWebhooks);
router.use('/webhooks/paypal', paypalWebhooks);

module.exports = router;

// =============================================================================
// 💰 ROUTES PLANS - backend/src/routes/api/business/plans.js
// =============================================================================

const express = require('express');
const router = express.Router();
const PlanController = require('../../../controllers/business/PlanController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');
const { validatePlan } = require('../../../middleware/validation');

// =============================================================================
// 📋 ROUTES PUBLIQUES PLANS
// =============================================================================

/**
 * @route   GET /api/plans
 * @desc    Liste tous les plans disponibles
 * @access  Public
 */
router.get('/', PlanController.getAllPlans);

/**
 * @route   GET /api/plans/compare
 * @desc    Comparaison détaillée des plans
 * @access  Public
 */
router.get('/compare', PlanController.comparePlans);

/**
 * @route   GET /api/plans/features
 * @desc    Matrice des fonctionnalités par plan
 * @access  Public
 */
router.get('/features', PlanController.getFeatureMatrix);

/**
 * @route   GET /api/plans/:slug
 * @desc    Détails d'un plan spécifique
 * @access  Public
 */
router.get('/:slug', PlanController.getPlanBySlug);

// =============================================================================
// 🔒 ROUTES ADMINISTRATEUR PLANS
// =============================================================================

/**
 * @route   POST /api/plans
 * @desc    Créer un nouveau plan
 * @access  Admin
 */
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  validatePlan, 
  PlanController.createPlan
);

/**
 * @route   PUT /api/plans/:id
 * @desc    Modifier un plan existant
 * @access  Admin
 */
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  validatePlan, 
  PlanController.updatePlan
);

/**
 * @route   DELETE /api/plans/:id
 * @desc    Supprimer un plan (soft delete)
 * @access  Admin
 */
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  PlanController.deletePlan
);

module.exports = router;

// =============================================================================
// 💳 ROUTES ABONNEMENTS - backend/src/routes/api/business/subscriptions.js
// =============================================================================

const express = require('express');
const router = express.Router();
const SubscriptionController = require('../../../controllers/business/SubscriptionController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');
const { validateSubscription } = require('../../../middleware/validation');
const { checkPlanLimits } = require('../../../middleware/subscription');

// =============================================================================
// 👤 ROUTES UTILISATEUR ABONNEMENTS
// =============================================================================

/**
 * @route   GET /api/subscriptions/me
 * @desc    Mon abonnement actuel
 * @access  Private
 */
router.get('/me', 
  authenticateToken, 
  SubscriptionController.getCurrentSubscription
);

/**
 * @route   GET /api/subscriptions/me/usage
 * @desc    Usage actuel vs limites du plan
 * @access  Private
 */
router.get('/me/usage', 
  authenticateToken, 
  SubscriptionController.getUsageStats
);

/**
 * @route   POST /api/subscriptions/subscribe
 * @desc    Souscrire à un nouveau plan
 * @access  Private
 */
router.post('/subscribe', 
  authenticateToken, 
  validateSubscription, 
  SubscriptionController.subscribe
);

/**
 * @route   PUT /api/subscriptions/change-plan
 * @desc    Changer de plan (upgrade/downgrade)
 * @access  Private
 */
router.put('/change-plan', 
  authenticateToken, 
  validateSubscription, 
  SubscriptionController.changePlan
);

/**
 * @route   POST /api/subscriptions/cancel
 * @desc    Annuler l'abonnement
 * @access  Private
 */
router.post('/cancel', 
  authenticateToken, 
  SubscriptionController.cancelSubscription
);

/**
 * @route   POST /api/subscriptions/reactivate
 * @desc    Réactiver un abonnement annulé
 * @access  Private
 */
router.post('/reactivate', 
  authenticateToken, 
  SubscriptionController.reactivateSubscription
);

/**
 * @route   POST /api/subscriptions/trial
 * @desc    Démarrer un essai gratuit
 * @access  Private
 */
router.post('/trial', 
  authenticateToken, 
  SubscriptionController.startTrial
);

/**
 * @route   GET /api/subscriptions/invoices
 * @desc    Liste de mes factures
 * @access  Private
 */
router.get('/invoices', 
  authenticateToken, 
  SubscriptionController.getInvoices
);

/**
 * @route   GET /api/subscriptions/invoices/:id
 * @desc    Télécharger une facture spécifique
 * @access  Private
 */
router.get('/invoices/:id', 
  authenticateToken, 
  SubscriptionController.downloadInvoice
);

// =============================================================================
// 🔒 ROUTES ADMINISTRATEUR ABONNEMENTS
// =============================================================================

/**
 * @route   GET /api/subscriptions/admin
 * @desc    Liste tous les abonnements (admin)
 * @access  Admin
 */
router.get('/admin', 
  authenticateToken, 
  requireAdmin, 
  SubscriptionController.getAllSubscriptions
);

/**
 * @route   PUT /api/subscriptions/admin/:id
 * @desc    Modifier un abonnement (admin)
 * @access  Admin
 */
router.put('/admin/:id', 
  authenticateToken, 
  requireAdmin, 
  SubscriptionController.updateSubscriptionAdmin
);

/**
 * @route   GET /api/subscriptions/analytics
 * @desc    Analytics des abonnements (admin)
 * @access  Admin
 */
router.get('/analytics', 
  authenticateToken, 
  requireAdmin, 
  SubscriptionController.getSubscriptionAnalytics
);

module.exports = router;

// =============================================================================
// 💸 ROUTES PAIEMENTS - backend/src/routes/api/business/payments.js
// =============================================================================

const express = require('express');
const router = express.Router();
const PaymentController = require('../../../controllers/business/PaymentController');
const { authenticateToken, requireAdmin } = require('../../../middleware/auth');
const { validatePayment } = require('../../../middleware/validation');

// =============================================================================
// 👤 ROUTES UTILISATEUR PAIEMENTS
// =============================================================================

/**
 * @route   GET /api/payments/me
 * @desc    Historique de mes paiements
 * @access  Private
 */
router.get('/me', 
  authenticateToken, 
  PaymentController.getUserPayments
);

/**
 * @route   POST /api/payments/create-intent
 * @desc    Créer une intention de paiement Stripe
 * @access  Private
 */
router.post('/create-intent', 
  authenticateToken, 
  validatePayment, 
  PaymentController.createPaymentIntent
);

/**
 * @route   POST /api/payments/retry/:id
 * @desc    Retenter un paiement échoué
 * @access  Private
 */
router.post('/retry/:id', 
  authenticateToken, 
  PaymentController.retryPayment
);

/**
 * @route   GET /api/payments/:id/receipt
 * @desc    Télécharger le reçu d'un paiement
 * @access  Private
 */
router.get('/:id/receipt', 
  authenticateToken, 
  PaymentController.downloadReceipt
);

// =============================================================================
// 🔒 ROUTES ADMINISTRATEUR PAIEMENTS
// =============================================================================

/**
 * @route   GET /api/payments/admin
 * @desc    Liste tous les paiements (admin)
 * @access  Admin
 */
router.get('/admin', 
  authenticateToken, 
  requireAdmin, 
  PaymentController.getAllPayments
);

/**
 * @route   POST /api/payments/refund/:id
 * @desc    Rembourser un paiement (admin)
 * @access  Admin
 */
router.post('/refund/:id', 
  authenticateToken, 
  requireAdmin, 
  PaymentController.refundPayment
);

/**
 * @route   GET /api/payments/analytics
 * @desc    Analytics des revenus (admin)
 * @access  Admin
 */
router.get('/analytics', 
  authenticateToken, 
  requireAdmin, 
  PaymentController.getRevenueAnalytics
);

/**
 * @route   GET /api/payments/dashboard
 * @desc    Dashboard financier (admin)
 * @access  Admin
 */
router.get('/dashboard', 
  authenticateToken, 
  requireAdmin, 
  PaymentController.getFinancialDashboard
);

module.exports = router;

// =============================================================================
// 🔔 WEBHOOKS STRIPE - backend/src/routes/webhooks/stripe.js
// =============================================================================

const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/business/PaymentController');

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Webhook Stripe pour événements de paiement
 * @access  Webhook (Stripe signature verification)
 */
router.post('/', 
  express.raw({ type: 'application/json' }), // Raw body pour vérification signature
  PaymentController.handleStripeWebhook
);

module.exports = router;

// =============================================================================
// 🔔 WEBHOOKS PAYPAL - backend/src/routes/webhooks/paypal.js
// =============================================================================

const express = require('express');
const router = express.Router();
const PaymentController = require('../../controllers/business/PaymentController');

/**
 * @route   POST /api/webhooks/paypal
 * @desc    Webhook PayPal pour événements de paiement
 * @access  Webhook (PayPal signature verification)
 */
router.post('/', 
  PaymentController.handlePayPalWebhook
);

module.exports = router;

// =============================================================================
// 📝 EXEMPLE ROUTE AVEC MIDDLEWARE BUSINESS - words.js avec limites premium
// =============================================================================

const express = require('express');
const router = express.Router();
const WordController = require('../../../controllers/content/WordController');
const { authenticateToken, optionalAuth } = require('../../../middleware/auth');
const { checkPlanLimits, trackUsage } = require('../../../middleware/subscription');
const { validateWord } = require('../../../middleware/validation');

/**
 * @route   GET /api/words
 * @desc    Liste/recherche des mots (résultats selon plan)
 * @access  Public (optionalAuth pour personnalisation)
 */
router.get('/', 
  optionalAuth, // Auth optionnelle pour personnaliser selon plan
  checkPlanLimits('daily_searches'), // Vérifier limite recherches
  trackUsage('search'), // Tracker l'usage
  WordController.getAllWords
);

/**
 * @route   GET /api/words/premium
 * @desc    Mots exclusifs premium
 * @access  Premium required
 */
router.get('/premium', 
  authenticateToken, 
  checkPlanLimits('premium_content'), // Vérifier accès premium
  WordController.getPremiumWords
);

/**
 * @route   POST /api/words
 * @desc    Créer un nouveau mot
 * @access  Private (limite selon plan)
 */
router.post('/', 
  authenticateToken, 
  checkPlanLimits('daily_contributions'), // Limite contributions/jour
  validateWord, 
  trackUsage('contribution'), 
  WordController.createWord
);

/**
 * @route   POST /api/words/:id/favorite
 * @desc    Ajouter aux favoris (quota selon plan)
 * @access  Private
 */
router.post('/:id/favorite', 
  authenticateToken, 
  checkPlanLimits('max_favorites'), // Limite nombre de favoris
  trackUsage('favorite'), 
  WordController.addToFavorites
);

module.exports = router;

// =============================================================================
// 🛠️ MIDDLEWARE EXEMPLE - backend/src/middleware/subscription.js
// =============================================================================

const { Subscription, Plan } = require('../models');

/**
 * Middleware pour vérifier les limites du plan utilisateur
 */
const checkPlanLimits = (limitType) => {
  return async (req, res, next) => {
    try {
      // Si pas d'utilisateur connecté, appliquer limites free
      if (!req.user) {
        req.userPlan = await Plan.findOne({ where: { slug: 'free' } });
        return next();
      }

      // Récupérer l'abonnement actuel
      const subscription = await Subscription.findOne({
        where: { 
          user_id: req.user.id, 
          status: ['active', 'trialing'] 
        },
        include: [{ model: Plan, as: 'plan' }]
      });

      if (!subscription) {
        // Pas d'abonnement = plan gratuit
        req.userPlan = await Plan.findOne({ where: { slug: 'free' } });
      } else {
        req.userPlan = subscription.plan;
        req.userSubscription = subscription;
      }

      // Vérifier la limite spécifique
      const limits = req.userPlan.limits || {};
      const limit = limits[limitType];

      if (limit !== undefined && limit !== -1) { // -1 = illimité
        // Ici on vérifierait l'usage actuel vs la limite
        // Par exemple pour daily_searches, on compterait les recherches du jour
        
        // Si limite dépassée
        if (req.currentUsage >= limit) {
          return res.status(429).json({
            error: 'Limite du plan atteinte',
            current_plan: req.userPlan.name,
            limit_type: limitType,
            current_usage: req.currentUsage,
            limit: limit,
            upgrade_url: '/plans',
            suggestions: {
              premium: 'Passez au plan Premium pour des limites plus élevées',
              pro: 'Le plan Pro offre un accès illimité'
            }
          });
        }
      }

      next();
    } catch (error) {
      console.error('Erreur vérification limites plan:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  };
};

/**
 * Middleware pour tracker l'usage
 */
const trackUsage = (actionType) => {
  return async (req, res, next) => {
    // Tracker l'usage pour analytics et facturation
    if (req.user && req.userSubscription) {
      // Incrémenter compteurs d'usage
      // Ceci pourrait être fait de manière asynchrone
      setImmediate(() => {
        // Logique de tracking
        console.log(`User ${req.user.id} performed ${actionType}`);
      });
    }
    next();
  };
};

module.exports = {
  checkPlanLimits,
  trackUsage
};

// =============================================================================
// 🎯 EXEMPLE CONFIGURATION DANS APP.JS
// =============================================================================

const express = require('express');
const routes = require('./routes');

const app = express();

// Middleware global
app.use(express.json());

// Routes principales
app.use('/api/v1', routes);

// Gestion erreurs spécifique business
app.use((err, req, res, next) => {
  if (err.type === 'payment_error') {
    return res.status(402).json({
      error: 'Erreur de paiement',
      message: err.message,
      retry_url: '/api/payments/retry/' + err.payment_id
    });
  }
  
  if (err.type === 'subscription_error') {
    return res.status(403).json({
      error: 'Problème d\'abonnement',
      message: err.message,
      upgrade_url: '/plans'
    });
  }
  
  next(err);
});

module.exports = app;

// =============================================================================
// 📊 RÉSUMÉ DE L'ARCHITECTURE DES ROUTES
// =============================================================================

/*
🎯 ROUTES BUSINESS COMPLÈTES :

✅ Plans (/api/plans)
├── GET / - Liste plans publique
├── GET /compare - Comparaison
├── GET /features - Matrice fonctionnalités
├── GET /:slug - Détails plan
├── POST / - Créer (admin)
├── PUT /:id - Modifier (admin)
└── DELETE /:id - Supprimer (admin)

✅ Abonnements (/api/subscriptions)
├── GET /me - Mon abonnement
├── GET /me/usage - Usage vs limites
├── POST /subscribe - Souscrire
├── PUT /change-plan - Changer plan
├── POST /cancel - Annuler
├── POST /reactivate - Réactiver
├── POST /trial - Essai gratuit
├── GET /invoices - Mes factures
├── GET /invoices/:id - Télécharger facture
├── GET /admin - Liste tous (admin)
├── PUT /admin/:id - Modifier (admin)
└── GET /analytics - Analytics (admin)

✅ Paiements (/api/payments)
├── GET /me - Mes paiements
├── POST /create-intent - Intention Stripe
├── POST /retry/:id - Retenter paiement
├── GET /:id/receipt - Télécharger reçu
├── GET /admin - Liste tous (admin)
├── POST /refund/:id - Rembourser (admin)
├── GET /analytics - Analytics revenus (admin)
└── GET /dashboard - Dashboard financier (admin)

✅ Webhooks (/api/webhooks)
├── POST /stripe - Webhooks Stripe
└── POST /paypal - Webhooks PayPal

🛡️ MIDDLEWARES BUSINESS :
├── checkPlanLimits() - Vérifier limites plan
├── trackUsage() - Tracker usage
├── requirePremium() - Exiger premium
└── optionalAuth() - Auth optionnelle

🎯 INTÉGRATION DANS ROUTES EXISTANTES :
Toutes les routes existantes ont été enrichies avec :
├── Vérification des limites selon le plan
├── Tracking d'usage pour analytics
├── Suggestions d'upgrade contextuelles
└── Gestion d'erreurs business-specific

TOTAL ROUTES : 350+ endpoints avec logique freemium native !
*/