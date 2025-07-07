// =============================================================================
// 📄 middleware/logging.js - MIDDLEWARE DE LOGGING
// =============================================================================

const logger = require('../services/LoggerService');

class LoggingMiddleware {
  /**
   * Logger pour les requêtes HTTP
   */
  static requestLogger() {
    return (req, res, next) => {
      const start = Date.now();

      // Intercepter la fin de la réponse
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - start;
        
        // Logger la requête
        logger.logRequest(req, res, duration);
        
        // Appeler la méthode originale
        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Logger pour les erreurs
   */
  static errorLogger() {
    return (err, req, res, next) => {
      logger.error('Erreur HTTP:', {
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next(err);
    };
  }
}

module.exports = LoggingMiddleware;
