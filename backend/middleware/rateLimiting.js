// =============================================================================
// 📄 middleware/rateLimiting.js - CONFIGURATION RATE LIMITING
// =============================================================================

const rateLimit = require('express-rate-limit');
const logger = require('../services/LoggerService');

// Configuration commune
const commonConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  onLimitReached: (req, res, options) => {
    logger.warn('Rate limit atteint', {
      ip: req.ip,
      endpoint: req.path,
      limit: options.max
    });
  }
};

// Rate limiter pour les connexions
const loginLimiter = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  message: { 
    success: false, 
    error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
    code: 'RATE_LIMIT_LOGIN'
  }
});

// Rate limiter pour les inscriptions
const registerLimiter = rateLimit({
  ...commonConfig,
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 créations de compte par IP
  message: { 
    success: false, 
    error: 'Trop de créations de compte. Réessayez dans 1 heure.',
    code: 'RATE_LIMIT_REGISTER'
  }
});

// Rate limiter pour reset password
const passwordResetLimiter = rateLimit({
  ...commonConfig,
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 3, // 3 demandes de reset par IP
  message: { 
    success: false, 
    error: 'Trop de demandes de réinitialisation. Réessayez dans 1 heure.',
    code: 'RATE_LIMIT_PASSWORD_RESET'
  }
});

// Rate limiter général pour l'API
const apiLimiter = rateLimit({
  ...commonConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: { 
    success: false, 
    error: 'Trop de requêtes. Réessayez plus tard.',
    code: 'RATE_LIMIT_API'
  }
});

// Rate limiter strict pour actions sensibles
const strictLimiter = rateLimit({
  ...commonConfig,
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 actions sensibles par IP
  message: { 
    success: false, 
    error: 'Limite d\'actions sensibles atteinte. Réessayez dans 1 heure.',
    code: 'RATE_LIMIT_STRICT'
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  apiLimiter,
  strictLimiter
};