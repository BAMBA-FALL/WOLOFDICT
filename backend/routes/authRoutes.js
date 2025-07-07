// =============================================================================
// 🌍 WOLOFDICT - ROUTES D'AUTHENTIFICATION FINALES
// Routes optimisées avec JWT sans dépendance circulaire
// =============================================================================

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const middleware = require('../middleware'); // Middlewares centralisés
const jwtMiddleware = require('../middleware/jwt'); // JWT sans dépendance circulaire

// =============================================================================
// 🔐 ROUTES PUBLIQUES AVEC RATE LIMITING
// =============================================================================

/**
 * POST /api/auth/login - Connexion utilisateur
 * Returns: JWT tokens dans cookies + infos utilisateur
 */
router.post('/login', 
  middleware.loginLimiter,           // Rate limiting: 5 tentatives/15min
  middleware.validateLogin(),        // Validation email + password
  AuthController.login.bind(AuthController)
);

/**
 * POST /api/auth/register - Inscription utilisateur
 * Returns: JWT tokens dans cookies + infos utilisateur + email envoyé
 */
router.post('/register',
  middleware.registerLimiter,        // Rate limiting: 3 créations/heure
  middleware.validateRegister(),     // Validation complète inscription
  AuthController.register.bind(AuthController)
);

/**
 * POST /api/auth/refresh - Rafraîchir les tokens JWT
 * Returns: Nouveaux JWT tokens dans cookies
 */
router.post('/refresh',
  jwtMiddleware.handleJWTRefresh()   // JWT refresh avec import dynamique
);

/**
 * POST /api/auth/logout - Déconnexion
 * Clears: Cookies JWT + blacklist du refresh token
 */
router.post('/logout',
  jwtMiddleware.optionalJWT(),       // JWT optionnel pour logout
  AuthController.logout.bind(AuthController)
);

// =============================================================================
// 📧 VÉRIFICATION EMAIL
// =============================================================================

/**
 * GET /api/auth/verify?token=... - Vérifier l'email
 * Params: token (query param) - Token de vérification email
 */
router.get('/verify',
  AuthController.verifyEmail.bind(AuthController)
);

/**
 * POST /api/auth/resend-verification - Renvoyer email de vérification
 * Body: { email: string }
 */
router.post('/resend-verification',
  middleware.passwordResetLimiter,   // Rate limiting: 3 demandes/heure
  AuthController.resendVerification.bind(AuthController)
);

// =============================================================================
// 🔑 RÉINITIALISATION MOT DE PASSE
// =============================================================================

/**
 * POST /api/auth/forgot-password - Demander réinitialisation
 * Body: { email: string }
 * Returns: Message générique (sécurité)
 */
router.post('/forgot-password',
  middleware.passwordResetLimiter,   // Rate limiting: 3 demandes/heure
  middleware.validatePasswordReset(), // Validation email
  AuthController.forgotPassword.bind(AuthController)
);

/**
 * POST /api/auth/reset-password - Réinitialiser le mot de passe
 * Body: { token: string, newPassword: string }
 */
router.post('/reset-password',
  middleware.validateNewPassword(),   // Validation token + nouveau password
  AuthController.resetPassword.bind(AuthController)
);

// =============================================================================
// 👤 ROUTES AUTHENTIFIÉES JWT - PROFIL UTILISATEUR
// =============================================================================

/**
 * GET /api/auth/me - Récupérer le profil utilisateur complet
 * Requires: JWT access token valide
 * Returns: User + subscription + JWT info
 */
router.get('/me',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  jwtMiddleware.includeJWTInfo(),    // Infos JWT dans la réponse
  AuthController.getProfile.bind(AuthController)
);

/**
 * PUT /api/auth/profile - Mettre à jour le profil utilisateur
 * Requires: JWT access token valide
 * Body: { firstName?, lastName?, phoneNumber?, bio?, location? }
 */
router.put('/profile',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  AuthController.updateProfile.bind(AuthController)
);

/**
 * POST /api/auth/change-password - Changer le mot de passe
 * Requires: JWT access token valide
 * Body: { currentPassword: string, newPassword: string, confirmPassword: string }
 */
router.post('/change-password',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  middleware.validateChangePassword(), // Validation des passwords
  AuthController.changePassword.bind(AuthController)
);

// =============================================================================
// 🔒 ROUTES AVEC VÉRIFICATION EMAIL REQUISE
// =============================================================================

/**
 * POST /api/auth/logout-all - Déconnecter toutes les sessions
 * Requires: JWT + email vérifié
 */
router.post('/logout-all',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  middleware.requireVerifiedEmail(), // Email vérifié requis
  AuthController.logoutAll.bind(AuthController)
);

/**
 * POST /api/auth/request-account-deletion - Demander suppression compte
 * Requires: JWT + email vérifié + rate limiting strict
 * Body: { reason?: string }
 */
router.post('/request-account-deletion',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  middleware.requireVerifiedEmail(), // Email vérifié requis
  middleware.strictLimiter,          // Rate limiting strict
  AuthController.requestAccountDeletion.bind(AuthController)
);

// =============================================================================
// 🔐 ROUTES DE SÉCURITÉ AVANCÉE
// =============================================================================

/**
 * POST /api/auth/verify-password - Vérifier mot de passe actuel
 * Requires: JWT + rate limiting strict
 * Body: { password: string }
 * Returns: { valid: boolean }
 */
router.post('/verify-password',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  middleware.strictLimiter,          // Rate limiting strict pour sécurité
  AuthController.verifyCurrentPassword.bind(AuthController)
);

/**
 * GET /api/auth/password-strength - Analyser force du mot de passe
 * Query: password=... (pour test côté client)
 * Returns: { strength: object }
 */
router.get('/password-strength',
  middleware.apiLimiter,             // Rate limiting API standard
  AuthController.checkPasswordStrength.bind(AuthController)
);

// =============================================================================
// 🎫 ROUTES SPÉCIFIQUES JWT
// =============================================================================

/**
 * GET /api/auth/jwt/info - Informations détaillées sur le token JWT actuel
 * Requires: JWT access token valide
 * Returns: Infos complètes JWT (expiration, rôle, etc.)
 */
router.get('/jwt/info',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  (req, res) => {
    const jwtInfo = jwtMiddleware.extractJWTInfo(req);
    res.status(200).json({
      success: true,
      jwt: jwtInfo,
      message: 'Informations JWT récupérées avec succès'
    });
  }
);

/**
 * POST /api/auth/jwt/verify - Vérifier la validité d'un token JWT
 * Body: { token: string }
 * Returns: { verification: object }
 */
router.post('/jwt/verify',
  middleware.apiLimiter,             // Rate limiting API
  (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token JWT requis',
          code: 'JWT_TOKEN_REQUIRED'
        });
      }

      const verification = jwtMiddleware.verifyAccessToken(token);
      
      res.status(200).json({
        success: true,
        verification: {
          valid: verification.valid,
          expired: verification.expired,
          error: verification.error || null,
          payload: verification.valid ? {
            userId: verification.payload.userId,
            email: verification.payload.email,
            role: verification.payload.role,
            isVerified: verification.payload.isVerified,
            issuedAt: new Date(verification.payload.iat * 1000),
            expiresAt: new Date(verification.payload.exp * 1000)
          } : null
        },
        message: 'Token JWT vérifié'
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification JWT',
        code: 'JWT_VERIFICATION_ERROR'
      });
    }
  }
);

/**
 * POST /api/auth/jwt/revoke - Révoquer un token JWT
 * Requires: JWT access token valide
 * Body: { token?: string } - Token à révoquer (ou token actuel si omis)
 */
router.post('/jwt/revoke',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  (req, res) => {
    try {
      const { token } = req.body;
      const currentToken = req.jwt.token;

      // Token à révoquer (spécifié ou actuel)
      const tokenToRevoke = token || currentToken;

      if (!tokenToRevoke) {
        return res.status(400).json({
          success: false,
          error: 'Token à révoquer requis',
          code: 'TOKEN_REQUIRED'
        });
      }

      // Import dynamique d'AuthService pour la blacklist
      const AuthService = jwtMiddleware.getAuthService();
      if (AuthService.blacklistedTokens) {
        AuthService.blacklistedTokens.add(tokenToRevoke);
      }

      // Si on révoque le token actuel, nettoyer les cookies
      if (tokenToRevoke === currentToken) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
      }

      res.status(200).json({
        success: true,
        message: 'Token JWT révoqué avec succès',
        revokedCurrentToken: tokenToRevoke === currentToken
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la révocation JWT',
        code: 'JWT_REVOKE_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/jwt/remaining-time - Temps restant avant expiration JWT
 * Requires: JWT access token valide
 * Returns: Temps restant en différents formats
 */
router.get('/jwt/remaining-time',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  (req, res) => {
    try {
      const jwtInfo = jwtMiddleware.extractJWTInfo(req);
      
      const remainingTime = jwtInfo.timeToExpiry;
      const remainingMinutes = Math.floor(remainingTime / (1000 * 60));
      const remainingSeconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      res.status(200).json({
        success: true,
        remainingTime: {
          milliseconds: remainingTime,
          seconds: remainingSeconds,
          minutes: remainingMinutes,
          formatted: `${remainingMinutes}m ${remainingSeconds}s`
        },
        expiresAt: jwtInfo.expiresAt,
        shouldRefresh: remainingTime < 5 * 60 * 1000, // Refresh si < 5 minutes
        message: 'Temps restant JWT calculé'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur calcul temps restant JWT',
        code: 'JWT_TIME_ERROR'
      });
    }
  }
);

/**
 * GET /api/auth/jwt/debug - Debug token JWT (développement/admin uniquement)
 * Requires: Développement OU rôle admin
 */
router.get('/jwt/debug',
  process.env.NODE_ENV === 'development' ? 
    [] : [jwtMiddleware.authenticateJWT(), jwtMiddleware.requireJWTRole(['admin'])],
  jwtMiddleware.debugJWT()
);

// =============================================================================
// 🔧 ROUTES UTILITAIRES ET STATUS
// =============================================================================

/**
 * GET /api/auth/status - Vérifier le statut d'authentification
 * Auth: Optionnelle (plus d'infos si connecté)
 */
router.get('/status',
  jwtMiddleware.optionalJWT(),       // JWT optionnel
  AuthController.checkAuthStatus.bind(AuthController)
);

/**
 * GET /api/auth/health - Vérifier la santé des services + JWT
 * Returns: Status de tous les services (auth, email, jwt)
 */
router.get('/health',
  (req, res) => {
    try {
      const AuthService = require('../services/AuthService');
      const EmailService = require('../services/EmailService');
      
      const authStatus = AuthService.getStatus();
      const emailStatus = EmailService.getStatus();
      const jwtStats = jwtMiddleware.getJWTStats();

      res.status(200).json({
        success: true,
        services: {
          auth: authStatus,
          email: emailStatus,
          jwt: jwtStats
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: 'Services non disponibles',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }
);

/**
 * GET /api/auth/user-agent - Analyser le user agent de la requête
 * Returns: Infos navigateur, OS, device
 */
router.get('/user-agent',
  middleware.apiLimiter,             // Rate limiting API standard
  AuthController.analyzeUserAgent.bind(AuthController)
);

// =============================================================================
// 📊 ROUTES D'ADMINISTRATION
// =============================================================================

/**
 * GET /api/auth/admin/stats - Statistiques d'authentification (admin)
 * Requires: JWT + rôle admin
 */
router.get('/admin/stats',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  jwtMiddleware.requireJWTRole(['admin']), // Rôle admin via JWT
  AuthController.getAuthStats.bind(AuthController)
);

/**
 * POST /api/auth/admin/blacklist-token - Blacklister un token (admin)
 * Requires: JWT + rôle admin + rate limiting strict
 * Body: { token: string }
 */
router.post('/admin/blacklist-token',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  jwtMiddleware.requireJWTRole(['admin']), // Rôle admin via JWT
  middleware.strictLimiter,          // Rate limiting strict
  AuthController.blacklistToken.bind(AuthController)
);

/**
 * GET /api/auth/admin/users - Lister les utilisateurs (admin/moderator)
 * Requires: JWT + rôle admin ou moderator
 * Query: page?, limit?, search?, status?
 */
router.get('/admin/users',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  jwtMiddleware.requireJWTRole(['admin', 'moderator']), // Rôles via JWT
  middleware.validatePagination(),   // Validation pagination
  AuthController.listUsers.bind(AuthController)
);

/**
 * GET /api/auth/admin/jwt-stats - Statistiques JWT détaillées (admin)
 * Requires: JWT + rôle admin
 */
router.get('/admin/jwt-stats',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  jwtMiddleware.requireJWTRole(['admin']), // Rôle admin via JWT
  (req, res) => {
    try {
      const stats = jwtMiddleware.getJWTStats();
      const AuthService = jwtMiddleware.getAuthService();
      
      const detailedStats = {
        ...stats,
        blacklistedTokensCount: AuthService.blacklistedTokens?.size || 0,
        timestamp: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        jwtStats: detailedStats,
        message: 'Statistiques JWT détaillées récupérées'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur récupération stats JWT',
        code: 'JWT_STATS_ERROR'
      });
    }
  }
);

// =============================================================================
// 🎯 ROUTES AVEC GESTION D'ABONNEMENT
// =============================================================================

/**
 * GET /api/auth/subscription-info - Infos d'abonnement détaillées
 * Requires: JWT access token valide
 * Returns: Subscription + usage stats
 */
router.get('/subscription-info',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  AuthController.getSubscriptionInfo.bind(AuthController)
);

/**
 * POST /api/auth/premium-action - Action nécessitant un abonnement premium
 * Requires: JWT + abonnement premium/pro
 */
router.post('/premium-action',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  middleware.requireSubscription(['premium', 'pro']), // Abonnement requis
  AuthController.premiumAction.bind(AuthController)
);

/**
 * POST /api/auth/feature-action - Action nécessitant une fonctionnalité spécifique
 * Requires: JWT + fonctionnalité 'advanced_features'
 */
router.post('/feature-action',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  middleware.checkFeatureAccess('advanced_features'), // Fonctionnalité requise
  AuthController.featureAction.bind(AuthController)
);

/**
 * POST /api/auth/limited-action - Action avec limite d'usage
 * Requires: JWT + vérification limite 'daily_actions'
 */
router.post('/limited-action',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  middleware.checkUsageLimit('daily_actions'), // Vérification limite
  AuthController.limitedAction.bind(AuthController)
);

// =============================================================================
// 🔀 ROUTES AVEC AUTHENTIFICATION OPTIONNELLE
// =============================================================================

/**
 * GET /api/auth/public-profile/:userId - Profil public d'un utilisateur
 * Auth: Optionnelle (plus d'infos si connecté)
 * Params: userId (number)
 */
router.get('/public-profile/:userId',
  jwtMiddleware.optionalJWT(),       // JWT optionnel
  middleware.validateId('userId'),   // Validation ID utilisateur
  AuthController.getPublicProfile.bind(AuthController)
);

/**
 * GET /api/auth/public-stats - Statistiques publiques de la plateforme
 * Auth: Optionnelle (stats étendues si connecté)
 */
router.get('/public-stats',
  jwtMiddleware.optionalJWT(),       // JWT optionnel - plus d'infos si connecté
  (req, res) => {
    try {
      const baseStats = {
        totalUsers: 1000,  // Exemple - à remplacer par vraies données
        activeUsers: 750,
        verifiedUsers: 600,
        totalWords: 15000,
        totalContributions: 5000
      };

      // Plus d'infos si utilisateur connecté via JWT
      if (req.isAuthenticated && req.jwt) {
        baseStats.extended = {
          yourRegistrationDate: req.user.created_at,
          yourContributions: req.user.contribution_count,
          yourPoints: req.user.points,
          yourRank: 'Calculé dynamiquement' // À implémenter
        };
      }

      res.status(200).json({
        success: true,
        stats: baseStats,
        authenticated: req.isAuthenticated,
        jwtInfo: req.jwt ? {
          role: req.jwt.payload.role,
          isVerified: req.jwt.payload.isVerified
        } : null,
        message: 'Statistiques publiques récupérées'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur récupération statistiques publiques',
        code: 'PUBLIC_STATS_ERROR'
      });
    }
  }
);

// =============================================================================
// 📱 ROUTES MOBILES ET API
// =============================================================================

/**
 * POST /api/auth/mobile/login - Connexion mobile avec infos device
 * Body: { email, password, platform?, appVersion?, deviceId? }
 */
router.post('/mobile/login',
  middleware.loginLimiter,           // Rate limiting
  middleware.validateLogin(),        // Validation
  AuthController.mobileLogin.bind(AuthController)
);

/**
 * POST /api/auth/api/generate-key - Générer une clé API
 * Requires: JWT + email vérifié + rate limiting strict
 * Body: { purpose?: string }
 * Returns: { apiKey: string }
 */
router.post('/api/generate-key',
  jwtMiddleware.authenticateJWT(),   // Authentification JWT complète
  middleware.requireVerifiedEmail(), // Email vérifié requis
  middleware.strictLimiter,          // Rate limiting strict
  AuthController.generateApiKey.bind(AuthController)
);

/**
 * GET /api/auth/api/validate-key - Valider une clé API
 * Query: apiKey=...
 * Returns: { valid: boolean }
 */
router.get('/api/validate-key',
  middleware.apiLimiter,             // Rate limiting
  (req, res) => {
    try {
      const { apiKey } = req.query;
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Clé API requise',
          code: 'API_KEY_REQUIRED'
        });
      }

      // Validation basique de la clé API
      // Dans une vraie implémentation, vérifier en base de données
      const isValid = apiKey.length > 32 && apiKey.startsWith('wlf_');

      res.status(200).json({
        success: true,
        valid: isValid,
        message: isValid ? 'Clé API valide' : 'Clé API invalide'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur validation clé API',
        code: 'API_KEY_VALIDATION_ERROR'
      });
    }
  }
);

// =============================================================================
// 🧪 ROUTES DE TEST JWT (DÉVELOPPEMENT UNIQUEMENT)
// =============================================================================

if (process.env.NODE_ENV === 'development') {
  /**
   * POST /api/auth/test/generate-jwt - Générer un JWT de test
   * Dev: Génère un token JWT factice pour tests
   */
  router.post('/test/generate-jwt',
    (req, res) => {
      try {
        const testPayload = {
          userId: 999,
          email: 'test@wolofdict.com',
          role: req.body.role || 'user',
          isVerified: true
        };

        const tokens = jwtMiddleware.generateTokenPair(testPayload);

        res.status(200).json({
          success: true,
          message: 'JWT de test généré',
          tokens: tokens,
          payload: testPayload,
          warning: '⚠️ DÉVELOPPEMENT UNIQUEMENT - Ne pas utiliser en production'
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Erreur génération JWT test'
        });
      }
    }
  );

  /**
   * GET /api/auth/test/jwt-decode/:token - Décoder un JWT sans vérification
   * Dev: Utilitaire pour débugger les tokens JWT
   */
  router.get('/test/jwt-decode/:token',
    (req, res) => {
      try {
        const { token } = req.params;
        const verification = jwtMiddleware.verifyAccessToken(token);

        res.status(200).json({
          success: true,
          decoded: verification,
          warning: '⚠️ DÉVELOPPEMENT UNIQUEMENT'
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Erreur décodage JWT test'
        });
      }
    }
  );
}

module.exports = router;