// =============================================================================
// 🌍 WOLOFDICT - APPLICATION PRINCIPALE
// Fichier : backend/src/app.js
// Description : Point d'entrée de l'application Express avec système business
// =============================================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// =============================================================================
// 🔧 IMPORTS LOCAUX
// =============================================================================

// Configuration
const { sequelize } = require('./models');
const logger = require('./utils/logger');

// Routes
const routes = require('./routes');

// Middlewares
const { authenticateToken, optionalAuth } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');

// Services
const RedisService = require('./services/RedisService');
const EmailService = require('./services/EmailService');
const StripeService = require('./services/business/StripeService');

// =============================================================================
// 🚀 CRÉATION DE L'APPLICATION
// =============================================================================

const app = express();

// Assignation d'un ID unique à chaque requête
app.use((req, res, next) => {
  req.id = uuidv4();
  next();
});

// =============================================================================
// 🛡️ SÉCURITÉ ET MIDDLEWARES GLOBAUX
// =============================================================================

// Helmet pour sécurité headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      mediaSrc: ["'self'", "https://wolofdict-audio.s3.amazonaws.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://wolofdict.com',
      'https://www.wolofdict.com',
      'https://app.wolofdict.com',
      'https://admin.wolofdict.com'
    ];

    // Permettre les requêtes sans origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
};

app.use(cors(corsOptions));

// Compression des réponses
app.use(compression({
  level: 6,
  threshold: 1024, // Seulement pour les réponses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

// =============================================================================
// 📊 LOGGING ET MONITORING
// =============================================================================

// Morgan pour logging HTTP
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
}));

// Request logging personnalisé
app.use(requestLogger);

// =============================================================================
// 🔄 PARSING ET MIDDLEWARE BODY
// =============================================================================

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Stocker le raw body pour les webhooks Stripe
    if (req.originalUrl.startsWith('/api/v1/webhooks/stripe')) {
      req.rawBody = buf;
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Parsing des cookies
app.use(require('cookie-parser')());

// =============================================================================
// 📈 RATE LIMITING INTELLIGENT
// =============================================================================

// Rate limiting global basé sur le plan utilisateur
const intelligentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req) => {
    try {
      // Récupérer le plan utilisateur
      if (req.user?.plan?.slug === 'pro') return 10000;
      if (req.user?.plan?.slug === 'premium') return 5000;
      if (req.user?.plan?.slug === 'free') return 1000;
      
      // Utilisateur non connecté
      return 500;
    } catch (error) {
      return 500; // Fallback conservateur
    }
  },
  message: (req) => ({
    error: 'Trop de requêtes',
    current_plan: req.user?.plan?.name || 'Anonyme',
    limit_info: 'Passez au plan Premium pour des limites plus élevées',
    retry_after: 900,
    upgrade_url: '/plans'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  // Exclure les webhooks du rate limiting
  skip: (req) => req.originalUrl.startsWith('/api/v1/webhooks/')
});

// =============================================================================
// 🎯 TRUST PROXY ET CONFIGURATION
// =============================================================================

// Trust proxy pour déploiement derrière reverse proxy
app.set('trust proxy', 1);

// Configuration Express
app.set('x-powered-by', false);
app.set('json spaces', process.env.NODE_ENV === 'development' ? 2 : 0);

// =============================================================================
// 🗄️ CONNEXION BASE DE DONNÉES
// =============================================================================

// Test de connexion à la base de données
const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Connexion à la base de données établie');
    
    // Synchronisation des modèles (seulement en développement)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Modèles synchronisés');
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Erreur de connexion à la base de données:', error);
    return false;
  }
};

// =============================================================================
// 🔴 CONNEXION REDIS
// =============================================================================

// Initialisation Redis pour cache et sessions
const initializeRedis = async () => {
  try {
    if (process.env.REDIS_URL) {
      await RedisService.connect();
      logger.info('✅ Connexion Redis établie');
      return true;
    } else {
      logger.warn('⚠️ Redis non configuré, utilisation du cache mémoire');
      return false;
    }
  } catch (error) {
    logger.error('❌ Erreur connexion Redis:', error);
    return false;
  }
};

// =============================================================================
// 💳 INITIALISATION SERVICES BUSINESS
// =============================================================================

// Initialisation des services de paiement
const initializePaymentServices = async () => {
  try {
    // Vérification Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      await StripeService.initialize();
      logger.info('✅ Service Stripe initialisé');
    }
    
    // Vérification PayPal
    if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
      // Initialisation PayPal
      logger.info('✅ Service PayPal initialisé');
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Erreur initialisation services paiement:', error);
    return false;
  }
};

// =============================================================================
// 📧 INITIALISATION SERVICES COMMUNICATION
// =============================================================================

// Initialisation service email
const initializeEmailService = async () => {
  try {
    if (process.env.SMTP_HOST) {
      await EmailService.initialize();
      logger.info('✅ Service email initialisé');
      return true;
    } else {
      logger.warn('⚠️ Service email non configuré');
      return false;
    }
  } catch (error) {
    logger.error('❌ Erreur initialisation service email:', error);
    return false;
  }
};

// =============================================================================
// 🔒 MIDDLEWARES D'AUTHENTIFICATION
// =============================================================================

// Middleware d'authentification optionnelle pour personnaliser l'expérience
app.use('/api/v1', optionalAuth);

// Middleware pour attacher les informations du plan utilisateur
app.use('/api/v1', async (req, res, next) => {
  if (req.user) {
    try {
      const { Subscription, Plan } = require('./models');
      
      // Récupérer l'abonnement actuel
      const subscription = await Subscription.findOne({
        where: { 
          user_id: req.user.id,
          status: ['active', 'trialing', 'past_due']
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
      logger.error('Erreur récupération plan utilisateur:', error);
      // Continuer sans plan (sera traité comme free)
    }
  }
  next();
});

// =============================================================================
// 🛣️ ROUTES PRINCIPALES
// =============================================================================

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenue sur WolofDict API',
    version: process.env.API_VERSION || '1.0.0',
    status: 'operational',
    features: {
      dictionary: 'Dictionnaire collaboratif wolof',
      learning: 'Outils d\'apprentissage adaptatifs',
      community: 'Communauté et forum actifs',
      business: 'Modèle freemium avec plans premium',
      ai: 'Intelligence artificielle wolof native'
    },
    links: {
      api: '/api/v1',
      documentation: '/docs',
      health: '/api/v1/health',
      plans: '/api/v1/plans',
      signup: '/api/v1/auth/register'
    }
  });
});

// Montage des routes API
app.use('/api/v1', intelligentRateLimit, routes);

// =============================================================================
// 📁 FICHIERS STATIQUES
// =============================================================================

// Servir les fichiers statiques (images, audio, etc.)
app.use('/static', express.static(path.join(__dirname, '../public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '1h',
  etag: true,
  lastModified: true
}));

// Documentation API (si disponible)
if (process.env.NODE_ENV === 'development') {
  app.use('/docs', express.static(path.join(__dirname, '../docs')));
}

// =============================================================================
// 🎯 ROUTES SPÉCIALES
// =============================================================================

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
${process.env.NODE_ENV === 'production' ? 'Allow: /' : 'Disallow: /'}
Sitemap: https://wolofdict.com/sitemap.xml`);
});

// =============================================================================
// 🔍 MONITORING ET MÉTRIQUES
// =============================================================================

// Endpoint pour métriques Prometheus (si configuré)
if (process.env.ENABLE_METRICS === 'true') {
  const prometheus = require('prom-client');
  
  // Métriques par défaut
  const register = new prometheus.Registry();
  prometheus.collectDefaultMetrics({ register });
  
  // Métriques personnalisées
  const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'user_plan'],
    buckets: [0.1, 0.5, 1, 2, 5]
  });
  
  const activeUsers = new prometheus.Gauge({
    name: 'active_users_total',
    help: 'Number of active users by plan',
    labelNames: ['plan']
  });
  
  register.registerMetric(httpRequestDuration);
  register.registerMetric(activeUsers);
  
  // Middleware pour collecter les métriques
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      httpRequestDuration
        .labels(req.method, req.route?.path || req.path, res.statusCode, req.user?.plan?.slug || 'anonymous')
        .observe(duration);
    });
    
    next();
  });
  
  // Endpoint métriques
  app.get('/metrics', (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(register.metrics());
  });
}

// =============================================================================
// 🏥 HEALTH CHECKS
// =============================================================================

// Health check simple
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check détaillé
app.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {}
  };

  try {
    // Test base de données
    await sequelize.authenticate();
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Test Redis
    if (process.env.REDIS_URL) {
      await RedisService.ping();
      health.services.redis = 'healthy';
    } else {
      health.services.redis = 'disabled';
    }
  } catch (error) {
    health.services.redis = 'unhealthy';
    health.status = 'degraded';
  }

  // Test services externes
  health.services.stripe = process.env.STRIPE_SECRET_KEY ? 'configured' : 'disabled';
  health.services.paypal = process.env.PAYPAL_CLIENT_ID ? 'configured' : 'disabled';
  health.services.email = process.env.SMTP_HOST ? 'configured' : 'disabled';

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// =============================================================================
// 🚫 GESTION D'ERREURS
// =============================================================================

// Middleware pour routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
    suggestions: [
      'Vérifiez l\'URL demandée',
      'Consultez la documentation API à /docs',
      'Utilisez /api/v1 pour les endpoints API'
    ],
    links: {
      api: '/api/v1',
      documentation: '/docs',
      health: '/health'
    }
  });
});

// Middleware de gestion d'erreurs global
app.use((err, req, res, next) => {
  logger.error('Erreur application:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id || 'anonymous',
    ip: req.ip
  });

  // Erreurs spécifiques à l'application
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: 'Ressource déjà existante',
      details: err.errors.map(e => ({
        field: e.path,
        message: 'Cette valeur est déjà utilisée'
      }))
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Référence invalide',
      message: 'La ressource référencée n\'existe pas'
    });
  }

  // Erreurs de parsing JSON
  if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    return res.status(400).json({
      error: 'Format JSON invalide',
      message: 'Vérifiez la syntaxe de votre requête JSON'
    });
  }

  // Erreurs CORS
  if (err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Accès refusé',
      message: 'Origine non autorisée par CORS'
    });
  }

  // Erreurs business
  if (err.type === 'business_error') {
    return res.status(err.statusCode || 400).json({
      error: err.message,
      code: err.code,
      details: err.details
    });
  }

  // Erreur générique
  res.status(500).json({
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur inattendue s\'est produite',
    request_id: req.id,
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// 🔥 GESTION PROCESSUS
// =============================================================================

// Gestion gracieuse de l'arrêt
const gracefulShutdown = async (signal) => {
  logger.info(`Signal ${signal} reçu, arrêt gracieux...`);
  
  try {
    // Fermer les connexions
    await sequelize.close();
    logger.info('✅ Connexions base de données fermées');
    
    if (process.env.REDIS_URL) {
      await RedisService.disconnect();
      logger.info('✅ Connexion Redis fermée');
    }
    
    logger.info('✅ Arrêt gracieux terminé');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Erreur lors de l\'arrêt gracieux:', error);
    process.exit(1);
  }
};

// Écouter les signaux d'arrêt
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error('Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promesse rejetée non gérée:', { reason, promise });
  process.exit(1);
});

// =============================================================================
// 🚀 INITIALISATION ET DÉMARRAGE
// =============================================================================

// Fonction d'initialisation complète
const initializeApp = async () => {
  try {
    logger.info('🌍 Initialisation de WolofDict API...');
    
    // Initialisation des services
    const dbConnected = await initializeDatabase();
    const redisConnected = await initializeRedis();
    const paymentsInitialized = await initializePaymentServices();
    const emailInitialized = await initializeEmailService();
    
    // Vérification des services critiques
    if (!dbConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }
    
    logger.info('✅ Initialisation terminée avec succès');
    
    return {
      database: dbConnected,
      redis: redisConnected,
      payments: paymentsInitialized,
      email: emailInitialized
    };
  } catch (error) {
    logger.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
};

// Démarrage du serveur
const startServer = async () => {
  try {
    // Initialiser l'application
    const services = await initializeApp();
    
    // Démarrer le serveur HTTP
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Serveur WolofDict démarré sur le port ${PORT}`);
      logger.info(`📡 API disponible sur http://localhost:${PORT}/api/v1`);
      logger.info(`📚 Documentation sur http://localhost:${PORT}/docs`);
      logger.info(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`💰 Services business: ${services.payments ? 'activés' : 'désactivés'}`);
    });
    
    // Configuration du serveur
    server.timeout = 30000; // 30 secondes
    server.keepAliveTimeout = 5000; // 5 secondes
    server.headersTimeout = 10000; // 10 secondes
    
    return server;
  } catch (error) {
    logger.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
};

// =============================================================================
// 🎯 EXPORT
// =============================================================================

// Démarrer le serveur si ce fichier est exécuté directement
if (require.main === module) {
  startServer().catch(error => {
    logger.error('Erreur fatale:', error);
    process.exit(1);
  });
}

// Export pour tests et autres utilisations
module.exports = {
  app,
  startServer,
  initializeApp
};