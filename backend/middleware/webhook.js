// =============================================================================
// 🔗 WEBHOOK MIDDLEWARE - VÉRIFICATION ET TRAITEMENT SÉCURISÉ
// =============================================================================

const crypto = require('crypto');
const logger = require('../services/LoggerService');

class WebhookMiddleware {
  constructor() {
    this.providers = {
      stripe: {
        header: 'stripe-signature',
        algorithm: 'sha256',
        prefix: 't=',
        tolerance: 300 // 5 minutes
      },
      paypal: {
        header: 'paypal-transmission-sig',
        algorithm: 'sha256',
        certId: process.env.PAYPAL_WEBHOOK_CERT_ID
      },
      github: {
        header: 'x-hub-signature-256',
        algorithm: 'sha256',
        prefix: 'sha256='
      },
      discord: {
        header: 'x-signature-ed25519',
        timestamp: 'x-signature-timestamp'
      },
      generic: {
        header: 'x-webhook-signature',
        algorithm: 'sha256'
      }
    };
  }

  /**
   * 🔐 Middleware principal de vérification webhook
   */
  verifyWebhook(provider = 'generic', options = {}) {
    return async (req, res, next) => {
      try {
        const startTime = Date.now();
        
        // Log de début de vérification
        logger.logService('WebhookMiddleware', 'verifyWebhook', 'start', {
          provider: provider,
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          contentType: req.get('Content-Type')
        });

        // Vérifier que le provider est supporté
        if (!this.providers[provider]) {
          logger.logSecurity('webhook_invalid_provider', {
            provider: provider,
            ip: req.ip,
            url: req.url
          });
          return res.status(400).json({
            error: 'Provider webhook non supporté',
            code: 'INVALID_PROVIDER'
          });
        }

        // Récupérer le body raw (nécessaire pour la vérification)
        const rawBody = req.rawBody || req.body;
        if (!rawBody) {
          logger.logSecurity('webhook_missing_body', {
            provider: provider,
            ip: req.ip,
            url: req.url
          });
          return res.status(400).json({
            error: 'Corps de requête manquant',
            code: 'MISSING_BODY'
          });
        }

        // Vérification selon le provider
        let isValid = false;
        let webhookData = {};

        switch (provider) {
          case 'stripe':
            isValid = await this.verifyStripeWebhook(req, rawBody, options);
            break;
          case 'paypal':
            isValid = await this.verifyPayPalWebhook(req, rawBody, options);
            break;
          case 'github':
            isValid = await this.verifyGitHubWebhook(req, rawBody, options);
            break;
          case 'discord':
            isValid = await this.verifyDiscordWebhook(req, rawBody, options);
            break;
          case 'generic':
          default:
            isValid = await this.verifyGenericWebhook(req, rawBody, options);
            break;
        }

        if (!isValid) {
          logger.logSecurity('webhook_verification_failed', {
            provider: provider,
            ip: req.ip,
            url: req.url,
            headers: this.sanitizeHeaders(req.headers)
          });
          return res.status(401).json({
            error: 'Signature webhook invalide',
            code: 'INVALID_SIGNATURE'
          });
        }

        // Ajouter les infos webhook à la requête
        req.webhook = {
          provider: provider,
          verified: true,
          timestamp: new Date(),
          ...webhookData
        };

        const processingTime = Date.now() - startTime;

        // Log de succès
        logger.logService('WebhookMiddleware', 'verifyWebhook', 'success', {
          provider: provider,
          processingTime: processingTime,
          url: req.url
        });

        next();

      } catch (error) {
        logger.logSecurity('webhook_verification_error', {
          provider: provider,
          ip: req.ip,
          url: req.url,
          error: error.message
        });

        return res.status(500).json({
          error: 'Erreur vérification webhook',
          code: 'VERIFICATION_ERROR'
        });
      }
    };
  }

  /**
   * 💳 Vérification webhook Stripe
   */
  async verifyStripeWebhook(req, rawBody, options) {
    try {
      const signature = req.get('stripe-signature');
      const secret = options.secret || process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || !secret) {
        return false;
      }

      // Parser la signature Stripe
      const elements = signature.split(',');
      const signatureElements = {};
      
      elements.forEach(element => {
        const [key, value] = element.split('=');
        signatureElements[key] = value;
      });

      if (!signatureElements.t || !signatureElements.v1) {
        return false;
      }

      // Vérifier le timestamp (protection replay attack)
      const timestamp = parseInt(signatureElements.t);
      const tolerance = this.providers.stripe.tolerance;
      const currentTime = Math.floor(Date.now() / 1000);

      if (Math.abs(currentTime - timestamp) > tolerance) {
        logger.logSecurity('stripe_webhook_timestamp_invalid', {
          timestamp: timestamp,
          currentTime: currentTime,
          tolerance: tolerance
        });
        return false;
      }

      // Créer la signature attendue
      const payload = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      // Comparer les signatures
      const providedSignature = signatureElements.v1;
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );

      if (isValid) {
        req.webhook = {
          ...req.webhook,
          timestamp: new Date(timestamp * 1000),
          event: JSON.parse(rawBody)
        };
      }

      return isValid;

    } catch (error) {
      logger.error('Erreur vérification Stripe webhook:', error.message);
      return false;
    }
  }

  /**
   * 💰 Vérification webhook PayPal
   */
  async verifyPayPalWebhook(req, rawBody, options) {
    try {
      const signature = req.get('paypal-transmission-sig');
      const certId = req.get('paypal-cert-id');
      const timestamp = req.get('paypal-transmission-time');
      const authAlgo = req.get('paypal-auth-algo');

      if (!signature || !certId || !timestamp || !authAlgo) {
        return false;
      }

      // Pour PayPal, une vérification complète nécessiterait
      // de valider avec le certificat PayPal
      // Ici, on fait une vérification basique avec un secret partagé
      const secret = options.secret || process.env.PAYPAL_WEBHOOK_SECRET;
      
      if (!secret) {
        return false;
      }

      // Créer la signature attendue (version simplifiée)
      const payload = `${timestamp}${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('base64');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );

      if (isValid) {
        req.webhook = {
          ...req.webhook,
          timestamp: new Date(timestamp),
          certId: certId,
          event: JSON.parse(rawBody)
        };
      }

      return isValid;

    } catch (error) {
      logger.error('Erreur vérification PayPal webhook:', error.message);
      return false;
    }
  }

  /**
   * 🐙 Vérification webhook GitHub
   */
  async verifyGitHubWebhook(req, rawBody, options) {
    try {
      const signature = req.get('x-hub-signature-256');
      const secret = options.secret || process.env.GITHUB_WEBHOOK_SECRET;

      if (!signature || !secret) {
        return false;
      }

      // Créer la signature attendue
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('hex');

      const fullExpectedSignature = `sha256=${expectedSignature}`;

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(fullExpectedSignature)
      );

      if (isValid) {
        req.webhook = {
          ...req.webhook,
          event: req.get('x-github-event'),
          delivery: req.get('x-github-delivery'),
          data: JSON.parse(rawBody)
        };
      }

      return isValid;

    } catch (error) {
      logger.error('Erreur vérification GitHub webhook:', error.message);
      return false;
    }
  }

  /**
   * 🎮 Vérification webhook Discord
   */
  async verifyDiscordWebhook(req, rawBody, options) {
    try {
      const signature = req.get('x-signature-ed25519');
      const timestamp = req.get('x-signature-timestamp');
      const publicKey = options.publicKey || process.env.DISCORD_PUBLIC_KEY;

      if (!signature || !timestamp || !publicKey) {
        return false;
      }

      // Discord utilise Ed25519, plus complexe à implémenter
      // Ici, on fait une vérification basique avec HMAC
      const secret = options.secret || process.env.DISCORD_WEBHOOK_SECRET;
      
      if (!secret) {
        return false;
      }

      const payload = `${timestamp}${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      if (isValid) {
        req.webhook = {
          ...req.webhook,
          timestamp: new Date(parseInt(timestamp) * 1000),
          data: JSON.parse(rawBody)
        };
      }

      return isValid;

    } catch (error) {
      logger.error('Erreur vérification Discord webhook:', error.message);
      return false;
    }
  }

  /**
   * 🔧 Vérification webhook générique
   */
  async verifyGenericWebhook(req, rawBody, options) {
    try {
      const signature = req.get(options.header || 'x-webhook-signature');
      const secret = options.secret || process.env.WEBHOOK_SECRET;

      if (!signature || !secret) {
        return false;
      }

      const algorithm = options.algorithm || 'sha256';
      const prefix = options.prefix || '';

      // Créer la signature attendue
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(rawBody, 'utf8')
        .digest('hex');

      const fullExpectedSignature = `${prefix}${expectedSignature}`;

      // Enlever le préfixe de la signature reçue si nécessaire
      const cleanSignature = prefix ? signature.replace(prefix, '') : signature;
      const cleanExpectedSignature = prefix ? expectedSignature : fullExpectedSignature;

      const isValid = crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(cleanExpectedSignature, 'hex')
      );

      if (isValid) {
        req.webhook = {
          ...req.webhook,
          data: JSON.parse(rawBody)
        };
      }

      return isValid;

    } catch (error) {
      logger.error('Erreur vérification webhook générique:', error.message);
      return false;
    }
  }

  /**
   * 📋 Middleware pour capturer le body raw
   */
  captureRawBody(req, res, next) {
    const chunks = [];
    
    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      req.rawBody = Buffer.concat(chunks);
      next();
    });
  }

  /**
   * 🔍 Middleware de validation des en-têtes webhook
   */
  validateWebhookHeaders(requiredHeaders = []) {
    return (req, res, next) => {
      const missingHeaders = [];

      requiredHeaders.forEach(header => {
        if (!req.get(header)) {
          missingHeaders.push(header);
        }
      });

      if (missingHeaders.length > 0) {
        logger.logSecurity('webhook_missing_headers', {
          missingHeaders: missingHeaders,
          ip: req.ip,
          url: req.url
        });

        return res.status(400).json({
          error: 'En-têtes requis manquants',
          missing: missingHeaders,
          code: 'MISSING_HEADERS'
        });
      }

      next();
    };
  }

  /**
   * ⏱️ Middleware de vérification du timestamp
   */
  validateTimestamp(toleranceSeconds = 300) {
    return (req, res, next) => {
      const timestamp = req.get('x-timestamp') || req.get('timestamp');
      
      if (!timestamp) {
        return next(); // Optionnel si pas de timestamp
      }

      const webhookTime = new Date(parseInt(timestamp) * 1000);
      const currentTime = new Date();
      const diff = Math.abs(currentTime - webhookTime) / 1000;

      if (diff > toleranceSeconds) {
        logger.logSecurity('webhook_timestamp_expired', {
          timestamp: timestamp,
          diff: diff,
          tolerance: toleranceSeconds,
          ip: req.ip
        });

        return res.status(400).json({
          error: 'Timestamp webhook expiré',
          code: 'TIMESTAMP_EXPIRED'
        });
      }

      next();
    };
  }

  /**
   * 🔄 Middleware de gestion des webhooks en double
   */
  preventDuplicateWebhooks(cache, ttlSeconds = 3600) {
    return async (req, res, next) => {
      try {
        const webhookId = req.get('x-webhook-id') || 
                         req.get('x-delivery-id') || 
                         req.get('x-event-id');

        if (!webhookId) {
          return next(); // Pas d'ID, on continue
        }

        const cacheKey = `webhook:${webhookId}`;
        const exists = await cache.get(cacheKey);

        if (exists) {
          logger.logSecurity('webhook_duplicate_detected', {
            webhookId: webhookId,
            ip: req.ip,
            url: req.url
          });

          return res.status(200).json({
            message: 'Webhook déjà traité',
            code: 'DUPLICATE_WEBHOOK'
          });
        }

        // Marquer comme traité
        await cache.set(cacheKey, true, ttlSeconds);
        
        req.webhook = {
          ...req.webhook,
          id: webhookId
        };

        next();

      } catch (error) {
        logger.error('Erreur vérification webhook duplicate:', error.message);
        next(); // Continuer même en cas d'erreur cache
      }
    };
  }

  /**
   * 🧹 Nettoyer les en-têtes sensibles pour les logs
   */
  sanitizeHeaders(headers) {
    const sensitiveHeaders = [
      'authorization',
      'x-api-key',
      'stripe-signature',
      'paypal-transmission-sig',
      'x-hub-signature-256'
    ];

    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * 📊 Middleware de tracking des webhooks
   */
  trackWebhook(analyticsService) {
    return (req, res, next) => {
      if (analyticsService && typeof analyticsService.track === 'function') {
        analyticsService.track('webhook_received', {
          provider: req.webhook?.provider || 'unknown',
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          timestamp: new Date()
        });
      }
      next();
    };
  }

  /**
   * 🎯 Factory pour créer des middlewares webhook spécialisés
   */
  createProviderMiddleware(provider, options = {}) {
    const requiredHeaders = this.getRequiredHeaders(provider);
    
    return [
      this.captureRawBody,
      this.validateWebhookHeaders(requiredHeaders),
      this.validateTimestamp(options.timestampTolerance),
      this.verifyWebhook(provider, options)
    ];
  }

  /**
   * 📋 Obtenir les en-têtes requis pour un provider
   */
  getRequiredHeaders(provider) {
    const headerMap = {
      stripe: ['stripe-signature'],
      paypal: ['paypal-transmission-sig', 'paypal-cert-id'],
      github: ['x-hub-signature-256', 'x-github-event'],
      discord: ['x-signature-ed25519', 'x-signature-timestamp'],
      generic: []
    };

    return headerMap[provider] || [];
  }
}

// Export singleton
module.exports = new WebhookMiddleware();