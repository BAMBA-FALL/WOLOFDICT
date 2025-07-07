// =============================================================================
// 📄 middleware/security.js - MIDDLEWARES DE SÉCURITÉ AVANCÉS
// =============================================================================

const helmet = require('helmet');
const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const validator = require('validator');
const crypto = require('crypto');
const logger = require('../services/LoggerService');

class SecurityMiddleware {
  constructor() {
    // Liste des User-Agents suspects
    this.suspiciousUserAgents = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /ruby/i,
      /node/i, /axios/i, /postman/i
    ];

    // Patterns SQL injection
    this.sqlInjectionPatterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/ix,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/ix,
      /((\%27)|(\'))union/ix,
      /exec(\s|\+)+(s|x)p\w+/ix
    ];

    // Patterns XSS
    this.xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]+src[^>]*>/gi
    ];
  }

  /**
   * 🛡️ Configuration Helmet renforcée
   */
  static helmet(options = {}) {
    const env = process.env.NODE_ENV || 'development';
    const isDev = env === 'development';

    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "https://fonts.googleapis.com",
            "https://cdnjs.cloudflare.com"
          ],
          fontSrc: [
            "'self'", 
            "https://fonts.gstatic.com",
            "https://cdnjs.cloudflare.com"
          ],
          imgSrc: [
            "'self'", 
            "data:", 
            "https:",
            "blob:"
          ],
          scriptSrc: isDev ? 
            ["'self'", "'unsafe-inline'", "'unsafe-eval'"] : 
            ["'self'", "https://cdnjs.cloudflare.com"],
          connectSrc: [
            "'self'", 
            "https://api.wolofdict.com",
            "wss://api.wolofdict.com",
            ...(options.additionalConnectSrc || [])
          ],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", "https:"],
          workerSrc: ["'self'", "blob:"],
          childSrc: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: !isDev ? [] : null
        },
        reportOnly: isDev
      },
      hsts: {
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      frameguard: { action: 'deny' },
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      permittedCrossDomainPolicies: false,
      hidePoweredBy: true,
      ...options
    });
  }

  /**
   * 🧹 Sanitisation avancée des entrées
   */
  static sanitizeInput(options = {}) {
    return [
      mongoSanitize({
        replaceWith: '_',
        onSanitize: ({ req, key }) => {
          logger.logSecurity('nosql_injection_attempt', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            key: key,
            url: req.url,
            method: req.method
          });
        }
      }),
      (req, res, next) => {
        const middleware = new SecurityMiddleware();
        
        try {
          // Sanitiser récursivement tous les objets
          const sanitizeValue = (value, path = '') => {
            if (typeof value === 'string') {
              // Vérifier les patterns malveillants
              middleware.detectMaliciousPatterns(value, req, path);
              
              // Appliquer XSS protection
              const sanitized = xss(value, {
                whiteList: options.allowedTags || {},
                stripIgnoreTag: true,
                stripIgnoreTagBody: ['script'],
                css: false
              });
              
              // Validation supplémentaire selon le type
              return middleware.validateByContext(sanitized, path, options);
            } else if (Array.isArray(value)) {
              return value.map((item, index) => 
                sanitizeValue(item, `${path}[${index}]`)
              );
            } else if (typeof value === 'object' && value !== null) {
              const sanitized = {};
              for (const [key, val] of Object.entries(value)) {
                // Sanitiser aussi les clés
                const cleanKey = middleware.sanitizeKey(key);
                sanitized[cleanKey] = sanitizeValue(val, `${path}.${cleanKey}`);
              }
              return sanitized;
            }
            return value;
          };

          if (req.body) req.body = sanitizeValue(req.body, 'body');
          if (req.query) req.query = sanitizeValue(req.query, 'query');
          if (req.params) req.params = sanitizeValue(req.params, 'params');

          next();

        } catch (error) {
          logger.logSecurity('sanitization_error', {
            ip: req.ip,
            error: error.message,
            url: req.url
          });
          
          return res.status(400).json({
            success: false,
            error: 'Données d\'entrée invalides',
            code: 'INVALID_INPUT'
          });
        }
      }
    ];
  }

  /**
   * 🔍 Détection de patterns malveillants
   */
  detectMaliciousPatterns(value, req, path) {
    // Vérifier SQL injection
    for (const pattern of this.sqlInjectionPatterns) {
      if (pattern.test(value)) {
        logger.logSecurity('sql_injection_attempt', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          pattern: pattern.toString(),
          value: value.substring(0, 100), // Tronquer pour les logs
          path: path,
          url: req.url
        });
        throw new Error('SQL injection detected');
      }
    }

    // Vérifier XSS patterns
    for (const pattern of this.xssPatterns) {
      if (pattern.test(value)) {
        logger.logSecurity('xss_attempt', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          pattern: pattern.toString(),
          value: value.substring(0, 100),
          path: path,
          url: req.url
        });
        // Ne pas throw pour XSS, juste nettoyer
      }
    }

    // Vérifier les caractères de contrôle
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value)) {
      logger.logSecurity('control_chars_detected', {
        ip: req.ip,
        path: path,
        url: req.url
      });
      throw new Error('Control characters detected');
    }
  }

  /**
   * 🔑 Validation contextuelle
   */
  validateByContext(value, path, options) {
    // Validation email
    if (path.includes('email') && value) {
      if (!validator.isEmail(value)) {
        throw new Error(`Invalid email format: ${path}`);
      }
    }

    // Validation URL
    if (path.includes('url') && value) {
      if (!validator.isURL(value, { protocols: ['http', 'https'] })) {
        throw new Error(`Invalid URL format: ${path}`);
      }
    }

    // Validation numérique
    if (path.includes('id') && value) {
      if (!validator.isNumeric(value.toString())) {
        throw new Error(`Invalid ID format: ${path}`);
      }
    }

    // Limiter la longueur des chaînes
    if (typeof value === 'string') {
      const maxLength = options.maxLength || 10000;
      if (value.length > maxLength) {
        throw new Error(`String too long: ${path}`);
      }
    }

    return value;
  }

  /**
   * 🧹 Sanitiser les clés d'objet
   */
  sanitizeKey(key) {
    // Supprimer les caractères dangereux des clés
    return key.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  }

  /**
   * 🛡️ Protection XSS renforcée
   */
  static preventXSS(options = {}) {
    return (req, res, next) => {
      // Headers de sécurité
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // CSP inline si pas déjà défini par Helmet
      if (!res.getHeader('Content-Security-Policy')) {
        res.setHeader('Content-Security-Policy', 
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        );
      }

      // Protection contre les attaques de timing
      res.setHeader('X-DNS-Prefetch-Control', 'off');
      
      next();
    };
  }

  /**
   * 🕵️ Détection de bots et user agents suspects
   */
  static detectSuspiciousActivity() {
    return (req, res, next) => {
      const middleware = new SecurityMiddleware();
      const userAgent = req.get('User-Agent') || '';
      const ip = req.ip;

      // Vérifier User-Agent suspect
      const isSuspiciousUA = middleware.suspiciousUserAgents.some(pattern => 
        pattern.test(userAgent)
      );

      if (isSuspiciousUA) {
        logger.logSecurity('suspicious_user_agent', {
          ip: ip,
          userAgent: userAgent,
          url: req.url,
          method: req.method
        });

        // Optionnel: bloquer les bots
        if (process.env.BLOCK_BOTS === 'true') {
          return res.status(403).json({
            success: false,
            error: 'Access denied',
            code: 'BOT_DETECTED'
          });
        }
      }

      // Vérifier les headers manquants (signe de script automatisé)
      const expectedHeaders = ['accept', 'accept-language'];
      const missingHeaders = expectedHeaders.filter(header => !req.get(header));
      
      if (missingHeaders.length > 0) {
        logger.logSecurity('missing_browser_headers', {
          ip: ip,
          missingHeaders: missingHeaders,
          userAgent: userAgent,
          url: req.url
        });
      }

      // Ajouter fingerprint de sécurité
      req.securityFingerprint = {
        userAgent: userAgent,
        isSuspiciousUA: isSuspiciousUA,
        missingHeaders: missingHeaders,
        timestamp: Date.now()
      };

      next();
    };
  }

  /**
   * 🐌 Protection contre les attaques de déni de service
   */
  static antiDDoS(options = {}) {
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const maxRequests = options.max || 100;

    return [
      // Rate limiting standard
      rateLimit({
        windowMs: windowMs,
        max: maxRequests,
        message: {
          success: false,
          error: 'Trop de requêtes, réessayez plus tard',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        onLimitReached: (req) => {
          logger.logSecurity('rate_limit_exceeded', {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url
          });
        }
      }),

      // Ralentissement progressif
      slowDown({
        windowMs: windowMs,
        delayAfter: Math.floor(maxRequests * 0.5),
        delayMs: 500,
        maxDelayMs: 20000,
        onLimitReached: (req) => {
          logger.logSecurity('slow_down_triggered', {
            ip: req.ip,
            url: req.url
          });
        }
      })
    ];
  }

  /**
   * 🔐 Validation de l'intégrité des requêtes
   */
  static validateRequestIntegrity() {
    return (req, res, next) => {
      try {
        // Vérifier la taille de la requête
        const contentLength = parseInt(req.get('content-length') || '0');
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (contentLength > maxSize) {
          logger.logSecurity('oversized_request', {
            ip: req.ip,
            contentLength: contentLength,
            maxSize: maxSize,
            url: req.url
          });

          return res.status(413).json({
            success: false,
            error: 'Requête trop volumineuse',
            code: 'PAYLOAD_TOO_LARGE'
          });
        }

        // Vérifier les headers Host
        const host = req.get('host');
        const allowedHosts = (process.env.ALLOWED_HOSTS || '').split(',');
        
        if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
          logger.logSecurity('invalid_host_header', {
            ip: req.ip,
            host: host,
            allowedHosts: allowedHosts,
            url: req.url
          });

          return res.status(400).json({
            success: false,
            error: 'Host invalide',
            code: 'INVALID_HOST'
          });
        }

        next();

      } catch (error) {
        logger.error('Erreur validation intégrité requête:', error.message);
        next();
      }
    };
  }

  /**
   * 🔒 Middleware de chiffrement des réponses sensibles
   */
  static encryptSensitiveData(sensitiveFields = []) {
    return (req, res, next) => {
      const originalJson = res.json;

      res.json = function(obj) {
        if (obj && typeof obj === 'object') {
          const encrypted = SecurityMiddleware.encryptFields(obj, sensitiveFields);
          return originalJson.call(this, encrypted);
        }
        return originalJson.call(this, obj);
      };

      next();
    };
  }

  /**
   * 🔐 Chiffrer des champs spécifiques
   */
  static encryptFields(obj, fieldsToEncrypt) {
    const result = { ...obj };
    const secret = process.env.ENCRYPTION_SECRET || 'default-secret';

    fieldsToEncrypt.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        const cipher = crypto.createCipher('aes192', secret);
        let encrypted = cipher.update(result[field], 'utf8', 'hex');
        encrypted += cipher.final('hex');
        result[field] = encrypted;
      }
    });

    return result;
  }

  /**
   * 🛡️ Protection CSRF pour les formulaires
   */
  static csrfProtection() {
    return (req, res, next) => {
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const token = req.get('X-CSRF-Token') || req.body._csrf || req.query._csrf;
        const sessionToken = req.session?.csrfToken;

        if (!token || !sessionToken || token !== sessionToken) {
          logger.logSecurity('csrf_token_mismatch', {
            ip: req.ip,
            method: req.method,
            url: req.url,
            hasToken: !!token,
            hasSessionToken: !!sessionToken
          });

          return res.status(403).json({
            success: false,
            error: 'Token CSRF invalide',
            code: 'CSRF_TOKEN_INVALID'
          });
        }
      }

      next();
    };
  }

  /**
   * 📊 Middleware de collecte de métriques de sécurité
   */
  static securityMetrics() {
    return (req, res, next) => {
      const startTime = Date.now();

      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        logger.logSecurity('request_metrics', {
          ip: req.ip,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime: responseTime,
          userAgent: req.get('User-Agent'),
          contentLength: req.get('content-length'),
          securityFingerprint: req.securityFingerprint
        });
      });

      next();
    };
  }
}

module.exports = SecurityMiddleware;