// =============================================================================
// 📄 middleware/errorHandler.js - GESTIONNAIRE D'ERREURS GLOBAL
// =============================================================================

const logger = require('../services/LoggerService');

class ErrorHandler {
  /**
   * Middleware pour les routes non trouvées
   */
  static notFound(req, res, next) {
    const error = new Error(`Route non trouvée - ${req.originalUrl}`);
    error.status = 404;
    next(error);
  }

  /**
   * Gestionnaire d'erreurs global
   */
  static globalErrorHandler(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Logger l'erreur
    logger.error('Erreur globale:', {
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip
    });

    // Erreur de validation Sequelize
    if (err.name === 'SequelizeValidationError') {
      const message = 'Données invalides';
      error = { message, status: 400 };
    }

    // Erreur de clé unique Sequelize
    if (err.name === 'SequelizeUniqueConstraintError') {
      const message = 'Ressource déjà existante';
      error = { message, status: 409 };
    }

    // Erreur JWT
    if (err.name === 'JsonWebTokenError') {
      const message = 'Token invalide';
      error = { message, status: 401 };
    }

    // Erreur JWT expiré
    if (err.name === 'TokenExpiredError') {
      const message = 'Token expiré';
      error = { message, status: 401 };
    }

    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Erreur serveur interne',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
}

module.exports = ErrorHandler;
