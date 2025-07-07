// =============================================================================
// 📄 middleware/auth.js - MIDDLEWARES D'AUTHENTIFICATION
// =============================================================================

const logger = require('../services/LoggerService');
const AuthService = require('../services/AuthService');

class AuthMiddleware {
  /**
   * Middleware pour vérifier l'authentification (obligatoire)
   */
  static requireAuth() {
    return async (req, res, next) => {
      try {
        const token = req.cookies.accessToken || 
                     req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Token d\'authentification manquant',
            code: 'AUTH_TOKEN_MISSING'
          });
        }

        // Vérifier le token via AuthService
        const decoded = AuthService.verifyToken(token);

        // Récupérer l'utilisateur complet
        const user = await AuthService.findUserById(decoded.userId);
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Utilisateur non trouvé',
            code: 'USER_NOT_FOUND'
          });
        }

        // Vérifier le statut du compte
        if (user.status !== 'active') {
          return res.status(401).json({
            success: false,
            error: 'Compte non actif',
            code: 'ACCOUNT_INACTIVE',
            accountStatus: user.status
          });
        }

        // Ajouter l'utilisateur à la requête
        req.user = user;
        req.isAuthenticated = true;
        next();

      } catch (error) {
        logger.error('Erreur middleware auth:', error.message);

        return res.status(401).json({
          success: false,
          error: 'Token invalide ou expiré',
          code: 'AUTH_TOKEN_INVALID'
        });
      }
    };
  }

  /**
   * Middleware pour authentification optionnelle
   */
  static optionalAuth() {
    return async (req, res, next) => {
      try {
        const token = req.cookies.accessToken || 
                     req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          req.user = null;
          req.isAuthenticated = false;
          return next();
        }

        const decoded = AuthService.verifyToken(token);
        const user = await AuthService.findUserById(decoded.userId);
        
        if (user && user.status === 'active') {
          req.user = user;
          req.isAuthenticated = true;
        } else {
          req.user = null;
          req.isAuthenticated = false;
        }

        next();

      } catch (error) {
        // En cas d'erreur, continuer sans authentification
        req.user = null;
        req.isAuthenticated = false;
        next();
      }
    };
  }

  /**
   * Middleware pour vérifier les rôles
   */
  static requireRole(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise',
          code: 'AUTH_REQUIRED'
        });
      }

      const userRole = req.user.role || 'user';
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Permissions insuffisantes',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRole: userRole
        });
      }

      next();
    };
  }

  /**
   * Middleware pour vérifier la vérification email
   */
  static requireVerifiedEmail() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentification requise',
          code: 'AUTH_REQUIRED'
        });
      }

      if (!req.user.is_verified) {
        return res.status(403).json({
          success: false,
          error: 'Email non vérifié',
          code: 'EMAIL_NOT_VERIFIED',
          action: 'verify_email'
        });
      }

      next();
    };
  }
}

module.exports = AuthMiddleware;