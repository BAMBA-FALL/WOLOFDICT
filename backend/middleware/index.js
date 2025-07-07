// =============================================================================
// 📄 middleware/index.js - EXPORT CENTRALISÉ
// =============================================================================

const authMiddleware = require('./auth');
const rateLimitingMiddleware = require('./rateLimiting');
const validationMiddleware = require('./validation');
const securityMiddleware = require('./security');
const loggingMiddleware = require('./logging');
const corsMiddleware = require('./cors');
const errorHandler = require('./errorHandler');
const subscriptionMiddleware = require('./subscription');
const jwtMiddleware = require('./jwt'); // ✨ AJOUT JWT MIDDLEWARE
const cacheMiddleware = require('./cache');        // ✨ NOUVEAU
const analyticsMiddleware = require('./analytics'); // ✨ NOUVEAU
const webhookMiddleware = require('./webhook');     // ✨ NOUVEAU

module.exports = {
  // Auth middlewares (généraux)
  requireAuth: authMiddleware.requireAuth,
  requireRole: authMiddleware.requireRole,
  requireVerifiedEmail: authMiddleware.requireVerifiedEmail,
  optionalAuth: authMiddleware.optionalAuth,

  // JWT middlewares (spécialisés) ✨
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

  // Rate limiting
  loginLimiter: rateLimitingMiddleware.loginLimiter,
  registerLimiter: rateLimitingMiddleware.registerLimiter,
  passwordResetLimiter: rateLimitingMiddleware.passwordResetLimiter,
  apiLimiter: rateLimitingMiddleware.apiLimiter,
  strictLimiter: rateLimitingMiddleware.strictLimiter,

  // Validation
  validateLogin: validationMiddleware.validateLogin,
  validateRegister: validationMiddleware.validateRegister,
  validatePasswordReset: validationMiddleware.validatePasswordReset,
  validateNewPassword: validationMiddleware.validateNewPassword,
  validateChangePassword: validationMiddleware.validateChangePassword,
  validateId: validationMiddleware.validateId, // ✨ AJOUT VALIDATION ID

  // Security
  helmet: securityMiddleware.helmet,
  sanitizeInput: securityMiddleware.sanitizeInput,
  preventXSS: securityMiddleware.preventXSS,

  // Logging
  requestLogger: loggingMiddleware.requestLogger,
  errorLogger: loggingMiddleware.errorLogger,

  // CORS
  corsConfig: corsMiddleware.corsConfig,

  // Error handling
  notFound: errorHandler.notFound,
  globalErrorHandler: errorHandler.globalErrorHandler,

  // Subscription
  requireSubscription: subscriptionMiddleware.requireSubscription,
  checkFeatureAccess: subscriptionMiddleware.checkFeatureAccess,
  checkUsageLimit: subscriptionMiddleware.checkUsageLimit,

  cacheResponse: cacheMiddleware.cacheResponse,
  trackRequest: analyticsMiddleware.trackRequest,
  verifyWebhook: webhookMiddleware.verifyWebhook
};