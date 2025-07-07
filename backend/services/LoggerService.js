// =============================================================================
// 🌍 WOLOFDICT - LOGGER SERVICE OPTIMISÉ POUR L'ÉCOSYSTÈME
// Service de logging centralisé avec intégration complète
// =============================================================================

const fs = require('fs');
const path = require('path');
const util = require('util');

class LoggerService {
  constructor() {
    this.isInitialized = false;
    this.winston = null;
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.maxMemoryLogs = parseInt(process.env.MAX_MEMORY_LOGS) || 100;
    this.memoryLogs = [];
    
    // Niveaux de log avec priorités
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    // Contexte global pour enrichir les logs
    this.globalContext = {
      service: 'WolofDict',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      instance: process.env.INSTANCE_ID || 'main'
    };

    // Métriques de logging
    this.metrics = {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      lastError: null,
      performance: {
        slowRequests: 0,
        dbSlowQueries: 0
      }
    };
  }

  async initialize() {
    try {
      // Essayer d'initialiser Winston si disponible
      await this.initializeWinston();
      
      this.isInitialized = true;
      this.info('LoggerService initialisé', { 
        winston: !!this.winston,
        level: this.logLevel,
        maxMemoryLogs: this.maxMemoryLogs,
        ...this.globalContext
      });
      
    } catch (error) {
      console.error('Erreur initialisation LoggerService:', error);
      throw error;
    }
  }

  async initializeWinston() {
    try {
      const winston = require('winston');
      require('winston-daily-rotate-file');
      
      // Créer le dossier logs si nécessaire
      const logDir = path.join(__dirname, '../../../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Configuration des transports avec rotation
      const transports = [
        // Console avec couleurs en développement
        new winston.transports.Console({
          level: this.logLevel,
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, service, operation, ...meta }) => {
              // Format enrichi pour la console
              let formattedMessage = `${timestamp} [${level}]`;
              
              if (service) formattedMessage += ` [${service}]`;
              if (operation) formattedMessage += ` [${operation}]`;
              
              formattedMessage += `: ${message}`;
              
              const metaStr = Object.keys(meta).length ? 
                '\n' + util.inspect(meta, { colors: true, depth: 2 }) : '';
              
              return `${formattedMessage}${metaStr}`;
            })
          )
        }),
        
        // Fichier pour toutes les erreurs avec contexte enrichi
        new winston.transports.DailyRotateFile({
          filename: path.join(logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '10m',
          maxFiles: '7d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        }),
        
        // Fichier pour tous les logs avec contexte
        new winston.transports.DailyRotateFile({
          filename: path.join(logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        }),

        // Fichier séparé pour les performances
        new winston.transports.DailyRotateFile({
          filename: path.join(logDir, 'performance-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'info',
          maxSize: '5m',
          maxFiles: '7d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
            winston.format((info) => {
              // Filtrer seulement les logs de performance
              return info.type === 'performance' ? info : false;
            })()
          )
        })
      ];

      // En production, ajouter des transports spécialisés
      if (process.env.NODE_ENV === 'production') {
        transports.push(
          // Logs d'application
          new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxSize: '50m',
            maxFiles: '30d',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json()
            )
          }),

          // Logs d'audit pour la sécurité
          new winston.transports.DailyRotateFile({
            filename: path.join(logDir, 'audit-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '90d', // Garder plus longtemps pour audit
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
              winston.format((info) => {
                // Filtrer seulement les logs d'audit
                return info.type === 'audit' ? info : false;
              })()
            )
          })
        );
      }

      this.winston = winston.createLogger({
        level: this.logLevel,
        levels: winston.config.npm.levels,
        defaultMeta: this.globalContext, // Ajouter le contexte global automatiquement
        transports,
        // Gestion des exceptions non catchées
        exceptionHandlers: [
          new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log')
          })
        ],
        // Gestion des rejections non catchées
        rejectionHandlers: [
          new winston.transports.File({
            filename: path.join(logDir, 'rejections.log')
          })
        ]
      });

      console.log('✅ Winston initialisé avec rotation des logs et contexte enrichi');
      
    } catch (error) {
      console.log('⚠️ Winston non disponible, utilisation console avec fallback intelligent');
      this.winston = null;
    }
  }

  // =============================================================================
  // 📊 MÉTHODES DE LOG PRINCIPALES (AMÉLIORÉES)
  // =============================================================================

  info(message, meta = {}) {
    if (!this.shouldLog('info')) return;

    const enrichedMeta = this.enrichMeta(meta);
    this.addToMemory('info', message, enrichedMeta);
    this.updateMetrics('info');
    
    if (this.winston) {
      this.winston.info(message, enrichedMeta);
    } else {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} [INFO]: ${message}${this.formatMeta(enrichedMeta)}`);
    }
  }

  error(message, meta = {}) {
    if (!this.shouldLog('error')) return;

    // Gérer les objets Error de manière intelligente
    if (meta instanceof Error) {
      meta = {
        error: meta.message,
        stack: meta.stack,
        name: meta.name,
        code: meta.code
      };
    }

    const enrichedMeta = this.enrichMeta(meta);
    this.addToMemory('error', message, enrichedMeta);
    this.updateMetrics('error', { message, meta: enrichedMeta });
    
    if (this.winston) {
      this.winston.error(message, enrichedMeta);
    } else {
      const timestamp = new Date().toISOString();
      console.error(`${timestamp} [ERROR]: ${message}${this.formatMeta(enrichedMeta)}`);
    }
  }

  warn(message, meta = {}) {
    if (!this.shouldLog('warn')) return;

    const enrichedMeta = this.enrichMeta(meta);
    this.addToMemory('warn', message, enrichedMeta);
    this.updateMetrics('warn');
    
    if (this.winston) {
      this.winston.warn(message, enrichedMeta);
    } else {
      const timestamp = new Date().toISOString();
      console.warn(`${timestamp} [WARN]: ${message}${this.formatMeta(enrichedMeta)}`);
    }
  }

  debug(message, meta = {}) {
    if (!this.shouldLog('debug')) return;

    const enrichedMeta = this.enrichMeta(meta);
    this.addToMemory('debug', message, enrichedMeta);
    this.updateMetrics('debug');
    
    if (this.winston) {
      this.winston.debug(message, enrichedMeta);
    } else {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} [DEBUG]: ${message}${this.formatMeta(enrichedMeta)}`);
    }
  }

  // =============================================================================
  // 🎯 MÉTHODES SPÉCIALISÉES POUR L'ÉCOSYSTÈME WOLOFDICT
  // =============================================================================

  /**
   * 🌐 Log des requêtes HTTP (utilisé par le middleware)
   */
  logRequest(req, res, responseTime, additionalMeta = {}) {
    const meta = {
      type: 'http_request',
      method: req.method,
      url: req.url,
      path: req.path,
      status: res.statusCode,
      responseTime: responseTime,
      userAgent: req.get('User-Agent'),
      ip: this.anonymizeIP(req.ip || req.connection.remoteAddress),
      userId: req.user?.id || null,
      userRole: req.user?.role || null,
      sessionId: req.sessionID || null,
      queryParams: Object.keys(req.query).length > 0 ? req.query : null,
      ...additionalMeta
    };

    if (res.statusCode >= 500) {
      this.error('HTTP Server Error', meta);
    } else if (res.statusCode >= 400) {
      this.warn('HTTP Client Error', meta);
    } else if (responseTime > 1000) {
      this.warn('Slow HTTP Request', { ...meta, slow: true });
      this.metrics.performance.slowRequests++;
    } else {
      this.info('HTTP Request', meta);
    }
  }

  /**
   * 🗄️ Log des opérations base de données (utilisé par les services)
   */
  logDatabase(operation, table, duration, error = null, additionalMeta = {}) {
    const meta = {
      type: 'database',
      operation,
      table,
      duration: duration,
      ...additionalMeta
    };

    if (error) {
      meta.error = error.message;
      meta.errorCode = error.code;
      meta.errorStack = error.stack;
      this.error('Database Error', meta);
    } else if (duration > 500) {
      this.warn('Slow Database Query', { ...meta, slow: true });
      this.metrics.performance.dbSlowQueries++;
    } else {
      this.debug('Database Operation', meta);
    }
  }

  /**
   * ⚙️ Log des opérations de service (utilisé par tous les services)
   */
  logService(serviceName, operation, status = 'success', data = {}) {
    const meta = {
      type: 'service_operation',
      service: serviceName,
      operation,
      status,
      ...data
    };

    if (status === 'error') {
      this.error(`${serviceName} Error`, meta);
    } else if (status === 'warning') {
      this.warn(`${serviceName} Warning`, meta);
    } else {
      this.info(`${serviceName} Operation`, meta);
    }
  }

  /**
   * 🔐 Log d'authentification (utilisé par auth middleware)
   */
  logAuth(event, userId = null, additionalMeta = {}) {
    const meta = {
      type: 'auth',
      event,
      userId,
      timestamp: new Date().toISOString(),
      ...additionalMeta
    };

    switch (event) {
      case 'login_success':
      case 'register_success':
        this.info(`Authentication: ${event}`, meta);
        break;
      case 'login_failed':
      case 'auth_failed':
      case 'token_invalid':
        this.warn(`Authentication: ${event}`, meta);
        break;
      case 'security_breach':
      case 'suspicious_activity':
        this.error(`Security: ${event}`, meta);
        break;
      default:
        this.debug(`Authentication: ${event}`, meta);
    }
  }

  /**
   * 💳 Log des transactions/abonnements (utilisé par SubscriptionService)
   */
  logTransaction(event, userId, planId = null, amount = null, additionalMeta = {}) {
    const meta = {
      type: 'transaction',
      event,
      userId,
      planId,
      amount,
      currency: additionalMeta.currency || 'EUR',
      timestamp: new Date().toISOString(),
      ...additionalMeta
    };

    if (event.includes('error') || event.includes('failed')) {
      this.error(`Transaction: ${event}`, meta);
    } else if (event.includes('warning') || event.includes('pending')) {
      this.warn(`Transaction: ${event}`, meta);
    } else {
      this.info(`Transaction: ${event}`, meta);
    }
  }

  /**
   * 📊 Log de performance (utilisé par analytics middleware)
   */
  logPerformance(metric, value, context = {}) {
    const meta = {
      type: 'performance',
      metric,
      value,
      unit: context.unit || 'ms',
      threshold: context.threshold || null,
      ...context
    };

    if (context.threshold && value > context.threshold) {
      this.warn(`Performance Alert: ${metric}`, meta);
    } else {
      this.debug(`Performance: ${metric}`, meta);
    }
  }

  /**
   * 🔒 Log d'audit pour la sécurité (utilisé par security middleware)
   */
  logAudit(action, userId = null, target = null, result = 'success', additionalMeta = {}) {
    const meta = {
      type: 'audit',
      action,
      userId,
      target,
      result,
      timestamp: new Date().toISOString(),
      ip: additionalMeta.ip ? this.anonymizeIP(additionalMeta.ip) : null,
      ...additionalMeta
    };

    if (result === 'denied' || result === 'failed') {
      this.warn(`Audit: ${action}`, meta);
    } else if (result === 'suspicious') {
      this.error(`Security Audit: ${action}`, meta);
    } else {
      this.info(`Audit: ${action}`, meta);
    }
  }

  /**
   * 📱 Log spécialisé pour les événements métier WolofDict
   */
  logBusinessEvent(event, data = {}) {
    const meta = {
      type: 'business',
      event,
      ...data,
      timestamp: new Date().toISOString()
    };

    // Exemples d'événements métier
    switch (event) {
      case 'word_search':
      case 'audio_play':
      case 'translation_request':
        this.info(`Business: ${event}`, meta);
        break;
      case 'user_contribution':
      case 'content_moderation':
        this.info(`Content: ${event}`, meta);
        break;
      case 'subscription_change':
      case 'feature_access':
        this.info(`Subscription: ${event}`, meta);
        break;
      default:
        this.debug(`Business: ${event}`, meta);
    }
  }

  // =============================================================================
  // 🛠️ MÉTHODES UTILITAIRES AMÉLIORÉES
  // =============================================================================

  /**
   * Enrichir les métadonnées avec le contexte global
   */
  enrichMeta(meta) {
    return {
      ...meta,
      timestamp: meta.timestamp || new Date().toISOString(),
      pid: process.pid,
      memory: process.memoryUsage().heapUsed
    };
  }

  /**
   * Anonymiser les adresses IP (RGPD)
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

  /**
   * Mettre à jour les métriques internes
   */
  updateMetrics(level, data = null) {
    this.metrics.totalLogs++;

    switch (level) {
      case 'error':
        this.metrics.errorCount++;
        if (data) {
          this.metrics.lastError = {
            message: data.message,
            timestamp: new Date().toISOString(),
            meta: data.meta
          };
        }
        break;
      case 'warn':
        this.metrics.warnCount++;
        break;
    }
  }

  // Vérifier si un niveau de log doit être affiché
  shouldLog(level) {
    return this.levels[level] <= this.levels[this.logLevel];
  }

  // Formater les métadonnées pour l'affichage console
  formatMeta(meta) {
    if (!meta || Object.keys(meta).length === 0) return '';
    
    // Exclure certains champs techniques pour la console
    const cleanMeta = { ...meta };
    delete cleanMeta.timestamp;
    delete cleanMeta.pid;
    delete cleanMeta.memory;
    delete cleanMeta.service;
    delete cleanMeta.version;
    delete cleanMeta.environment;
    delete cleanMeta.instance;

    if (Object.keys(cleanMeta).length === 0) return '';
    
    return ' ' + util.inspect(cleanMeta, { 
      colors: process.stdout.isTTY, 
      depth: 2, 
      compact: true 
    });
  }

  // Ajouter un log en mémoire (avec limite)
  addToMemory(level, message, meta = {}) {
    // Ne stocker en mémoire que si Winston n'est pas disponible ou pour debug
    if (!this.winston || this.logLevel === 'debug') {
      const logEntry = {
        level,
        message,
        meta,
        timestamp: new Date().toISOString(),
        service: meta.service || 'unknown'
      };

      this.memoryLogs.push(logEntry);

      // Limiter la taille du buffer mémoire
      if (this.memoryLogs.length > this.maxMemoryLogs) {
        this.memoryLogs.shift(); // Retirer le plus ancien
      }
    }
  }

  // =============================================================================
  // 📊 MÉTHODES DE MONITORING ET STATISTIQUES
  // =============================================================================

  /**
   * Obtenir les métriques globales
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      memoryLogsCount: this.memoryLogs.length
    };
  }

  /**
   * Obtenir les statistiques par type d'événement
   */
  getEventStats(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentLogs = this.memoryLogs.filter(log => 
      new Date(log.timestamp) > cutoff
    );

    const stats = {
      total: recentLogs.length,
      byLevel: {},
      byType: {},
      byService: {}
    };

    recentLogs.forEach(log => {
      // Par niveau
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Par type
      const type = log.meta.type || 'general';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // Par service
      const service = log.meta.service || 'unknown';
      stats.byService[service] = (stats.byService[service] || 0) + 1;
    });

    return stats;
  }

  /**
   * Détecter les problèmes dans les logs récents
   */
  detectIssues() {
    const issues = [];
    const recentLogs = this.memoryLogs.slice(-50); // 50 derniers logs

    // Trop d'erreurs récentes
    const recentErrors = recentLogs.filter(log => log.level === 'error');
    if (recentErrors.length > 10) {
      issues.push({
        type: 'high_error_rate',
        severity: 'critical',
        count: recentErrors.length,
        message: `${recentErrors.length} erreurs dans les 50 derniers logs`
      });
    }

    // Requêtes lentes récurrentes
    if (this.metrics.performance.slowRequests > 5) {
      issues.push({
        type: 'slow_requests',
        severity: 'warning',
        count: this.metrics.performance.slowRequests,
        message: `${this.metrics.performance.slowRequests} requêtes lentes détectées`
      });
    }

    // Requêtes DB lentes
    if (this.metrics.performance.dbSlowQueries > 3) {
      issues.push({
        type: 'slow_db_queries',
        severity: 'warning',
        count: this.metrics.performance.dbSlowQueries,
        message: `${this.metrics.performance.dbSlowQueries} requêtes DB lentes détectées`
      });
    }

    return issues;
  }

  // =============================================================================
  // 📄 MÉTHODES EXISTANTES (INCHANGÉES)
  // =============================================================================

  // Gestion des logs en mémoire
  getMemoryLogs(options = {}) {
    let logs = [...this.memoryLogs];

    if (options.level) {
      logs = logs.filter(log => log.level === options.level);
    }

    if (options.service) {
      logs = logs.filter(log => log.service === options.service);
    }

    if (options.type) {
      logs = logs.filter(log => log.meta.type === options.type);
    }

    if (options.limit) {
      logs = logs.slice(-options.limit);
    }

    return logs;
  }

  getLastErrors(limit = 10) {
    return this.memoryLogs
      .filter(log => log.level === 'error')
      .slice(-limit);
  }

  clearMemoryLogs() {
    this.memoryLogs = [];
    this.metrics.totalLogs = 0;
    this.metrics.errorCount = 0;
    this.metrics.warnCount = 0;
    this.info('Memory logs cleared');
  }

  // Méthode pour changer le niveau de log à chaud
  setLevel(level) {
    if (!this.levels.hasOwnProperty(level)) {
      throw new Error(`Niveau de log invalide: ${level}. Niveaux disponibles: ${Object.keys(this.levels).join(', ')}`);
    }

    this.logLevel = level;
    
    if (this.winston) {
      this.winston.level = level;
      this.winston.transports.forEach(transport => {
        if (transport.level) {
          transport.level = level;
        }
      });
    }

    this.info('Log level changed', { newLevel: level });
  }

  // Statistiques des logs
  getStats() {
    const stats = {
      total: this.memoryLogs.length,
      byLevel: {},
      byService: {},
      byType: {},
      hasWinston: !!this.winston,
      currentLevel: this.logLevel,
      maxMemoryLogs: this.maxMemoryLogs,
      metrics: this.metrics
    };

    this.memoryLogs.forEach(log => {
      // Compter par niveau
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Compter par service
      const service = log.service || 'unknown';
      stats.byService[service] = (stats.byService[service] || 0) + 1;

      // Compter par type
      const type = log.meta.type || 'general';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    });

    return stats;
  }

  // Nettoyage propre
  async cleanup() {
    if (this.winston) {
      await new Promise((resolve) => {
        this.winston.close(() => {
          resolve();
        });
      });
    }
    
    this.clearMemoryLogs();
    this.isInitialized = false;
    console.log('LoggerService nettoyé');
  }

  // Status du service
  getStatus() {
    return {
      initialized: this.isInitialized,
      hasWinston: !!this.winston,
      level: this.logLevel,
      memoryLogsCount: this.memoryLogs.length,
      maxMemoryLogs: this.maxMemoryLogs,
      globalContext: this.globalContext,
      metrics: this.metrics,
      issues: this.detectIssues(),
      stats: this.getStats()
    };
  }
}

module.exports = new LoggerService();

// =============================================================================
// 📋 EXEMPLES D'UTILISATION OPTIMISÉE DANS L'ÉCOSYSTÈME
// =============================================================================

/*
DANS LES SERVICES (AudioService, ImageService, etc.) :

const logger = require('./LoggerService');

// Au lieu de :
logger.info('AudioService initialisé');

// Utiliser :
logger.logService('AudioService', 'initialize', 'success', {
  supportedFormats: this.supportedFormats.length,
  hasFileUploadService: !!this.fileUploadService
});

// Pour les erreurs :
logger.logService('AudioService', 'uploadAudio', 'error', {
  fileName: file.originalname,
  error: error.message,
  userId: metadata.uploaded_by
});

DANS LES MIDDLEWARES :

// Middleware de requête :
logger.logRequest(req, res, responseTime, {
  cached: res.get('X-Cache-Status') === 'HIT',
  geoCountry: req.geoInfo?.country
});

// Middleware d'auth :
logger.logAuth('login_attempt', null, {
  ip: req.ip,
  userAgent: req.get('User-Agent')
});

DANS LES CONTRÔLEURS :

// Événements métier :
logger.logBusinessEvent('word_search', {
  query: req.query.q,
  userId: req.user?.id,
  language: req.query.lang,
  resultsCount: results.length
});

DANS SUBSCRIPTIONSERVICE :

// Transactions :
logger.logTransaction('subscription_created', userId, planId, plan.price, {
  paymentMethod: paymentData.payment_method,
  currency: plan.currency,
  trialDays: plan.trial_days
});
*/