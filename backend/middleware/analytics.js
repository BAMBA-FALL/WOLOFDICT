// =============================================================================
// 📊 WOLOFDICT - ANALYTICS MIDDLEWARE COMPLET
// Middleware d'analytics et tracking intelligent
// =============================================================================

const logger = require('../services/LoggerService');
const crypto = require('crypto');

class AnalyticsMiddleware {
  constructor() {
    this.name = 'AnalyticsMiddleware';
    this.events = [];
    this.maxEvents = parseInt(process.env.ANALYTICS_MAX_EVENTS) || 10000;
    this.flushInterval = parseInt(process.env.ANALYTICS_FLUSH_INTERVAL) || 60000; // 1 minute
    this.isEnabled = process.env.ANALYTICS_ENABLED !== 'false';
    
    // Configuration des providers externes
    this.providers = {
      googleAnalytics: process.env.GA_TRACKING_ID || null,
      mixpanel: process.env.MIXPANEL_TOKEN || null,
      segment: process.env.SEGMENT_WRITE_KEY || null,
      custom: process.env.ANALYTICS_WEBHOOK_URL || null
    };

    // Statistiques
    this.stats = {
      totalEvents: 0,
      uniqueUsers: new Set(),
      pageViews: 0,
      apiCalls: 0,
      errors: 0,
      conversions: 0
    };

    if (this.isEnabled) {
      this.startEventProcessor();
      logger.info('Analytics middleware initialisé');
    }
  }

  // =============================================================================
  // 📊 COLLECTE D'ÉVÉNEMENTS
  // =============================================================================

  /**
   * Enregistrer un événement
   */
  trackEvent(eventData) {
    if (!this.isEnabled) return;

    try {
      const event = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...eventData
      };

      this.events.push(event);
      this.stats.totalEvents++;

      // Maintenir la limite d'événements en mémoire
      if (this.events.length > this.maxEvents) {
        this.events.shift();
      }

      // Mettre à jour les stats
      this.updateStats(event);

    } catch (error) {
      logger.error('Erreur tracking événement:', error.message);
    }
  }

  /**
   * Mettre à jour les statistiques
   */
  updateStats(event) {
    if (event.userId) {
      this.stats.uniqueUsers.add(event.userId);
    }

    switch (event.type) {
      case 'page_view':
        this.stats.pageViews++;
        break;
      case 'api_call':
        this.stats.apiCalls++;
        break;
      case 'error':
        this.stats.errors++;
        break;
      case 'conversion':
        this.stats.conversions++;
        break;
    }
  }

  /**
   * Extraire les informations de la requête
   */
  extractRequestInfo(req) {
    const userAgent = req.get('User-Agent') || '';
    const ip = req.ip || req.connection.remoteAddress;
    
    return {
      ip: this.anonymizeIP(ip),
      userAgent: userAgent,
      referer: req.get('Referer') || null,
      acceptLanguage: req.get('Accept-Language') || null,
      country: req.get('CF-IPCountry') || req.get('X-Country') || null, // Cloudflare/proxy headers
      device: this.parseDevice(userAgent),
      browser: this.parseBrowser(userAgent),
      os: this.parseOS(userAgent)
    };
  }

  /**
   * Anonymiser l'IP (RGPD)
   */
  anonymizeIP(ip) {
    if (!ip) return null;
    
    if (ip.includes(':')) {
      // IPv6 - garder seulement les 4 premiers groupes
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::';
    } else {
      // IPv4 - masquer le dernier octet
      const parts = ip.split('.');
      return parts.slice(0, 3).join('.') + '.0';
    }
  }

  // =============================================================================
  // 🛡️ MIDDLEWARES DE TRACKING
  // =============================================================================

  /**
   * Middleware de tracking des requêtes
   */
  trackRequest(options = {}) {
    return (req, res, next) => {
      if (!this.isEnabled) return next();

      try {
        const {
          trackPageViews = true,
          trackApiCalls = true,
          trackErrors = true,
          trackTiming = true,
          customProperties = {}
        } = options;

        const startTime = Date.now();
        const requestInfo = this.extractRequestInfo(req);

        // Intercepter la réponse
        const originalSend = res.send;
        const originalJson = res.json;

        const trackResponse = (data, isJson = false) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = res.statusCode;

          // Déterminer le type d'événement
          let eventType = 'api_call';
          if (req.method === 'GET' && req.path.startsWith('/api/')) {
            eventType = trackApiCalls ? 'api_call' : null;
          } else if (req.method === 'GET') {
            eventType = trackPageViews ? 'page_view' : null;
          } else if (statusCode >= 400) {
            eventType = trackErrors ? 'error' : null;
          }

          if (eventType) {
            this.trackEvent({
              type: eventType,
              userId: req.user?.id || null,
              sessionId: req.sessionID || null,
              path: req.path,
              method: req.method,
              statusCode: statusCode,
              duration: trackTiming ? duration : null,
              query: Object.keys(req.query).length > 0 ? req.query : null,
              userRole: req.user?.role || null,
              isAuthenticated: !!req.user,
              ...requestInfo,
              ...customProperties
            });
          }
        };

        res.send = function(data) {
          trackResponse(data, false);
          return originalSend.call(this, data);
        };

        res.json = function(data) {
          trackResponse(data, true);
          return originalJson.call(this, data);
        };

        next();

      } catch (error) {
        logger.error('Erreur middleware tracking:', error.message);
        next();
      }
    };
  }

  /**
   * Middleware de tracking des conversions
   */
  trackConversion(conversionType, value = null) {
    return (req, res, next) => {
      if (!this.isEnabled) return next();

      try {
        this.trackEvent({
          type: 'conversion',
          conversionType: conversionType,
          value: value,
          userId: req.user?.id || null,
          sessionId: req.sessionID || null,
          path: req.path,
          ...this.extractRequestInfo(req)
        });

        next();

      } catch (error) {
        logger.error('Erreur tracking conversion:', error.message);
        next();
      }
    };
  }

  /**
   * Middleware de tracking des événements personnalisés
   */
  trackCustomEvent(eventName, properties = {}) {
    return (req, res, next) => {
      if (!this.isEnabled) return next();

      try {
        this.trackEvent({
          type: 'custom',
          eventName: eventName,
          userId: req.user?.id || null,
          sessionId: req.sessionID || null,
          path: req.path,
          ...properties,
          ...this.extractRequestInfo(req)
        });

        next();

      } catch (error) {
        logger.error('Erreur tracking événement personnalisé:', error.message);
        next();
      }
    };
  }

  /**
   * Middleware de tracking des erreurs
   */
  trackError() {
    return (err, req, res, next) => {
      if (!this.isEnabled) return next(err);

      try {
        this.trackEvent({
          type: 'error',
          errorMessage: err.message,
          errorStack: err.stack,
          errorCode: err.code || null,
          statusCode: err.statusCode || 500,
          userId: req.user?.id || null,
          sessionId: req.sessionID || null,
          path: req.path,
          method: req.method,
          ...this.extractRequestInfo(req)
        });

        next(err);

      } catch (error) {
        logger.error('Erreur tracking erreur:', error.message);
        next(err);
      }
    };
  }

  /**
   * Middleware de géolocalisation (si disponible)
   */
  trackGeolocation() {
    return async (req, res, next) => {
      if (!this.isEnabled) return next();

      try {
        const ip = req.ip || req.connection.remoteAddress;
        
        // Essayer d'obtenir la géolocalisation via headers proxy
        const geoInfo = {
          country: req.get('CF-IPCountry') || req.get('X-Country') || null,
          region: req.get('CF-Region') || req.get('X-Region') || null,
          city: req.get('CF-IPCity') || req.get('X-City') || null,
          timezone: req.get('CF-Timezone') || null
        };

        // Ajouter les infos géo à la requête
        req.geoInfo = geoInfo;

        // Tracker la géolocalisation si disponible
        if (geoInfo.country) {
          this.trackEvent({
            type: 'geolocation',
            userId: req.user?.id || null,
            sessionId: req.sessionID || null,
            ...geoInfo,
            ip: this.anonymizeIP(ip)
          });
        }

        next();

      } catch (error) {
        logger.error('Erreur tracking géolocalisation:', error.message);
        next();
      }
    };
  }

  // =============================================================================
  // 🔧 ANALYSE DES DONNÉES
  // =============================================================================

  /**
   * Parser le device depuis User-Agent
   */
  parseDevice(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      if (/iPad|Tablet/.test(userAgent)) return 'tablet';
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Parser le navigateur depuis User-Agent
   */
  parseBrowser(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'other';
  }

  /**
   * Parser l'OS depuis User-Agent
   */
  parseOS(userAgent) {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'other';
  }

  // =============================================================================
  // 📈 ANALYTICS ET RAPPORTS
  // =============================================================================

  /**
   * Obtenir les statistiques en temps réel
   */
  getRealTimeStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(event => 
      new Date(event.timestamp) > oneHourAgo
    );

    const uniqueUsersLastHour = new Set(
      recentEvents
        .filter(e => e.userId)
        .map(e => e.userId)
    ).size;

    const pageViewsLastHour = recentEvents.filter(e => e.type === 'page_view').length;
    const apiCallsLastHour = recentEvents.filter(e => e.type === 'api_call').length;

    return {
      totalEvents: this.stats.totalEvents,
      uniqueUsers: this.stats.uniqueUsers.size,
      pageViews: this.stats.pageViews,
      apiCalls: this.stats.apiCalls,
      errors: this.stats.errors,
      conversions: this.stats.conversions,
      lastHour: {
        events: recentEvents.length,
        uniqueUsers: uniqueUsersLastHour,
        pageViews: pageViewsLastHour,
        apiCalls: apiCallsLastHour
      }
    };
  }

  /**
   * Générer un rapport de trafic
   */
  getTrafficReport(hours = 24) {
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    const relevantEvents = this.events.filter(event => 
      new Date(event.timestamp) > startTime
    );

    // Grouper par heure
    const hourlyData = {};
    for (let i = 0; i < hours; i++) {
      const hour = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().slice(0, 13);
      hourlyData[hourKey] = { pageViews: 0, apiCalls: 0, uniqueUsers: new Set() };
    }

    relevantEvents.forEach(event => {
      const hourKey = event.timestamp.slice(0, 13);
      if (hourlyData[hourKey]) {
        if (event.type === 'page_view') hourlyData[hourKey].pageViews++;
        if (event.type === 'api_call') hourlyData[hourKey].apiCalls++;
        if (event.userId) hourlyData[hourKey].uniqueUsers.add(event.userId);
      }
    });

    // Convertir les Sets en nombres
    Object.keys(hourlyData).forEach(key => {
      hourlyData[key].uniqueUsers = hourlyData[key].uniqueUsers.size;
    });

    return {
      period: `${hours} heures`,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      hourlyData: hourlyData,
      summary: {
        totalPageViews: relevantEvents.filter(e => e.type === 'page_view').length,
        totalApiCalls: relevantEvents.filter(e => e.type === 'api_call').length,
        totalErrors: relevantEvents.filter(e => e.type === 'error').length,
        uniqueUsers: new Set(relevantEvents.filter(e => e.userId).map(e => e.userId)).size
      }
    };
  }

  /**
   * Obtenir le top des pages visitées
   */
  getTopPages(limit = 10) {
    const pageViews = this.events.filter(e => e.type === 'page_view');
    const pageStats = {};

    pageViews.forEach(event => {
      const path = event.path;
      if (!pageStats[path]) {
        pageStats[path] = { count: 0, uniqueUsers: new Set() };
      }
      pageStats[path].count++;
      if (event.userId) {
        pageStats[path].uniqueUsers.add(event.userId);
      }
    });

    return Object.entries(pageStats)
      .map(([path, stats]) => ({
        path,
        views: stats.count,
        uniqueUsers: stats.uniqueUsers.size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  /**
   * Obtenir les stats par device/browser/OS
   */
  getUserAgentStats() {
    const events = this.events.filter(e => e.device && e.browser && e.os);
    
    const stats = {
      devices: {},
      browsers: {},
      os: {}
    };

    events.forEach(event => {
      // Devices
      stats.devices[event.device] = (stats.devices[event.device] || 0) + 1;
      
      // Browsers
      stats.browsers[event.browser] = (stats.browsers[event.browser] || 0) + 1;
      
      // OS
      stats.os[event.os] = (stats.os[event.os] || 0) + 1;
    });

    return stats;
  }

  /**
   * Obtenir les conversions par type
   */
  getConversionStats() {
    const conversions = this.events.filter(e => e.type === 'conversion');
    const stats = {};

    conversions.forEach(event => {
      const type = event.conversionType;
      if (!stats[type]) {
        stats[type] = { count: 0, totalValue: 0, uniqueUsers: new Set() };
      }
      stats[type].count++;
      stats[type].totalValue += parseFloat(event.value || 0);
      if (event.userId) {
        stats[type].uniqueUsers.add(event.userId);
      }
    });

    // Convertir les Sets en nombres
    Object.keys(stats).forEach(key => {
      stats[key].uniqueUsers = stats[key].uniqueUsers.size;
    });

    return stats;
  }

  /**
   * Obtenir le rapport d'erreurs
   */
  getErrorReport() {
    const errors = this.events.filter(e => e.type === 'error');
    const errorStats = {};

    errors.forEach(event => {
      const key = `${event.statusCode || 500}_${event.path || 'unknown'}`;
      if (!errorStats[key]) {
        errorStats[key] = {
          path: event.path,
          statusCode: event.statusCode,
          count: 0,
          lastError: null,
          messages: new Set()
        };
      }
      errorStats[key].count++;
      errorStats[key].lastError = event.timestamp;
      if (event.errorMessage) {
        errorStats[key].messages.add(event.errorMessage);
      }
    });

    // Convertir les Sets en arrays
    Object.keys(errorStats).forEach(key => {
      errorStats[key].messages = Array.from(errorStats[key].messages);
    });

    return Object.values(errorStats).sort((a, b) => b.count - a.count);
  }

  // =============================================================================
  // 🔄 TRAITEMENT DES ÉVÉNEMENTS
  // =============================================================================

  /**
   * Démarrer le processeur d'événements
   */
  startEventProcessor() {
    setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);

    logger.info(`Processeur d'événements démarré (intervalle: ${this.flushInterval}ms)`);
  }

  /**
   * Envoyer les événements aux providers externes
   */
  async flushEvents() {
    if (this.events.length === 0) return;

    try {
      const eventsToFlush = [...this.events];
      
      // Envoyer vers les providers configurés
      const promises = [];
      
      if (this.providers.custom) {
        promises.push(this.sendToCustomWebhook(eventsToFlush));
      }

      if (this.providers.googleAnalytics) {
        promises.push(this.sendToGoogleAnalytics(eventsToFlush));
      }

      if (this.providers.mixpanel) {
        promises.push(this.sendToMixpanel(eventsToFlush));
      }

      await Promise.allSettled(promises);
      
      logger.debug(`${eventsToFlush.length} événements envoyés aux providers`);

    } catch (error) {
      logger.error('Erreur flush événements:', error.message);
    }
  }

  /**
   * Envoyer vers webhook personnalisé
   */
  async sendToCustomWebhook(events) {
    try {
      const response = await fetch(this.providers.custom, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WolofDict-Analytics/1.0'
        },
        body: JSON.stringify({
          events: events,
          timestamp: new Date().toISOString(),
          source: 'wolofdict-analytics'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug('Événements envoyés au webhook personnalisé');

    } catch (error) {
      logger.error('Erreur envoi webhook personnalisé:', error.message);
    }
  }

  /**
   * Envoyer vers Google Analytics (simulation)
   */
  async sendToGoogleAnalytics(events) {
    // TODO: Implémenter l'envoi vers GA4 Measurement Protocol
    logger.debug('Envoi vers Google Analytics (non implémenté)');
  }

  /**
   * Envoyer vers Mixpanel (simulation)
   */
  async sendToMixpanel(events) {
    // TODO: Implémenter l'envoi vers Mixpanel API
    logger.debug('Envoi vers Mixpanel (non implémenté)');
  }

  // =============================================================================
  // 🛠️ ADMINISTRATION
  // =============================================================================

  /**
   * Nettoyer les anciens événements
   */
  cleanOldEvents(maxAge = 24 * 60 * 60 * 1000) { // 24h par défaut
    const cutoff = new Date(Date.now() - maxAge);
    const initialCount = this.events.length;
    
    this.events = this.events.filter(event => 
      new Date(event.timestamp) > cutoff
    );

    const removedCount = initialCount - this.events.length;
    if (removedCount > 0) {
      logger.info(`${removedCount} anciens événements supprimés`);
    }

    return removedCount;
  }

  /**
   * Réinitialiser les statistiques
   */
  resetStats() {
    this.stats = {
      totalEvents: 0,
      uniqueUsers: new Set(),
      pageViews: 0,
      apiCalls: 0,
      errors: 0,
      conversions: 0
    };
    
    this.events = [];
    logger.info('Statistiques analytics réinitialisées');
  }

  /**
   * Obtenir le statut du service
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      eventsInMemory: this.events.length,
      maxEvents: this.maxEvents,
      flushInterval: this.flushInterval,
      providers: Object.keys(this.providers).filter(p => this.providers[p]),
      stats: {
        ...this.stats,
        uniqueUsers: this.stats.uniqueUsers.size
      }
    };
  }

  /**
   * Activer/désactiver le tracking
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    logger.info(`Analytics ${enabled ? 'activé' : 'désactivé'}`);
  }
}

// Instance singleton
const analyticsMiddleware = new AnalyticsMiddleware();

module.exports = {
  // Middlewares principaux
  trackRequest: (options) => analyticsMiddleware.trackRequest(options),
  trackConversion: (type, value) => analyticsMiddleware.trackConversion(type, value),
  trackCustomEvent: (name, props) => analyticsMiddleware.trackCustomEvent(name, props),
  trackError: () => analyticsMiddleware.trackError(),
  trackGeolocation: () => analyticsMiddleware.trackGeolocation(),

  // Méthodes utilitaires
  trackEvent: (data) => analyticsMiddleware.trackEvent(data),
  getRealTimeStats: () => analyticsMiddleware.getRealTimeStats(),
  getTrafficReport: (hours) => analyticsMiddleware.getTrafficReport(hours),
  getTopPages: (limit) => analyticsMiddleware.getTopPages(limit),
  getUserAgentStats: () => analyticsMiddleware.getUserAgentStats(),
  getConversionStats: () => analyticsMiddleware.getConversionStats(),
  getErrorReport: () => analyticsMiddleware.getErrorReport(),

  // Administration
  cleanOldEvents: (maxAge) => analyticsMiddleware.cleanOldEvents(maxAge),
  resetStats: () => analyticsMiddleware.resetStats(),
  getStatus: () => analyticsMiddleware.getStatus(),
  setEnabled: (enabled) => analyticsMiddleware.setEnabled(enabled),

  // Instance pour usage avancé
  instance: analyticsMiddleware
};

// =============================================================================
// 📄 MIDDLEWARE INDEX.JS COMPLET - EXPORT CENTRALISÉ
// =============================================================================

const authMiddleware = require('./auth');
const rateLimitingMiddleware = require('./rateLimiting');
const validationMiddleware = require('./validation');
const securityMiddleware = require('./security');
const loggingMiddleware = require('./logging');
const corsMiddleware = require('./cors');
const errorHandler = require('./errorHandler');
const subscriptionMiddleware = require('./subscription');
const jwtMiddleware = require('./jwt');
const cacheMiddleware = require('./cache');
const analyticsMiddleware = require('./analytics');
const webhookMiddleware = require('./webhook');

module.exports = {
  // =============================================================================
  // 🔐 AUTH MIDDLEWARES (GÉNÉRAUX)
  // =============================================================================
  requireAuth: authMiddleware.requireAuth,
  requireRole: authMiddleware.requireRole,
  requireVerifiedEmail: authMiddleware.requireVerifiedEmail,
  optionalAuth: authMiddleware.optionalAuth,
  
  // =============================================================================
  // 🎫 JWT MIDDLEWARES (SPÉCIALISÉS) ✨
  // =============================================================================
  authenticateJWT: jwtMiddleware.authenticateJWT,
  authenticateJWTMinimal: jwtMiddleware.authenticateJWTMinimal,
  optionalJWT: jwtMiddleware.optionalJWT,
  requireJWTRole: jwtMiddleware.requireJWTRole,
  includeJWTInfo: jwtMiddleware.includeJWTInfo,
  handleJWTRefresh: jwtMiddleware.handleJWTRefresh,
  
  // JWT utilities ✨
  verifyJWT: jwtMiddleware.verifyAccessToken,
  generateJWTTokens: jwtMiddleware.generateTokenPair,
  extractJWTInfo: jwtMiddleware.extractJWTInfo,
  debugJWT: jwtMiddleware.debugJWT,
  
  // =============================================================================
  // 🚦 RATE LIMITING
  // =============================================================================
  loginLimiter: rateLimitingMiddleware.loginLimiter,
  registerLimiter: rateLimitingMiddleware.registerLimiter,
  passwordResetLimiter: rateLimitingMiddleware.passwordResetLimiter,
  apiLimiter: rateLimitingMiddleware.apiLimiter,
  strictLimiter: rateLimitingMiddleware.strictLimiter,
  
  // =============================================================================
  // ✅ VALIDATION
  // =============================================================================
  validateLogin: validationMiddleware.validateLogin,
  validateRegister: validationMiddleware.validateRegister,
  validatePasswordReset: validationMiddleware.validatePasswordReset,
  validateNewPassword: validationMiddleware.validateNewPassword,
  validateChangePassword: validationMiddleware.validateChangePassword,
  validateId: validationMiddleware.validateId, // ✨ VALIDATION ID
  
  // =============================================================================
  // 🛡️ SECURITY
  // =============================================================================
  helmet: securityMiddleware.helmet,
  sanitizeInput: securityMiddleware.sanitizeInput,
  preventXSS: securityMiddleware.preventXSS,
  
  // =============================================================================
  // 📝 LOGGING
  // =============================================================================
  requestLogger: loggingMiddleware.requestLogger,
  errorLogger: loggingMiddleware.errorLogger,
  
  // =============================================================================
  // 🌐 CORS
  // =============================================================================
  corsConfig: corsMiddleware.corsConfig,
  
  // =============================================================================
  // ❌ ERROR HANDLING
  // =============================================================================
  notFound: errorHandler.notFound,
  globalErrorHandler: errorHandler.globalErrorHandler,
  
  // =============================================================================
  // 💳 SUBSCRIPTION
  // =============================================================================
  requireSubscription: subscriptionMiddleware.requireSubscription,
  checkFeatureAccess: subscriptionMiddleware.checkFeatureAccess,
  checkUsageLimit: subscriptionMiddleware.checkUsageLimit,
  
  // =============================================================================
  // 💾 CACHE ✨ NOUVEAU
  // =============================================================================
  cacheResponse: cacheMiddleware.cacheResponse,
  cacheGetOrSet: cacheMiddleware.cacheGetOrSet,
  invalidateCache: cacheMiddleware.invalidateCache,
  cacheByUser: cacheMiddleware.cacheByUser,
  cacheByRole: cacheMiddleware.cacheByRole,
  
  // =============================================================================
  // 📊 ANALYTICS ✨ NOUVEAU
  // =============================================================================
  trackRequest: analyticsMiddleware.trackRequest,
  trackConversion: analyticsMiddleware.trackConversion,
  trackCustomEvent: analyticsMiddleware.trackCustomEvent,
  trackError: analyticsMiddleware.trackError,
  trackGeolocation: analyticsMiddleware.trackGeolocation,
  
  // Analytics utilities ✨
  trackEvent: analyticsMiddleware.trackEvent,
  getRealTimeStats: analyticsMiddleware.getRealTimeStats,
  getTrafficReport: analyticsMiddleware.getTrafficReport,
  getTopPages: analyticsMiddleware.getTopPages,
  getUserAgentStats: analyticsMiddleware.getUserAgentStats,
  getConversionStats: analyticsMiddleware.getConversionStats,
  getErrorReport: analyticsMiddleware.getErrorReport,
  
  // =============================================================================
  // 🪝 WEBHOOKS ✨ NOUVEAU
  // =============================================================================
  verifyWebhook: webhookMiddleware.verifyWebhook,
  verifyStripeWebhook: webhookMiddleware.verifyStripeWebhook,
  verifyPayPalWebhook: webhookMiddleware.verifyPayPalWebhook,
  verifyGitHubWebhook: webhookMiddleware.verifyGitHubWebhook,
  parseWebhookPayload: webhookMiddleware.parseWebhookPayload,
  
  // =============================================================================
  // 🔧 ADMINISTRATION & DEBUGGING ✨
  // =============================================================================
  
  // Analytics admin
  cleanOldAnalytics: analyticsMiddleware.cleanOldEvents,
  resetAnalyticsStats: analyticsMiddleware.resetStats,
  getAnalyticsStatus: analyticsMiddleware.getStatus,
  setAnalyticsEnabled: analyticsMiddleware.setEnabled,
  
  // Cache admin
  clearCache: cacheMiddleware.clearCache || (() => console.log('clearCache non disponible')),
  getCacheStats: cacheMiddleware.getCacheStats || (() => ({stats: 'non disponible'})),
  
  // Webhook admin
  getWebhookLogs: webhookMiddleware.getWebhookLogs || (() => []),
  clearWebhookLogs: webhookMiddleware.clearWebhookLogs || (() => console.log('clearWebhookLogs non disponible')),
  
  // =============================================================================
  // 🎯 MIDDLEWARES COMPOSÉS INTELLIGENTS ✨
  // =============================================================================
  
  /**
   * 🔐 Middleware d'authentification complet avec analytics
   */
  smartAuth: (options = {}) => {
    const { 
      required = true, 
      role = null, 
      trackAuth = true,
      trackFailures = true 
    } = options;
    
    return [
      // Analytics pre-auth
      trackAuth ? analyticsMiddleware.trackCustomEvent('auth_attempt', { required, role }) : (req, res, next) => next(),
      
      // Authentication
      required ? 
        (role ? authMiddleware.requireRole(role) : authMiddleware.requireAuth) :
        authMiddleware.optionalAuth,
      
      // Analytics post-auth
      (req, res, next) => {
        if (trackAuth && req.user) {
          analyticsMiddleware.trackEvent({
            type: 'auth_success',
            userId: req.user.id,
            userRole: req.user.role,
            authMethod: req.user.authMethod || 'session',
            path: req.path
          });
        } else if (trackFailures && required && !req.user) {
          analyticsMiddleware.trackEvent({
            type: 'auth_failure',
            path: req.path,
            reason: 'no_user'
          });
        }
        next();
      }
    ];
  },
  
  /**
   * 📊 Middleware API complet avec rate limiting, cache, analytics
   */
  apiMiddleware: (options = {}) => {
    const {
      rateLimiting = true,
      caching = false,
      analytics = true,
      auth = false,
      role = null,
      cacheTTL = 300, // 5 minutes
      customLimiter = null
    } = options;
    
    const middlewares = [];
    
    // Rate limiting
    if (rateLimiting) {
      middlewares.push(customLimiter || rateLimitingMiddleware.apiLimiter);
    }
    
    // Authentication
    if (auth) {
      middlewares.push(...module.exports.smartAuth({ required: auth, role, trackAuth: analytics }));
    }
    
    // Cache (avant analytics pour éviter de tracker les hits de cache)
    if (caching) {
      middlewares.push(cacheMiddleware.cacheResponse({ ttl: cacheTTL }));
    }
    
    // Analytics
    if (analytics) {
      middlewares.push(analyticsMiddleware.trackRequest({
        trackApiCalls: true,
        trackTiming: true,
        customProperties: { api: true, cached: caching }
      }));
    }
    
    return middlewares;
  },
  
  /**
   * 💳 Middleware d'abonnement avec analytics et cache
   */
  subscriptionGate: (feature, options = {}) => {
    const {
      analytics = true,
      gracePeriod = false,
      cacheUserPlan = true
    } = options;
    
    return [
      // Cache du plan utilisateur si demandé
      cacheUserPlan ? cacheMiddleware.cacheByUser('user_plan', { ttl: 300 }) : (req, res, next) => next(),
      
      // Vérification d'abonnement
      subscriptionMiddleware.checkFeatureAccess(feature, { gracePeriod }),
      
      // Analytics post-vérification
      analytics ? ((req, res, next) => {
        const hasAccess = res.locals.featureAccess !== false;
        analyticsMiddleware.trackEvent({
          type: 'feature_access',
          feature: feature,
          hasAccess: hasAccess,
          userId: req.user?.id,
          userPlan: req.user?.subscription?.plan?.slug,
          path: req.path
        });
        next();
      }) : (req, res, next) => next()
    ];
  },
  
  /**
   * 🚀 Middleware de page avec tout inclus
   */
  pageMiddleware: (options = {}) => {
    const {
      auth = false,
      role = null,
      analytics = true,
      geolocation = false,
      caching = false,
      cacheTTL = 600, // 10 minutes pour pages
      rateLimiting = false
    } = options;
    
    const middlewares = [];
    
    // Rate limiting si demandé
    if (rateLimiting) {
      middlewares.push(rateLimitingMiddleware.apiLimiter);
    }
    
    // Géolocalisation
    if (geolocation) {
      middlewares.push(analyticsMiddleware.trackGeolocation());
    }
    
    // Authentication
    if (auth) {
      middlewares.push(...module.exports.smartAuth({ required: auth, role, trackAuth: analytics }));
    }
    
    // Cache
    if (caching) {
      middlewares.push(cacheMiddleware.cacheResponse({ ttl: cacheTTL, varyByUser: !!auth }));
    }
    
    // Analytics
    if (analytics) {
      middlewares.push(analyticsMiddleware.trackRequest({
        trackPageViews: true,
        trackTiming: true,
        customProperties: { page: true, cached: caching }
      }));
    }
    
    return middlewares;
  },
  
  /**
   * ⚡ Middleware ultra-rapide pour endpoints critiques
   */
  fastTrack: (options = {}) => {
    const {
      analytics = false, // Désactivé par défaut pour la vitesse
      basicAuth = false,
      noCache = true
    } = options;
    
    const middlewares = [];
    
    // Auth minimal si demandé
    if (basicAuth) {
      middlewares.push(jwtMiddleware.authenticateJWTMinimal);
    }
    
    // Headers no-cache si demandé
    if (noCache) {
      middlewares.push((req, res, next) => {
        res.set({
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        next();
      });
    }
    
    // Analytics minimal si activé
    if (analytics) {
      middlewares.push(analyticsMiddleware.trackRequest({
        trackPageViews: false,
        trackApiCalls: true,
        trackTiming: true,
        trackErrors: false
      }));
    }
    
    return middlewares;
  },
  
  // =============================================================================
  // 🔍 MIDDLEWARES DE DEBUGGING
  // =============================================================================
  
  /**
   * 🐛 Middleware de debug complet
   */
  debugMode: (req, res, next) => {
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }
    
    console.log('\n🔍 DEBUG REQUEST:', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      user: req.user ? {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email
      } : null,
      headers: {
        'user-agent': req.get('User-Agent'),
        'authorization': req.get('Authorization') ? '***' : null,
        'content-type': req.get('Content-Type')
      },
      timestamp: new Date().toISOString()
    });
    
    next();
  },
  
  /**
   * ⏱️ Middleware de mesure de performance
   */
  performanceTracker: (req, res, next) => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      if (duration > 1000) { // Log des requêtes lentes (>1s)
        logger.warn('Requête lente détectée:', {
          method: req.method,
          path: req.path,
          duration: `${duration.toFixed(2)}ms`,
          statusCode: res.statusCode,
          user: req.user?.id
        });
      }
      
      // Ajouter aux analytics si disponible
      if (analyticsMiddleware.trackEvent) {
        analyticsMiddleware.trackEvent({
          type: 'performance',
          path: req.path,
          method: req.method,
          duration: duration,
          statusCode: res.statusCode,
          userId: req.user?.id,
          slow: duration > 1000
        });
      }
    });
    
    next();
  },
  
  /**
   * 📊 Middleware de health check
   */
  healthCheck: (req, res, next) => {
    if (req.path === '/health' || req.path === '/api/health') {
      const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        analytics: analyticsMiddleware.getStatus ? analyticsMiddleware.getStatus() : null
      };
      
      return res.json(status);
    }
    
    next();
  },
  
  // =============================================================================
  // 🎛️ MIDDLEWARES SPÉCIALISÉS MÉTIER
  // =============================================================================
  
  /**
   * 🗣️ Middleware pour les routes de dictionnaire
   */
  dictionaryMiddleware: (options = {}) => {
    const {
      requireAuth = false,
      trackUsage = true,
      checkLimits = true,
      cacheResults = true
    } = options;
    
    return [
      // Auth optionnelle pour tracking utilisateur
      requireAuth ? authMiddleware.requireAuth : authMiddleware.optionalAuth,
      
      // Vérification des limites d'usage si utilisateur connecté
      checkLimits ? subscriptionMiddleware.checkUsageLimit('daily_searches') : (req, res, next) => next(),
      
      // Cache des résultats
      cacheResults ? cacheMiddleware.cacheResponse({ ttl: 1800, varyByUser: true }) : (req, res, next) => next(),
      
      // Analytics spécialisé dictionnaire
      trackUsage ? analyticsMiddleware.trackCustomEvent('dictionary_search', {
        query: req.query.q,
        language: req.query.lang,
        type: req.query.type
      }) : (req, res, next) => next()
    ];
  },
  
  /**
   * 🎵 Middleware pour les routes audio
   */
  audioMiddleware: (options = {}) => {
    const {
      requireAuth = false,
      trackPlayback = true,
      checkQuality = true
    } = options;
    
    return [
      // Auth pour tracking utilisateur
      requireAuth ? authMiddleware.requireAuth : authMiddleware.optionalAuth,
      
      // Vérification accès audio HD selon plan
      checkQuality ? subscriptionMiddleware.checkFeatureAccess('audio_hd') : (req, res, next) => next(),
      
      // Analytics audio
      trackPlayback ? analyticsMiddleware.trackCustomEvent('audio_play', {
        audioId: req.params.id,
        quality: res.locals.audioQuality || 'standard'
      }) : (req, res, next) => next()
    ];
  },
  
  /**
   * 💰 Middleware pour les routes de paiement
   */
  paymentMiddleware: (options = {}) => {
    const {
      requireAuth = true,
      trackConversions = true,
      rateLimiting = true
    } = options;
    
    return [
      // Rate limiting strict pour paiements
      rateLimiting ? rateLimitingMiddleware.strictLimiter : (req, res, next) => next(),
      
      // Auth obligatoire
      requireAuth ? authMiddleware.requireAuth : (req, res, next) => next(),
      
      // Analytics conversions
      trackConversions ? analyticsMiddleware.trackConversion('payment_attempt', req.body?.amount) : (req, res, next) => next()
    ];
  },
  
  // =============================================================================
  // 📱 MIDDLEWARES SELON DEVICE/PLATEFORME
  // =============================================================================
  
  /**
   * 📱 Middleware pour API mobile
   */
  mobileApiMiddleware: (options = {}) => {
    const {
      requireAuth = true,
      trackMobileEvents = true,
      optimizeResponse = true
    } = options;
    
    return [
      // Détection mobile
      (req, res, next) => {
        const userAgent = req.get('User-Agent') || '';
        req.isMobile = /Mobile|Android|iPhone/.test(userAgent);
        req.isTablet = /iPad|Tablet/.test(userAgent);
        req.deviceType = req.isMobile ? 'mobile' : req.isTablet ? 'tablet' : 'desktop';
        next();
      },
      
      // Auth avec info device
      requireAuth ? authMiddleware.requireAuth : authMiddleware.optionalAuth,
      
      // Optimisation réponse mobile
      optimizeResponse ? ((req, res, next) => {
        if (req.isMobile) {
          res.set('X-Mobile-Optimized', 'true');
        }
        next();
      }) : (req, res, next) => next(),
      
      // Analytics mobile
      trackMobileEvents ? analyticsMiddleware.trackCustomEvent('mobile_api_call', {
        deviceType: req.deviceType,
        isMobile: req.isMobile
      }) : (req, res, next) => next()
    ];
  }
};

// =============================================================================
// 📋 EXPORT ADDITIONNEL POUR COMPATIBILITÉ
// =============================================================================

// Export des instances pour usage avancé
module.exports.instances = {
  analytics: analyticsMiddleware.instance,
  // cache: cacheMiddleware.instance, // Si disponible
  // webhook: webhookMiddleware.instance // Si disponible
};

// Export des classes/fonctions utilitaires
module.exports.utils = {
  createRateLimiter: rateLimitingMiddleware.createCustomLimiter || null,
  createValidator: validationMiddleware.createCustomValidator || null,
  parseUserAgent: analyticsMiddleware.instance ? {
    parseDevice: analyticsMiddleware.instance.parseDevice.bind(analyticsMiddleware.instance),
    parseBrowser: analyticsMiddleware.instance.parseBrowser.bind(analyticsMiddleware.instance),
    parseOS: analyticsMiddleware.instance.parseOS.bind(analyticsMiddleware.instance)
  } : null
};