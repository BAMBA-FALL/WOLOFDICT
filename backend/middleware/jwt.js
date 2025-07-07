// =============================================================================
// 🎫 JWT MIDDLEWARE - SANS DÉPENDANCE CIRCULAIRE
// Solution optimisée pour éviter les imports problématiques
// =============================================================================

const logger = require('../services/LoggerService');

class JWTMiddleware {
  constructor() {
    this.name = 'JWTMiddleware';
    this.encryptionService = require('../services/EncryptionService');
    
    // Configuration JWT
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
    this.jwtOptions = {
      issuer: 'WolofDict',
      audience: 'wolofdict-users',
      algorithm: 'HS256'
    };
  }

  // =============================================================================
  // 🎫 GÉNÉRATION DE TOKENS JWT (DÉLÉGATION À ENCRYPTIONSERVICE)
  // =============================================================================

  /**
   * ✅ Déléguer la génération à EncryptionService
   */
  generateTokenPair(userPayload) {
    try {
      // Délégation complète à EncryptionService
      return this.encryptionService.generateTokenPair(userPayload);
    } catch (error) {
      logger.error('Erreur génération tokens JWT middleware:', error.message);
      throw error;
    }
  }

  generateAccessToken(payload) {
    return this.encryptionService.generateToken(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m'
    });
  }

  generateRefreshToken(payload) {
    return this.encryptionService.generateToken(
      { userId: payload.userId, type: 'refresh' },
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  // =============================================================================
  // 🔍 VÉRIFICATION DE TOKENS JWT (DÉLÉGATION À ENCRYPTIONSERVICE)
  // =============================================================================

  verifyAccessToken(token) {
    try {
      // Délégation complète à EncryptionService
      const verification = this.encryptionService.verifyToken(token);
      
      // Validation supplémentaire spécifique au middleware
      if (verification.valid && verification.payload.type && verification.payload.type !== 'access') {
        return {
          valid: false,
          payload: null,
          expired: false,
          error: 'Type de token invalide pour access token'
        };
      }
      
      return verification;
    } catch (error) {
      logger.error('Erreur vérification access token:', error.message);
      return {
        valid: false,
        payload: null,
        expired: false,
        error: error.message
      };
    }
  }

  verifyRefreshToken(token) {
    try {
      const verification = this.encryptionService.verifyToken(token);
      
      // Validation pour refresh token
      if (verification.valid && verification.payload.type !== 'refresh') {
        return {
          valid: false,
          payload: null,
          expired: false,
          error: 'Type de token invalide pour refresh token'
        };
      }
      
      return verification;
    } catch (error) {
      return {
        valid: false,
        payload: null,
        expired: false,
        error: error.message
      };
    }
  }

  // =============================================================================
  // 🛡️ MIDDLEWARES JWT (SANS AUTHSERVICE)
  // =============================================================================

  /**
   * ✅ SOLUTION 2 : Import dynamique d'AuthService si nécessaire
   */
  authenticateJWT() {
    return async (req, res, next) => {
      try {
        // Extraction du token
        let token = this.extractTokenFromRequest(req);

        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Token JWT manquant',
            code: 'JWT_MISSING'
          });
        }

        // Vérification du token via EncryptionService
        const verification = this.verifyAccessToken(token);
        
        if (!verification.valid) {
          if (verification.expired) {
            return res.status(401).json({
              success: false,
              error: 'Token JWT expiré',
              code: 'JWT_EXPIRED'
            });
          }

          return res.status(401).json({
            success: false,
            error: 'Token JWT invalide',
            code: 'JWT_INVALID',
            details: verification.error
          });
        }

        // ✅ Import dynamique pour éviter la dépendance circulaire
        const AuthService = this.getAuthService();
        
        // Vérification blacklist
        if (AuthService.blacklistedTokens && AuthService.blacklistedTokens.has(token)) {
          return res.status(401).json({
            success: false,
            error: 'Token JWT révoqué',
            code: 'JWT_REVOKED'
          });
        }

        // Récupération de l'utilisateur
        const user = await AuthService.findUserById(verification.payload.userId);
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Utilisateur JWT non trouvé',
            code: 'JWT_USER_NOT_FOUND'
          });
        }

        if (user.status !== 'active') {
          return res.status(401).json({
            success: false,
            error: 'Compte utilisateur inactif',
            code: 'JWT_USER_INACTIVE'
          });
        }

        // Enrichissement de la requête
        req.user = user;
        req.jwt = {
          token: token,
          payload: verification.payload,
          issuedAt: new Date(verification.payload.iat * 1000),
          expiresAt: new Date(verification.payload.exp * 1000)
        };
        req.isAuthenticated = true;

        next();

      } catch (error) {
        logger.error('Erreur middleware JWT:', error.message);

        return res.status(500).json({
          success: false,
          error: 'Erreur vérification JWT',
          code: 'JWT_VERIFICATION_ERROR'
        });
      }
    };
  }

  /**
   * ✅ SOLUTION 3 : Middleware JWT minimal (sans accès utilisateur)
   */
  authenticateJWTMinimal() {
    return (req, res, next) => {
      try {
        // Extraction du token
        let token = this.extractTokenFromRequest(req);

        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Token JWT manquant',
            code: 'JWT_MISSING'
          });
        }

        // Vérification du token uniquement
        const verification = this.verifyAccessToken(token);
        
        if (!verification.valid) {
          return res.status(401).json({
            success: false,
            error: 'Token JWT invalide',
            code: 'JWT_INVALID'
          });
        }

        // Ajouter seulement les infos JWT (pas l'utilisateur complet)
        req.jwt = {
          token: token,
          payload: verification.payload,
          issuedAt: new Date(verification.payload.iat * 1000),
          expiresAt: new Date(verification.payload.exp * 1000)
        };
        req.userId = verification.payload.userId;
        req.userRole = verification.payload.role;
        req.isAuthenticated = true;

        next();

      } catch (error) {
        logger.error('Erreur middleware JWT minimal:', error.message);

        return res.status(401).json({
          success: false,
          error: 'Erreur vérification JWT',
          code: 'JWT_ERROR'
        });
      }
    };
  }

  /**
   * Middleware JWT optionnel
   */
  optionalJWT() {
    return async (req, res, next) => {
      try {
        let token = this.extractTokenFromRequest(req);

        if (!token) {
          req.user = null;
          req.jwt = null;
          req.isAuthenticated = false;
          return next();
        }

        const verification = this.verifyAccessToken(token);
        
        if (verification.valid) {
          // Import dynamique seulement si token valide
          const AuthService = this.getAuthService();
          const user = await AuthService.findUserById(verification.payload.userId);
          
          if (user && user.status === 'active') {
            req.user = user;
            req.jwt = {
              token: token,
              payload: verification.payload,
              issuedAt: new Date(verification.payload.iat * 1000),
              expiresAt: new Date(verification.payload.exp * 1000)
            };
            req.isAuthenticated = true;
          } else {
            req.user = null;
            req.jwt = null;
            req.isAuthenticated = false;
          }
        } else {
          req.user = null;
          req.jwt = null;
          req.isAuthenticated = false;
        }

        next();

      } catch (error) {
        logger.error('Erreur middleware JWT optionnel:', error.message);
        req.user = null;
        req.jwt = null;
        req.isAuthenticated = false;
        next();
      }
    };
  }

  // =============================================================================
  // 🔄 REFRESH TOKEN AVEC IMPORT DYNAMIQUE
  // =============================================================================

  handleJWTRefresh() {
    return async (req, res, next) => {
      try {
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
          return res.status(401).json({
            success: false,
            error: 'Refresh token JWT manquant',
            code: 'JWT_REFRESH_MISSING'
          });
        }

        // Vérification via EncryptionService
        const verification = this.verifyRefreshToken(refreshToken);
        
        if (!verification.valid) {
          res.clearCookie('accessToken');
          res.clearCookie('refreshToken');

          return res.status(401).json({
            success: false,
            error: 'Refresh token JWT invalide',
            code: 'JWT_REFRESH_INVALID',
            details: verification.error
          });
        }

        // Import dynamique d'AuthService
        const AuthService = this.getAuthService();
        
        // Récupération de l'utilisateur
        const user = await AuthService.findUserById(verification.payload.userId);
        if (!user || user.status !== 'active') {
          return res.status(401).json({
            success: false,
            error: 'Utilisateur JWT non valide pour refresh',
            code: 'JWT_REFRESH_USER_INVALID'
          });
        }

        // Génération de nouveaux tokens via EncryptionService
        const newTokens = this.generateTokenPair({
          userId: user.id,
          email: user.email,
          role: user.role,
          isVerified: user.is_verified
        });

        // Blacklister l'ancien refresh token
        if (AuthService.blacklistedTokens) {
          AuthService.blacklistedTokens.add(refreshToken);
        }

        // Mise à jour des cookies
        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        };

        res.cookie('accessToken', newTokens.accessToken, {
          ...cookieOptions,
          maxAge: 15 * 60 * 1000
        });

        res.cookie('refreshToken', newTokens.refreshToken, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
          success: true,
          message: 'Tokens JWT rafraîchis',
          tokens: newTokens,
          user: this.sanitizeUserBasic(user)
        });

      } catch (error) {
        logger.error('Erreur refresh JWT:', error.message);

        res.status(500).json({
          success: false,
          error: 'Erreur lors du refresh JWT',
          code: 'JWT_REFRESH_ERROR'
        });
      }
    };
  }

  // =============================================================================
  // 🔧 MÉTHODES UTILITAIRES
  // =============================================================================

  /**
   * ✅ Import dynamique sécurisé d'AuthService
   */
  getAuthService() {
    try {
      // Import uniquement quand nécessaire pour éviter la dépendance circulaire
      return require('../services/AuthService');
    } catch (error) {
      logger.error('Impossible d\'importer AuthService:', error.message);
      throw new Error('AuthService non disponible');
    }
  }

  /**
   * Extraire le token depuis la requête HTTP
   */
  extractTokenFromRequest(req) {
    let token = null;
    
    // 1. Depuis les cookies (priorité)
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    // 2. Depuis l'en-tête Authorization
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // 3. Depuis le body (pour certaines routes)
    if (!token && req.body && req.body.accessToken) {
      token = req.body.accessToken;
    }

    return token;
  }

  /**
   * Sanitisation basique d'utilisateur (sans AuthService)
   */
  sanitizeUserBasic(user) {
    if (!user) return null;
    
    const clean = { ...user.toJSON ? user.toJSON() : user };
    
    // Supprimer les champs sensibles
    const sensitiveFields = [
      'password', 
      'password_reset_token', 
      'email_verification_token',
      'registration_ip'
    ];
    
    sensitiveFields.forEach(field => delete clean[field]);
    
    return clean;
  }

  /**
   * Middleware pour vérifier les rôles JWT (sans AuthService)
   */
  requireJWTRole(roles = []) {
    return (req, res, next) => {
      if (!req.jwt || !req.jwt.payload) {
        return res.status(401).json({
          success: false,
          error: 'JWT requis pour vérification de rôle',
          code: 'JWT_REQUIRED_FOR_ROLE'
        });
      }

      const userRole = req.jwt.payload.role || 'user';
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          error: 'Rôle JWT insuffisant',
          code: 'JWT_INSUFFICIENT_ROLE',
          requiredRoles: allowedRoles,
          userRole: userRole
        });
      }

      next();
    };
  }

  /**
   * Middleware pour ajouter les infos JWT à la réponse
   */
  includeJWTInfo() {
    return (req, res, next) => {
      if (req.jwt) {
        res.locals.jwt = {
          hasToken: true,
          isAuthenticated: req.isAuthenticated || false,
          userId: req.jwt.payload.userId,
          email: req.jwt.payload.email,
          role: req.jwt.payload.role,
          isVerified: req.jwt.payload.isVerified,
          issuedAt: req.jwt.issuedAt,
          expiresAt: req.jwt.expiresAt,
          timeToExpiry: req.jwt.expiresAt ? 
            Math.max(0, req.jwt.expiresAt.getTime() - Date.now()) : null
        };
      }
      next();
    };
  }

  /**
   * Extraire les informations JWT de la requête
   */
  extractJWTInfo(req) {
    if (!req.jwt) {
      return {
        hasToken: false,
        isAuthenticated: false,
        userId: null,
        email: null,
        role: null,
        isVerified: false,
        issuedAt: null,
        expiresAt: null,
        timeToExpiry: null
      };
    }

    return {
      hasToken: true,
      isAuthenticated: req.isAuthenticated || false,
      userId: req.jwt.payload.userId,
      email: req.jwt.payload.email,
      role: req.jwt.payload.role,
      isVerified: req.jwt.payload.isVerified,
      issuedAt: req.jwt.issuedAt,
      expiresAt: req.jwt.expiresAt,
      timeToExpiry: req.jwt.expiresAt ? 
        Math.max(0, req.jwt.expiresAt.getTime() - Date.now()) : null
    };
  }

  /**
   * Décoder un token JWT sans vérification
   */
  decodeToken(token) {
    return this.encryptionService.verifyToken(token, { ignoreExpiration: true });
  }

  /**
   * Route de debug pour les tokens JWT
   */
  debugJWT() {
    return (req, res) => {
      try {
        const token = req.cookies.accessToken || 
                     req.headers.authorization?.replace('Bearer ', '') ||
                     req.body.token;

        if (!token) {
          return res.status(400).json({
            success: false,
            error: 'Aucun token JWT fourni'
          });
        }

        const verification = this.verifyAccessToken(token);

        res.status(200).json({
          success: true,
          debug: {
            token: token.substring(0, 20) + '...',
            verification: verification,
            isBlacklisted: false // Vérification sans AuthService
          }
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Erreur debug JWT',
          details: error.message
        });
      }
    };
  }

  /**
   * Obtenir les statistiques JWT
   */
  getJWTStats() {
    return {
      encryptionServiceAvailable: !!this.encryptionService,
      jwtSecret: !!this.jwtSecret,
      jwtRefreshSecret: !!this.jwtRefreshSecret,
      defaultExpiry: process.env.JWT_EXPIRES_IN || '15m',
      defaultRefreshExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      algorithm: this.jwtOptions.algorithm,
      issuer: this.jwtOptions.issuer,
      audience: this.jwtOptions.audience
    };
  }
}

module.exports = new JWTMiddleware();