#!/usr/bin/env node

// =============================================================================
// 🌍 WOLOFDICT - GÉNÉRATEUR DE SERVICES (VERSION COMPLÈTE)
// Script : generateServices.js
// Description : Génère automatiquement tous les services pour WolofDict
// Usage : node generateServices.js
// =============================================================================

const fs = require('fs');
const path = require('path');

// =============================================================================
// 🎯 CONFIGURATION
// =============================================================================

const BASE_DIR = path.join(process.cwd(), 'backend', 'src', 'services');

// Couleurs pour les logs
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m✅ ${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m⚠️ ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m❌ ${msg}\x1b[0m`),
  title: (msg) => console.log(`\x1b[1m\x1b[35m${msg}\x1b[0m`)
};

// =============================================================================
// 📁 STRUCTURE COMPLÈTE DES SERVICES
// =============================================================================

const SERVICES = {
  // Services principaux
  core: [
    'AuthService',
    'EmailService', 
    'LoggerService',
    'SearchService',
    'NotificationService',
    'RedisService',
    'FileUploadService',
    'ValidationService'
  ],
  
  // Services business
  business: [
    'StripeService',
    'PayPalService', 
    'SubscriptionService',
    'PlanService',
    'InvoiceService',
    'AnalyticsService'
  ],
  
  // Services communication
  communication: [
    'SMSService',
    'PushService',
    'NewsletterService'
  ],
  
  // Services media
  media: [
    'AudioService',
    'ImageService',
    'StorageService'
  ],
  
  // Services utils
  utils: [
    'EncryptionService',
    'DateService',
    'SlugService'
  ],

  // Services IA
  ai: [
    'TranslationService',
    'SpeechService',
    'NLPService'
  ]
};

// =============================================================================
// 🔧 FONCTIONS UTILITAIRES
// =============================================================================

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log.success(`Dossier créé: ${dirPath}`);
  }
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  log.success(`Fichier créé: ${filePath}`);
}

// =============================================================================
// 📝 TEMPLATES DES SERVICES
// =============================================================================

function generateBaseService(serviceName) {
  return `// =============================================================================
// 🌍 WOLOFDICT - ${serviceName.toUpperCase()}
// Généré automatiquement le ${new Date().toLocaleDateString()}
// =============================================================================

const logger = require('./LoggerService');

class ${serviceName} {
  constructor() {
    this.isInitialized = false;
    this.name = '${serviceName}';
  }

  async initialize() {
    try {
      // Configuration du service
      await this.setup();
      
      this.isInitialized = true;
      this.log('info', '${serviceName} initialisé avec succès');
      
    } catch (error) {
      this.log('error', 'Erreur initialisation ${serviceName}:', error.message);
      throw error;
    }
  }

  async setup() {
    // Configuration spécifique au service
    this.log('debug', 'Configuration ${serviceName}');
  }

  async performAction(data) {
    if (!this.isInitialized) {
      throw new Error('${serviceName} non initialisé');
    }

    try {
      this.log('info', 'Action ${serviceName} démarrée');
      
      // Logique métier du service
      const result = await this.processData(data);
      
      this.log('info', 'Action ${serviceName} terminée');
      return result;
      
    } catch (error) {
      this.log('error', 'Erreur ${serviceName}:', error.message);
      throw error;
    }
  }

  async processData(data) {
    return {
      success: true,
      data: data,
      service: this.name,
      timestamp: new Date().toISOString()
    };
  }

  log(level, message, ...args) {
    if (logger && logger[level]) {
      logger[level](message, ...args);
    } else {
      console.log('[' + level.toUpperCase() + '] ' + message, ...args);
    }
  }

  async cleanup() {
    this.isInitialized = false;
    this.log('info', this.name + ' nettoyé');
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ${serviceName}();
`;
}

// =============================================================================
// 🔧 SERVICES SPÉCIALISÉS
// =============================================================================

function generateLoggerService() {
  return `// =============================================================================
// 🌍 WOLOFDICT - LOGGER SERVICE
// Service de logging centralisé avec Winston + fallback console
// =============================================================================

const fs = require('fs');
const path = require('path');

class LoggerService {
  constructor() {
    this.isInitialized = false;
    this.logs = [];
  }

  async initialize() {
    try {
      // Essayer d'initialiser Winston si disponible
      try {
        const winston = require('winston');
        
        // Créer le dossier logs si nécessaire
        const logDir = path.join(__dirname, '../../../logs');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }

        this.winston = winston.createLogger({
          level: process.env.LOG_LEVEL || 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          ),
          transports: [
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
              )
            }),
            new winston.transports.File({
              filename: path.join(logDir, 'error.log'),
              level: 'error'
            }),
            new winston.transports.File({
              filename: path.join(logDir, 'combined.log')
            })
          ]
        });

        console.log('✅ Winston initialisé avec fichiers de logs');
      } catch (error) {
        console.log('⚠️ Winston non disponible, utilisation console');
        this.winston = null;
      }
      
      this.isInitialized = true;
      this.info('LoggerService initialisé');
      
    } catch (error) {
      console.error('Erreur initialisation LoggerService:', error);
      throw error;
    }
  }

  info(message, ...args) {
    const logEntry = '[INFO] ' + message;
    this.logs.push({ level: 'info', message, timestamp: new Date() });
    
    if (this.winston) {
      this.winston.info(message, ...args);
    } else {
      console.log(logEntry, ...args);
    }
  }

  error(message, ...args) {
    const logEntry = '[ERROR] ' + message;
    this.logs.push({ level: 'error', message, timestamp: new Date() });
    
    if (this.winston) {
      this.winston.error(message, ...args);
    } else {
      console.error(logEntry, ...args);
    }
  }

  warn(message, ...args) {
    const logEntry = '[WARN] ' + message;
    this.logs.push({ level: 'warn', message, timestamp: new Date() });
    
    if (this.winston) {
      this.winston.warn(message, ...args);
    } else {
      console.warn(logEntry, ...args);
    }
  }

  debug(message, ...args) {
    const logEntry = '[DEBUG] ' + message;
    this.logs.push({ level: 'debug', message, timestamp: new Date() });
    
    if (this.winston) {
      this.winston.debug(message, ...args);
    } else {
      console.log(logEntry, ...args);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

module.exports = new LoggerService();
`;
}

function generateAuthService() {
  return `// =============================================================================
// 🌍 WOLOFDICT - AUTH SERVICE
// Service d'authentification JWT + bcrypt + OAuth ready
// =============================================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logger = require('./LoggerService');

class AuthService {
  constructor() {
    this.isInitialized = false;
    this.name = 'AuthService';
    this.jwtSecret = process.env.JWT_SECRET || 'wolofdict-secret-key';
    this.jwtExpires = process.env.JWT_EXPIRES || '7d';
    this.refreshExpires = process.env.REFRESH_TOKEN_EXPIRES || '30d';
  }

  async initialize() {
    try {
      if (this.jwtSecret === 'wolofdict-secret-key') {
        logger.warn('JWT_SECRET par défaut utilisé - À changer en production!');
      }
      
      this.isInitialized = true;
      logger.info('AuthService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation AuthService:', error.message);
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Rechercher l'utilisateur (à implémenter avec votre DB)
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier le mot de passe
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new Error('Mot de passe incorrect');
      }

      // Générer les tokens
      const tokens = this.generateTokens(user);
      
      logger.info('Connexion réussie pour: ' + email);
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
      
    } catch (error) {
      logger.error('Erreur login:', error.message);
      throw error;
    }
  }

  async register(userData) {
    try {
      // Vérifier si l'utilisateur existe
      const existing = await this.findUserByEmail(userData.email);
      if (existing) {
        throw new Error('Email déjà utilisé');
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Créer l'utilisateur (à implémenter avec votre DB)
      const user = await this.createUser({
        ...userData,
        password: hashedPassword,
        isVerified: false,
        createdAt: new Date()
      });

      // Générer les tokens
      const tokens = this.generateTokens(user);
      
      logger.info('Nouvel utilisateur créé: ' + userData.email);
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
      
    } catch (error) {
      logger.error('Erreur register:', error.message);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret);
      const user = await this.findUserById(decoded.userId);
      
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      const tokens = this.generateTokens(user);
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
      
    } catch (error) {
      logger.error('Erreur refresh token:', error.message);
      throw error;
    }
  }

  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user'
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpires
    });

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshExpires
    });

    return { accessToken, refreshToken };
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  sanitizeUser(user) {
    const clean = { ...user };
    delete clean.password;
    return clean;
  }

  // OAuth méthodes (à implémenter selon besoin)
  async handleGoogleAuth(googleToken) {
    // TODO: Implémenter OAuth Google
    throw new Error('OAuth Google à implémenter');
  }

  async handleFacebookAuth(facebookToken) {
    // TODO: Implémenter OAuth Facebook
    throw new Error('OAuth Facebook à implémenter');
  }

  // Méthodes à implémenter avec votre ORM/DB
  async findUserByEmail(email) {
    // TODO: Implémenter avec votre base de données
    return null;
  }

  async findUserById(id) {
    // TODO: Implémenter avec votre base de données
    return null;
  }

  async createUser(userData) {
    // TODO: Implémenter avec votre base de données
    return { id: Date.now(), ...userData };
  }
}

module.exports = new AuthService();
`;
}

function generateEmailService() {
  return `// =============================================================================
// 🌍 WOLOFDICT - EMAIL SERVICE
// Service d'envoi d'emails avec Nodemailer + 5 templates Handlebars
// =============================================================================

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const logger = require('./LoggerService');

class EmailService {
  constructor() {
    this.isInitialized = false;
    this.name = 'EmailService';
    this.transporter = null;
    this.templates = {};
  }

  async initialize() {
    try {
      // Configuration Nodemailer
      this.transporter = nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      // Test de connexion si credentials fournis
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await this.transporter.verify();
        logger.info('Connexion email vérifiée');
      }

      // Charger les templates Handlebars
      await this.loadTemplates();
      
      this.isInitialized = true;
      logger.info('EmailService initialisé avec 5 templates');
      
    } catch (error) {
      logger.error('Erreur initialisation EmailService:', error.message);
      throw error;
    }
  }

  async loadTemplates() {
    this.templates = {
      welcome: this.createWelcomeTemplate(),
      verification: this.createVerificationTemplate(),
      passwordReset: this.createPasswordResetTemplate(),
      subscription: this.createSubscriptionTemplate(),
      newsletter: this.createNewsletterTemplate()
    };
    
    logger.info('Templates Handlebars chargés: welcome, verification, passwordReset, subscription, newsletter');
  }

  async sendEmail({ to, subject, template, data, html, text }) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      let htmlContent = html;
      
      // Utiliser template si fourni
      if (template && this.templates[template]) {
        htmlContent = this.templates[template](data || {});
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: htmlContent,
        text: text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email envoyé à: ' + to);
      return result;
      
    } catch (error) {
      logger.error('Erreur envoi email:', error.message);
      throw error;
    }
  }

  // Templates prêts à l'emploi
  async sendWelcomeEmail(userEmail, userName) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Bienvenue sur WolofDict! 🌍',
      template: 'welcome',
      data: { userName }
    });
  }

  async sendVerificationEmail(userEmail, token) {
    const verificationUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/verify?token=' + token;
    return this.sendEmail({
      to: userEmail,
      subject: 'Vérifiez votre email - WolofDict',
      template: 'verification',
      data: { verificationUrl, userEmail }
    });
  }

  async sendPasswordResetEmail(userEmail, resetToken) {
    const resetUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/reset-password?token=' + resetToken;
    return this.sendEmail({
      to: userEmail,
      subject: 'Réinitialisation mot de passe - WolofDict',
      template: 'passwordReset',
      data: { resetUrl, userEmail }
    });
  }

  async sendSubscriptionEmail(userEmail, subscriptionData) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Abonnement ' + subscriptionData.planName + ' activé!',
      template: 'subscription',
      data: subscriptionData
    });
  }

  async sendNewsletterEmail(userEmail, newsletterData) {
    return this.sendEmail({
      to: userEmail,
      subject: newsletterData.subject || 'Newsletter WolofDict',
      template: 'newsletter',
      data: { ...newsletterData, userEmail }
    });
  }

  // Templates Handlebars
  createWelcomeTemplate() {
    const templateString = \`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Bienvenue sur WolofDict! 🌍</h1>
  </div>
  <div style="padding: 40px 30px; background: white; margin: 20px 0;">
    <h2 style="color: #333; margin-top: 0;">Salut {{userName}}!</h2>
    <p style="color: #666; line-height: 1.6; font-size: 16px;">Félicitations! Vous faites maintenant partie de la communauté WolofDict, la plateforme collaborative pour apprendre et préserver la langue wolof.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #333; margin-top: 0;">Commencez votre apprentissage :</h3>
      <ul style="color: #666; line-height: 1.6;">
        <li>Explorez notre dictionnaire de 10,000+ mots</li>
        <li>Écoutez les prononciations authentiques</li>
        <li>Rejoignez notre communauté active</li>
        <li>Contribuez à la préservation du wolof</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Commencer l'apprentissage →</a>
    </div>
  </div>
</div>\`;

    return handlebars.compile(templateString);
  }

  createVerificationTemplate() {
    const templateString = \`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #28a745; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Vérifiez votre email</h1>
  </div>
  <div style="padding: 30px; background: white;">
    <p style="color: #666; line-height: 1.6;">Bonjour,</p>
    <p style="color: #666; line-height: 1.6;">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email <strong>{{userEmail}}</strong> et activer votre compte WolofDict.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{verificationUrl}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Vérifier mon email →</a>
    </div>
    <p style="color: #999; font-size: 14px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
  </div>
</div>\`;

    return handlebars.compile(templateString);
  }

  createPasswordResetTemplate() {
    const templateString = \`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #dc3545; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Réinitialisation mot de passe</h1>
  </div>
  <div style="padding: 30px; background: white;">
    <p style="color: #666; line-height: 1.6;">Bonjour,</p>
    <p style="color: #666; line-height: 1.6;">Vous avez demandé la réinitialisation de votre mot de passe pour le compte <strong>{{userEmail}}</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe →</a>
    </div>
    <p style="color: #999; font-size: 14px;">Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
  </div>
</div>\`;

    return handlebars.compile(templateString);
  }

  createSubscriptionTemplate() {
    const templateString = \`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ffc107; padding: 30px; text-align: center;">
    <h1 style="color: #212529; margin: 0;">Abonnement activé! 🎉</h1>
  </div>
  <div style="padding: 30px; background: white;">
    <h2 style="color: #333;">Félicitations!</h2>
    <p style="color: #666; line-height: 1.6;">Votre abonnement <strong>{{planName}}</strong> est maintenant actif.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Vos nouveaux avantages :</h3>
      <ul style="color: #666;">
        <li>Accès illimité au dictionnaire complet</li>
        <li>Audio haute qualité et téléchargements</li>
        <li>Outils d'apprentissage avancés</li>
        <li>Support prioritaire</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="background: #ffc107; color: #212529; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Découvrir Premium →</a>
    </div>
  </div>
</div>\`;

    return handlebars.compile(templateString);
  }

  createNewsletterTemplate() {
    const templateString = \`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #6f42c1; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Newsletter WolofDict 📚</h1>
  </div>
  <div style="padding: 30px; background: white;">
    <h2 style="color: #333;">{{title}}</h2>
    <div style="color: #666; line-height: 1.6;">
      {{{content}}}
    </div>
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
      <p style="color: #999; font-size: 14px; text-align: center;">Vous recevez cet email car vous êtes abonné à la newsletter WolofDict.</p>
    </div>
  </div>
</div>\`;

    return handlebars.compile(templateString);
  }
}

module.exports = new EmailService();
`;
}

function generateStripeService() {
  return `// =============================================================================
// 🌍 WOLOFDICT - STRIPE SERVICE
// Service de paiements + abonnements + webhooks complets
// =============================================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../LoggerService');

class StripeService {
  constructor() {
    this.isInitialized = false;
    this.name = 'StripeService';
    this.stripe = null;
  }

  async initialize() {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY manquant');
      }

      this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Test de connexion
      await this.stripe.balance.retrieve();
      
      this.isInitialized = true;
      logger.info('StripeService initialisé avec webhooks');
      
    } catch (error) {
      logger.error('Erreur initialisation StripeService:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 👤 GESTION CLIENTS
  // =============================================================================

  async createCustomer(userData) {
    try {
      const customer = await this.stripe.customers.create({
        email: userData.email,
        name: userData.name,
        metadata: {
          userId: userData.id.toString(),
          source: 'wolofdict'
        }
      });

      logger.info('Client Stripe créé: ' + customer.id);
      return customer;
      
    } catch (error) {
      logger.error('Erreur création client:', error.message);
      throw error;
    }
  }

  async getOrCreateCustomer(user) {
    if (user.stripeCustomerId) {
      try {
        return await this.stripe.customers.retrieve(user.stripeCustomerId);
      } catch (error) {
        logger.warn('Client Stripe introuvable, création nouveau');
      }
    }
    return this.createCustomer(user);
  }

  // =============================================================================
  // 💳 GESTION ABONNEMENTS
  // =============================================================================

  async createSubscription({ customer, priceId, paymentMethod, trialDays = 0 }) {
    try {
      const subscriptionData = {
        customer,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      };

      if (trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      if (paymentMethod) {
        subscriptionData.default_payment_method = paymentMethod;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);
      
      logger.info('Abonnement Stripe créé: ' + subscription.id);
      return subscription;
      
    } catch (error) {
      logger.error('Erreur création abonnement:', error.message);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updates) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, updates);
      logger.info('Abonnement mis à jour: ' + subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Erreur mise à jour abonnement:', error.message);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.del(subscriptionId);
      logger.info('Abonnement annulé: ' + subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Erreur annulation abonnement:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 💰 GESTION PAIEMENTS
  // =============================================================================

  async createPaymentIntent({ amount, currency = 'eur', customer, metadata = {} }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir en centimes
        currency,
        customer,
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });

      logger.info('PaymentIntent créé: ' + paymentIntent.id);
      return paymentIntent;
      
    } catch (error) {
      logger.error('Erreur PaymentIntent:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🔔 WEBHOOKS
  // =============================================================================

  async handleWebhook(body, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      logger.info('Webhook Stripe reçu: ' + event.type);

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          logger.info('Webhook non géré: ' + event.type);
      }

      return { received: true };
      
    } catch (error) {
      logger.error('Erreur webhook:', error.message);
      throw error;
    }
  }

  async handleSubscriptionCreated(subscription) {
    logger.info('Abonnement créé webhook: ' + subscription.id);
    // TODO: Logique business après création abonnement
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info('Abonnement mis à jour webhook: ' + subscription.id);
    // TODO: Logique business après mise à jour abonnement
  }

  async handleSubscriptionDeleted(subscription) {
    logger.info('Abonnement supprimé webhook: ' + subscription.id);
    // TODO: Logique business après suppression abonnement
  }

  async handlePaymentSucceeded(invoice) {
    logger.info('Paiement réussi: ' + invoice.id);
    // TODO: Logique business après paiement réussi
  }

  async handlePaymentFailed(invoice) {
    logger.info('Paiement échoué: ' + invoice.id);
    // TODO: Logique business après échec paiement
  }
}

module.exports = new StripeService();
`;
}

// =============================================================================
// 📝 GÉNÉRATION DES FICHIERS
// =============================================================================

function generateServiceIndex() {
  const imports = [];
  const exports = [];
  
  // Ajouter tous les services
  Object.entries(SERVICES).forEach(([category, serviceList]) => {
    serviceList.forEach(serviceName => {
      if (category === 'core') {
        imports.push('const ' + serviceName + ' = require(\'./' + serviceName + '\');');
      } else {
        imports.push('const ' + serviceName + ' = require(\'./' + category + '/' + serviceName + '\');');
      }
      exports.push('  ' + serviceName);
    });
  });

  return `// =============================================================================
// 🌍 WOLOFDICT - INDEX DES SERVICES
// Point d'entrée + initialisation globale
// Généré automatiquement le ${new Date().toLocaleDateString()}
// =============================================================================

${imports.join('\n')}

module.exports = {
${exports.join(',\n')}
};

// =============================================================================
// 🚀 INITIALISATION GLOBALE
// =============================================================================

const initializeAllServices = async () => {
  const services = [${exports.join(', ')}];
  const results = [];
  let successCount = 0;

  console.log('🔧 Initialisation de ' + services.length + ' services...');

  for (const service of services) {
    try {
      if (service && typeof service.initialize === 'function') {
        await service.initialize();
        results.push({ service: service.name, status: 'success' });
        successCount++;
      } else {
        results.push({ service: service.name, status: 'skipped', reason: 'No initialize method' });
      }
    } catch (error) {
      results.push({ service: service.name, status: 'error', error: error.message });
    }
  }

  console.log('✅ ' + successCount + '/' + services.length + ' services initialisés avec succès');
  return results;
};

const getServiceStatus = () => {
  const services = [${exports.join(', ')}];
  return services.map(service => ({
    name: service.name || 'Unknown',
    initialized: service.isInitialized || false,
    hasInitialize: typeof service.initialize === 'function'
  }));
};

const shutdownAllServices = async () => {
  const services = [${exports.join(', ')}];
  const results = [];

  for (const service of services) {
    try {
      if (service && typeof service.cleanup === 'function') {
        await service.cleanup();
        results.push({ service: service.name, status: 'cleaned' });
      }
    } catch (error) {
      results.push({ service: service.name, status: 'error', error: error.message });
    }
  }

  return results;
};

module.exports.initializeAllServices = initializeAllServices;
module.exports.getServiceStatus = getServiceStatus;
module.exports.shutdownAllServices = shutdownAllServices;
`;
}

function generateConfigFile() {
  return `// =============================================================================
// 🌍 WOLOFDICT - CONFIGURATION CENTRALISÉE
// Configuration pour tous les services
// =============================================================================

module.exports = {
  // Application
  app: {
    name: 'WolofDict',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
  },

  // Base de données
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    name: process.env.DB_NAME || 'wolofdict',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: process.env.DB_DIALECT || 'mysql'
  },

  // Authentification
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'wolofdict-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES || '7d',
    refreshTokenExpires: process.env.REFRESH_TOKEN_EXPIRES || '30d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },

  // Email
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD
  },

  // AWS
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'eu-west-1',
    s3Bucket: process.env.AWS_S3_BUCKET
  },

  // Upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760,
    allowedTypes: ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav'],
    destination: process.env.UPLOAD_DESTINATION || 'uploads/'
  },

  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER
  },

  // Firebase
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    databaseUrl: process.env.FIREBASE_DATABASE_URL
  },

  // Search
  search: {
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
  },

  // AI Services
  ai: {
    googleCloudKeyPath: process.env.GOOGLE_CLOUD_KEY_PATH,
    googleProjectId: process.env.GOOGLE_PROJECT_ID
  }
};
`;
}

function generateEnvExample() {
  return `# =============================================================================
# 🌍 WOLOFDICT - VARIABLES D'ENVIRONNEMENT
# Copiez ce fichier vers .env et configurez les valeurs
# =============================================================================

# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wolofdict
DB_USERNAME=root
DB_PASSWORD=password
DB_DIALECT=mysql

# Authentification
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES=7d
REFRESH_TOKEN_EXPIRES=30d
BCRYPT_ROUNDS=12

# Email (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=WolofDict <noreply@wolofdict.com>

# Stripe (Paiements)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# PayPal (Paiements)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

# Redis (Cache)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS (Stockage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=wolofdict-storage

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Push notifications)
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_DESTINATION=uploads/

# Recherche
ELASTICSEARCH_URL=http://localhost:9200

# Logging
LOG_LEVEL=info

# AI Services
GOOGLE_CLOUD_KEY_PATH=./config/google-cloud-key.json
GOOGLE_PROJECT_ID=your-project-id
`;
}

function generatePackageJson() {
  return `{
  "name": "wolofdict-services",
  "version": "1.0.0",
  "description": "Services complets WolofDict avec business freemium",
  "main": "index.js",
  "scripts": {
    "test": "node test-services.js",
    "init": "node -e \\"const services = require('./backend/src/services'); services.initializeAllServices().then(r => console.log('✅ Services initialisés:', r));\\"",
    "status": "node -e \\"const services = require('./backend/src/services'); console.log('📊 Statut:', services.getServiceStatus());\\"",
    "dev": "nodemon app.js",
    "start": "node app.js"
  },
  "dependencies": {
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "nodemailer": "^6.9.1",
    "handlebars": "^4.7.7",
    "stripe": "^12.0.0",
    "@paypal/checkout-server-sdk": "^1.0.3",
    "twilio": "^4.10.0",
    "firebase-admin": "^11.7.0",
    "redis": "^4.6.5",
    "ioredis": "^5.3.2",
    "aws-sdk": "^2.1350.0",
    "multer": "^1.4.5",
    "sharp": "^0.32.0",
    "joi": "^17.9.1",
    "validator": "^13.9.0",
    "slugify": "^1.6.6",
    "moment": "^2.29.4",
    "date-fns": "^2.29.3",
    "fluent-ffmpeg": "^2.1.2",
    "imagemin": "^8.0.1",
    "cloudinary": "^1.37.3",
    "elasticsearch": "^16.7.3",
    "fuse.js": "^6.6.2",
    "natural": "^6.3.0",
    "compromise": "^14.10.0",
    "@google-cloud/translate": "^8.0.2",
    "@google-cloud/speech": "^5.5.0"
  },
  "devDependencies": {
    "winston": "^3.8.2",
    "nodemon": "^2.0.22"
  },
  "optionalDependencies": {
    "winston": "^3.8.2"
  }
}
`;
}

function generateTestScript() {
  return `// =============================================================================
// 🧪 TEST DES SERVICES WOLOFDICT
// =============================================================================

const services = require('./backend/src/services');

async function testServices() {
  console.log('🧪 Test des services WolofDict...');
  console.log('📦 Services disponibles:', Object.keys(services).filter(k => !k.includes('All')));

  try {
    // Test initialisation
    console.log('🔧 Initialisation des services...');
    const results = await services.initializeAllServices();

    // Statistiques
    const successful = results.filter(r => r.status === 'success').length;
    const failed = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    console.log('\\n📊 Résultats d\\'initialisation:');
    console.log('  ✅ Réussis: ' + successful);
    console.log('  ❌ Échoués: ' + failed);
    console.log('  ⏭️  Ignorés: ' + skipped);

    // Détails des erreurs
    const errors = results.filter(r => r.status === 'error');
    if (errors.length > 0) {
      console.log('❌ Erreurs détaillées:');
      errors.forEach(error => {
        console.log('  - ' + error.service + ': ' + error.error);
      });
    }

    // Test statut
    console.log('📋 Statut des services:');
    const status = services.getServiceStatus();
    status.forEach(s => {
      const icon = s.initialized ? '✅' : '❌';
      console.log('  ' + icon + ' ' + s.name + ' (' + (s.initialized ? 'initialisé' : 'non initialisé') + ')');
    });

    // Test services principaux
    console.log('🔍 Test des services principaux...');

    // Test AuthService
    if (services.AuthService.isInitialized) {
      try {
        const testUser = { id: 1, email: 'test@test.com', role: 'user' };
        const tokens = services.AuthService.generateTokens(testUser);
        console.log('  ✅ AuthService: Génération tokens OK');
      } catch (error) {
        console.log('  ❌ AuthService: ' + error.message);
      }
    }

    // Test EmailService
    if (services.EmailService.isInitialized) {
      try {
        console.log('  ✅ EmailService: ' + Object.keys(services.EmailService.templates).length + ' templates chargés');
      } catch (error) {
        console.log('  ❌ EmailService: ' + error.message);
      }
    }

    console.log('🎉 Test terminé avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

testServices();
`;
}

// =============================================================================
// 🎯 FONCTION PRINCIPALE
// =============================================================================

async function generateServices() {
  try {
    log.title('🌍 GÉNÉRATEUR DE SERVICES WOLOFDICT (VERSION COMPLÈTE)');
    log.title('=========================================================');

    // 1. Créer la structure de dossiers
    log.info('\n📁 Création de la structure...');
    createDirectory(BASE_DIR);
    createDirectory(path.join(BASE_DIR, 'business'));
    createDirectory(path.join(BASE_DIR, 'communication'));
    createDirectory(path.join(BASE_DIR, 'media'));
    createDirectory(path.join(BASE_DIR, 'utils'));
    createDirectory(path.join(BASE_DIR, 'ai'));

    // 2. Générer les services spécialisés complets
    log.info('\n🔧 Génération des services spécialisés...');
    writeFile(path.join(BASE_DIR, 'LoggerService.js'), generateLoggerService());
    writeFile(path.join(BASE_DIR, 'AuthService.js'), generateAuthService());
    writeFile(path.join(BASE_DIR, 'EmailService.js'), generateEmailService());
    writeFile(path.join(BASE_DIR, 'business', 'StripeService.js'), generateStripeService());

    // 3. Générer les services de base
    log.info('\n📦 Génération des services de base...');
    Object.entries(SERVICES).forEach(([category, serviceList]) => {
      serviceList.forEach(serviceName => {
        if (!['LoggerService', 'AuthService', 'EmailService', 'StripeService'].includes(serviceName)) {
          const dir = category === 'core' ? BASE_DIR : path.join(BASE_DIR, category);
          writeFile(path.join(dir, serviceName + '.js'), generateBaseService(serviceName));
        }
      });
    });

    // 4. Générer les fichiers de configuration
    log.info('\n⚙️ Génération des fichiers de configuration...');
    const rootDir = path.dirname(path.dirname(BASE_DIR));
    
    writeFile(path.join(BASE_DIR, 'index.js'), generateServiceIndex());
    writeFile(path.join(BASE_DIR, 'config.js'), generateConfigFile());
    writeFile(path.join(rootDir, '.env.example'), generateEnvExample());
    writeFile(path.join(rootDir, 'package.json'), generatePackageJson());
    writeFile(path.join(rootDir, 'test-services.js'), generateTestScript());

    // 5. Statistiques finales
    const totalServices = Object.values(SERVICES).flat().length;
    
    log.title('\n📊 GÉNÉRATION TERMINÉE');
    log.title('====================');
    log.success('Services générés: ' + totalServices);
    log.success('Dossiers créés: 6 (core + 5 catégories)');
    log.success('Fichiers créés: ' + (totalServices + 5));
    
    log.info('\n🎯 Services par catégorie:');
    Object.entries(SERVICES).forEach(([category, services]) => {
      log.info('  ' + category + ': ' + services.length + ' services');
    });

    log.info('\n🚀 Prochaines étapes:');
    log.info('1. cd vers le dossier racine');
    log.info('2. npm install');
    log.info('3. cp .env.example .env');
    log.info('4. npm test');
    log.info('5. npm run init');
    
  } catch (error) {
    log.error('Erreur génération:', error.message);
    process.exit(1);
  }
}

// Lancer la génération
generateServices();