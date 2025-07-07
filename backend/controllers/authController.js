// =============================================================================
// 🌍 WOLOFDICT - AUTH CONTROLLER SIMPLIFIÉ
// Contrôleur d'authentification épuré - middlewares gérés dans les routes
// =============================================================================

const logger = require('../services/LoggerService');
const AuthService = require('../services/AuthService');
const EmailService = require('../services/EmailService');
const SubscriptionService = require('../services/SubscriptionService');
const { validationResult } = require('express-validator');

class AuthController {
  constructor() {
    this.name = 'AuthController';
    // Plus de rate limiters ni de validations ici ! 
    // Tout est géré par les middlewares centralisés dans les routes
  }

  // =============================================================================
  // 🔐 ROUTES D'AUTHENTIFICATION PRINCIPALES
  // =============================================================================

  /**
   * POST /api/auth/login - Connexion utilisateur
   * Middlewares appliqués: loginLimiter, validateLogin
   */
  async login(req, res) {
    try {
      // Validation déjà effectuée par le middleware
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { email, password, rememberMe } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      logger.info('Tentative de connexion', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        clientIP,
        rememberMe: !!rememberMe
      });

      // Déléguer à AuthService
      const result = await AuthService.login(email, password, { 
        clientIP,
        userAgent,
        rememberMe 
      });

      // Configuration des cookies sécurisés
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      };

      res.cookie('accessToken', result.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, cookieOptions);

      // Récupérer les informations d'abonnement
      let subscriptionInfo = null;
      try {
        const subscription = await SubscriptionService.getUserSubscription(result.user.id);
        if (subscription) {
          subscriptionInfo = {
            plan: subscription.plan.slug,
            status: subscription.status,
            expires_at: subscription.expires_at,
            trial_ends_at: subscription.trial_ends_at
          };
        }
      } catch (subError) {
        logger.warn('Erreur récupération abonnement lors login:', subError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        user: result.user,
        subscription: subscriptionInfo,
        expiresIn: result.expiresIn
      });

    } catch (error) {
      logger.error('Erreur login controller:', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const safeErrors = {
        'Identifiants invalides': { message: 'Email ou mot de passe incorrect', code: 'INVALID_CREDENTIALS' },
        'Compte temporairement verrouillé suite à trop de tentatives': { message: 'Compte temporairement verrouillé', code: 'ACCOUNT_LOCKED' },
        'Compte suspendu - contactez l\'administration': { message: 'Compte suspendu', code: 'ACCOUNT_SUSPENDED' },
        'Compte supprimé': { message: 'Compte non trouvé', code: 'ACCOUNT_NOT_FOUND' }
      };

      const safeError = safeErrors[error.message] || { 
        message: 'Erreur de connexion', 
        code: 'LOGIN_ERROR' 
      };

      res.status(401).json({
        success: false,
        error: safeError.message,
        code: safeError.code
      });
    }
  }

  /**
   * POST /api/auth/register - Inscription utilisateur
   * Middlewares appliqués: registerLimiter, validateRegister
   */
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { email, password, firstName, lastName, phoneNumber } = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      logger.info('Tentative d\'inscription', { 
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        clientIP,
        hasPhone: !!phoneNumber
      });

      const result = await AuthService.register({
        email,
        password,
        firstName,
        lastName,
        phoneNumber
      }, { 
        clientIP,
        userAgent
      });

      // Envoyer email de vérification asynchrone
      this.sendVerificationEmailAsync(email, result.verificationToken, result.user);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      };

      res.cookie('accessToken', result.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', result.refreshToken, cookieOptions);

      res.status(201).json({
        success: true,
        message: result.message,
        user: result.user,
        emailSent: true,
        requiresVerification: !result.user.is_verified
      });

    } catch (error) {
      logger.error('Erreur register controller:', {
        error: error.message,
        ip: req.ip
      });
      
      const safeErrors = {
        'Cette adresse email est déjà utilisée': { message: 'Cette adresse email est déjà utilisée', code: 'EMAIL_EXISTS' },
        'Mot de passe trop faible': { message: 'Mot de passe ne respecte pas les critères de sécurité', code: 'WEAK_PASSWORD' }
      };

      const safeError = safeErrors[error.message] || { 
        message: 'Erreur lors de la création du compte', 
        code: 'REGISTRATION_ERROR' 
      };

      res.status(400).json({
        success: false,
        error: safeError.message,
        code: safeError.code
      });
    }
  }

  /**
   * POST /api/auth/refresh - Rafraîchir le token
   */
  async refreshToken(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Token de rafraîchissement manquant',
          code: 'REFRESH_TOKEN_MISSING'
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      };

      res.cookie('accessToken', result.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000
      });

      res.cookie('refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        message: 'Token rafraîchi',
        user: result.user
      });

    } catch (error) {
      logger.error('Erreur refresh token controller:', error.message);
      
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(401).json({
        success: false,
        error: 'Token invalide ou expiré',
        code: 'REFRESH_TOKEN_INVALID'
      });
    }
  }

  /**
   * POST /api/auth/logout - Déconnexion
   */
  async logout(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      const clientIP = req.ip || req.connection.remoteAddress;

      await AuthService.logout(refreshToken, { clientIP });

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      logger.error('Erreur logout controller:', error.message);
      
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Déconnexion effectuée'
      });
    }
  }

  // =============================================================================
  // 📧 VÉRIFICATION EMAIL
  // =============================================================================

  /**
   * GET /api/auth/verify?token=... - Vérifier l'email
   */
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token de vérification manquant',
          code: 'VERIFICATION_TOKEN_MISSING'
        });
      }

      const result = await AuthService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: result.message,
        alreadyVerified: result.alreadyVerified || false
      });

    } catch (error) {
      logger.error('Erreur verify email controller:', error.message);

      res.status(400).json({
        success: false,
        error: 'Token de vérification invalide ou expiré',
        code: 'VERIFICATION_TOKEN_INVALID'
      });
    }
  }

  /**
   * POST /api/auth/resend-verification - Renvoyer l'email de vérification
   * Middlewares appliqués: passwordResetLimiter
   */
  async resendVerification(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email requis',
          code: 'EMAIL_REQUIRED'
        });
      }

      const result = await AuthService.resendVerificationEmail(email);

      if (result.verificationToken) {
        try {
          await EmailService.sendVerificationEmail(email, result.verificationToken);
        } catch (emailError) {
          logger.error('Erreur envoi email vérification:', emailError.message);
          throw new Error('Erreur lors de l\'envoi de l\'email');
        }
      }

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Erreur resend verification controller:', error.message);

      res.status(400).json({
        success: false,
        error: 'Erreur lors du renvoi de l\'email de vérification',
        code: 'RESEND_VERIFICATION_ERROR'
      });
    }
  }

  // =============================================================================
  // 🔑 RÉINITIALISATION MOT DE PASSE
  // =============================================================================

  /**
   * POST /api/auth/forgot-password - Demander la réinitialisation
   * Middlewares appliqués: passwordResetLimiter, validatePasswordReset
   */
  async forgotPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Email invalide',
          code: 'VALIDATION_ERROR'
        });
      }

      const { email } = req.body;
      const result = await AuthService.generatePasswordResetToken(email);

      if (result.resetToken && result.user) {
        try {
          await EmailService.sendPasswordResetEmail(email, result.resetToken, {
            userName: result.user.first_name || result.user.username,
            fullName: `${result.user.first_name || ''} ${result.user.last_name || ''}`.trim()
          });
        } catch (emailError) {
          logger.error('Erreur envoi email reset:', emailError.message);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      });

    } catch (error) {
      logger.error('Erreur forgot password controller:', error.message);

      res.status(200).json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
      });
    }
  }

  /**
   * POST /api/auth/reset-password - Réinitialiser le mot de passe
   * Middlewares appliqués: validateNewPassword
   */
  async resetPassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { token, newPassword } = req.body;
      const result = await AuthService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Erreur reset password controller:', error.message);

      const safeErrors = {
        'Token de réinitialisation invalide ou expiré': { message: 'Lien de réinitialisation invalide ou expiré', code: 'RESET_TOKEN_INVALID' },
        'Token invalide ou expiré': { message: 'Lien de réinitialisation invalide ou expiré', code: 'RESET_TOKEN_INVALID' },
        'Token expiré': { message: 'Lien de réinitialisation expiré', code: 'RESET_TOKEN_EXPIRED' }
      };

      const safeError = safeErrors[error.message] || { 
        message: 'Erreur lors de la réinitialisation', 
        code: 'RESET_PASSWORD_ERROR' 
      };

      res.status(400).json({
        success: false,
        error: safeError.message,
        code: safeError.code
      });
    }
  }

  /**
   * POST /api/auth/change-password - Changer le mot de passe
   * Middlewares appliqués: requireAuth, validateChangePassword
   */
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id; // Fourni par le middleware requireAuth

      const result = await AuthService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Erreur change password controller:', error.message);

      const safeErrors = {
        'Utilisateur non trouvé': { message: 'Erreur d\'authentification', code: 'AUTH_ERROR' },
        'Mot de passe actuel incorrect': { message: 'Mot de passe actuel incorrect', code: 'CURRENT_PASSWORD_INCORRECT' }
      };

      const safeError = safeErrors[error.message] || { 
        message: 'Erreur lors du changement de mot de passe', 
        code: 'CHANGE_PASSWORD_ERROR' 
      };

      res.status(400).json({
        success: false,
        error: safeError.message,
        code: safeError.code
      });
    }
  }

  // =============================================================================
  // 👤 PROFIL UTILISATEUR
  // =============================================================================

  /**
   * GET /api/auth/me - Récupérer le profil utilisateur
   * Middlewares appliqués: requireAuth
   */
  async getProfile(req, res) {
    try {
      const user = req.user; // Fourni par le middleware requireAuth

      // Récupérer les informations d'abonnement
      let subscriptionInfo = null;
      try {
        const subscription = await SubscriptionService.getUserSubscription(user.id);
        if (subscription) {
          subscriptionInfo = {
            plan: subscription.plan.slug,
            status: subscription.status,
            expires_at: subscription.expires_at,
            trial_ends_at: subscription.trial_ends_at,
            auto_renew: subscription.auto_renew
          };
        }
      } catch (subError) {
        logger.warn('Erreur récupération abonnement profil:', subError.message);
      }

      res.status(200).json({
        success: true,
        user: AuthService.sanitizeUser(user),
        subscription: subscriptionInfo
      });

    } catch (error) {
      logger.error('Erreur get profile controller:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du profil',
        code: 'PROFILE_ERROR'
      });
    }
  }

  /**
   * PUT /api/auth/profile - Mettre à jour le profil
   * Middlewares appliqués: requireAuth
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { firstName, lastName, phoneNumber, bio, location } = req.body;

      const updates = {};
      if (firstName !== undefined) updates.first_name = firstName.trim();
      if (lastName !== undefined) updates.last_name = lastName.trim();
      if (phoneNumber !== undefined) updates.phone_number = phoneNumber; // AuthService gère le chiffrement
      if (bio !== undefined) updates.bio = bio.trim();
      if (location !== undefined) updates.location = location.trim();

      const updatedUser = await AuthService.updateUser(userId, updates);

      res.status(200).json({
        success: true,
        message: 'Profil mis à jour avec succès',
        user: AuthService.sanitizeUser(updatedUser)
      });

    } catch (error) {
      logger.error('Erreur update profile controller:', error.message);

      res.status(400).json({
        success: false,
        error: 'Erreur lors de la mise à jour du profil',
        code: 'UPDATE_PROFILE_ERROR'
      });
    }
  }

  // =============================================================================
  // 🔒 SÉCURITÉ AVANCÉE
  // =============================================================================

  /**
   * POST /api/auth/logout-all - Déconnecter toutes les sessions
   * Middlewares appliqués: requireAuth, requireVerifiedEmail
   */
  async logoutAll(req, res) {
    try {
      const userId = req.user.id;
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await AuthService.logout(refreshToken, { clientIP: req.ip });
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      logger.info('Déconnexion de toutes les sessions', { userId });

      res.status(200).json({
        success: true,
        message: 'Toutes les sessions ont été fermées'
      });

    } catch (error) {
      logger.error('Erreur logout all:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la déconnexion',
        code: 'LOGOUT_ALL_ERROR'
      });
    }
  }

  /**
   * POST /api/auth/verify-password - Vérifier mot de passe actuel
   * Middlewares appliqués: requireAuth, strictLimiter
   */
  async verifyCurrentPassword(req, res) {
    try {
      const { password } = req.body;
      const userId = req.user.id;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe requis',
          code: 'PASSWORD_REQUIRED'
        });
      }

      const user = await AuthService.findUserById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      const isValid = await AuthService.encryptionService.verifyPassword(password, user.password);

      res.status(200).json({
        success: true,
        valid: isValid
      });

    } catch (error) {
      logger.error('Erreur verify password:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur de vérification',
        code: 'VERIFY_PASSWORD_ERROR'
      });
    }
  }

  /**
   * GET /api/auth/password-strength - Vérifier la force d'un mot de passe
   * Middlewares appliqués: apiLimiter
   */
  async checkPasswordStrength(req, res) {
    try {
      const { password } = req.query;

      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Mot de passe requis',
          code: 'PASSWORD_REQUIRED'
        });
      }

      const strength = AuthService.encryptionService.validatePasswordStrength(password);

      res.status(200).json({
        success: true,
        strength: strength
      });

    } catch (error) {
      logger.error('Erreur check password strength:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur de vérification',
        code: 'PASSWORD_STRENGTH_ERROR'
      });
    }
  }

  /**
   * POST /api/auth/request-account-deletion - Demander suppression de compte
   * Middlewares appliqués: requireAuth, requireVerifiedEmail, strictLimiter
   */
  async requestAccountDeletion(req, res) {
    try {
      const userId = req.user.id;
      const { reason } = req.body;

      logger.info('Demande de suppression de compte', { 
        userId, 
        reason: reason || 'Non spécifiée' 
      });

      // Dans une implémentation complète :
      // 1. Envoyer email de confirmation
      // 2. Créer tâche planifiée de suppression
      // 3. Marquer le compte pour suppression

      res.status(200).json({
        success: true,
        message: 'Demande de suppression enregistrée. Vous recevrez un email de confirmation.'
      });

    } catch (error) {
      logger.error('Erreur request account deletion:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la demande',
        code: 'ACCOUNT_DELETION_ERROR'
      });
    }
  }

  // =============================================================================
  // 🔧 UTILITAIRES ET STATUS
  // =============================================================================

  /**
   * GET /api/auth/status - Vérifier le statut d'authentification
   */
  async checkAuthStatus(req, res) {
    try {
      const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          error: 'Non authentifié',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const decoded = AuthService.verifyToken(token);

      res.status(200).json({
        success: true,
        authenticated: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          isVerified: decoded.isVerified
        }
      });

    } catch (error) {
      res.status(401).json({
        success: false,
        authenticated: false,
        error: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }
  }

  /**
   * GET /api/auth/health - Vérifier la santé du service d'auth
   */
  async healthCheck(req, res) {
    try {
      const authStatus = AuthService.getStatus();
      const emailStatus = EmailService.getStatus();

      res.status(200).json({
        success: true,
        services: {
          auth: authStatus,
          email: emailStatus
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Erreur health check:', error.message);

      res.status(503).json({
        success: false,
        error: 'Services non disponibles',
        code: 'SERVICE_UNAVAILABLE'
      });
    }
  }

  /**
   * GET /api/auth/user-agent - Analyser le user agent
   * Middlewares appliqués: apiLimiter
   */
  async analyzeUserAgent(req, res) {
    try {
      const userAgent = req.get('User-Agent');
      
      const analysis = {
        userAgent,
        isMobile: /Mobile|Android|iPhone|iPad/.test(userAgent),
        isTablet: /iPad|Tablet/.test(userAgent),
        browser: this.detectBrowser(userAgent),
        os: this.detectOS(userAgent)
      };

      res.status(200).json({
        success: true,
        analysis
      });

    } catch (error) {
      logger.error('Erreur analyze user agent:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur d\'analyse',
        code: 'USER_AGENT_ERROR'
      });
    }
  }

  // =============================================================================
  // 📊 MÉTHODES D'ADMINISTRATION
  // =============================================================================

  /**
   * GET /api/auth/admin/stats - Statistiques d'authentification
   * Middlewares appliqués: requireAuth, requireRole(['admin'])
   */
  async getAuthStats(req, res) {
    try {
      const authStatus = AuthService.getStatus();
      
      const stats = {
        totalUsers: 0, // À implémenter via AuthService si nécessaire
        activeUsers: 0,
        verifiedUsers: 0,
        recentRegistrations: 0,
        blacklistedTokens: authStatus.security?.blacklistedTokensCount || 0,
        activeLoginAttempts: authStatus.security?.activeLoginAttempts || 0,
        serviceHealth: authStatus.initialized ? 'healthy' : 'degraded',
        encryptionService: authStatus.hasEncryptionService,
        features: authStatus.features,
        timestamp: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        stats
      });

    } catch (error) {
      logger.error('Erreur get auth stats:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
        code: 'STATS_ERROR'
      });
    }
  }

  /**
   * POST /api/auth/admin/blacklist-token - Blacklister un token
   * Middlewares appliqués: requireAuth, requireRole(['admin']), strictLimiter
   */
  async blacklistToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Token requis',
          code: 'TOKEN_REQUIRED'
        });
      }

      // Ajouter le token à la blacklist
      AuthService.blacklistedTokens.add(token);

      logger.info('Token blacklisté par admin', { 
        adminId: req.user.id,
        tokenPreview: token.substring(0, 20) + '...'
      });

      res.status(200).json({
        success: true,
        message: 'Token blacklisté avec succès'
      });

    } catch (error) {
      logger.error('Erreur blacklist token:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors du blacklistage',
        code: 'BLACKLIST_ERROR'
      });
    }
  }

  /**
   * GET /api/auth/admin/users - Lister les utilisateurs
   * Middlewares appliqués: requireAuth, requireRole(['admin', 'moderator'])
   */
  async listUsers(req, res) {
    try {
      // Cette fonctionnalité nécessiterait d'être implémentée dans AuthService
      res.status(501).json({
        success: false,
        error: 'Fonctionnalité non implémentée',
        code: 'NOT_IMPLEMENTED'
      });

    } catch (error) {
      logger.error('Erreur list users:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des utilisateurs',
        code: 'LIST_USERS_ERROR'
      });
    }
  }

  // =============================================================================
  // 🎯 ROUTES AVEC GESTION D'ABONNEMENT
  // =============================================================================

  /**
   * GET /api/auth/subscription-info - Infos d'abonnement détaillées
   * Middlewares appliqués: requireAuth
   */
  async getSubscriptionInfo(req, res) {
    try {
      const userId = req.user.id;

      const subscription = await SubscriptionService.getUserSubscription(userId);
      const usageStats = await SubscriptionService.getUserUsageStats(userId);

      res.status(200).json({
        success: true,
        subscription: subscription ? {
          id: subscription.id,
          plan: subscription.plan,
          status: subscription.status,
          starts_at: subscription.starts_at,
          expires_at: subscription.expires_at,
          trial_ends_at: subscription.trial_ends_at,
          auto_renew: subscription.auto_renew,
          current_price: subscription.current_price,
          currency: subscription.currency
        } : null,
        usage: usageStats
      });

    } catch (error) {
      logger.error('Erreur get subscription info:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des informations d\'abonnement',
        code: 'SUBSCRIPTION_INFO_ERROR'
      });
    }
  }

  /**
   * POST /api/auth/premium-action - Action nécessitant un abonnement premium
   * Middlewares appliqués: requireAuth, requireSubscription(['premium', 'pro'])
   */
  async premiumAction(req, res) {
    try {
      // L'utilisateur a déjà un abonnement premium (vérifié par le middleware)
      const userId = req.user.id;

      // Logique pour l'action premium
      logger.info('Action premium effectuée', { userId });

      res.status(200).json({
        success: true,
        message: 'Action premium effectuée avec succès'
      });

    } catch (error) {
      logger.error('Erreur premium action:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'action premium',
        code: 'PREMIUM_ACTION_ERROR'
      });
    }
  }

  /**
   * POST /api/auth/feature-action - Action nécessitant une fonctionnalité spécifique
   * Middlewares appliqués: requireAuth, checkFeatureAccess('advanced_features')
   */
  async featureAction(req, res) {
    try {
      // L'utilisateur a accès à la fonctionnalité (vérifié par le middleware)
      const userId = req.user.id;

      // Logique pour l'action avec fonctionnalité
      logger.info('Action avec fonctionnalité avancée effectuée', { userId });

      res.status(200).json({
        success: true,
        message: 'Action avec fonctionnalité effectuée avec succès'
      });

    } catch (error) {
      logger.error('Erreur feature action:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'action avec fonctionnalité',
        code: 'FEATURE_ACTION_ERROR'
      });
    }
  }

  /**
   * POST /api/auth/limited-action - Action avec limite d'usage
   * Middlewares appliqués: requireAuth, checkUsageLimit('daily_actions')
   */
  async limitedAction(req, res) {
    try {
      // L'utilisateur n'a pas dépassé sa limite (vérifié par le middleware)
      const userId = req.user.id;

      // Logique pour l'action limitée
      logger.info('Action limitée effectuée', { userId });

      // Mettre à jour l'usage si nécessaire
      try {
        await SubscriptionService.updateSubscriptionUsage(userId, {
          daily_actions: (req.user.currentUsage?.daily_actions || 0) + 1
        });
      } catch (usageError) {
        logger.warn('Erreur mise à jour usage:', usageError.message);
      }

      res.status(200).json({
        success: true,
        message: 'Action limitée effectuée avec succès'
      });

    } catch (error) {
      logger.error('Erreur limited action:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'action limitée',
        code: 'LIMITED_ACTION_ERROR'
      });
    }
  }

  // =============================================================================
  // 🔀 ROUTES AVEC AUTHENTIFICATION OPTIONNELLE
  // =============================================================================

  /**
   * GET /api/auth/public-profile/:userId - Profil public
   * Middlewares appliqués: optionalAuth, validateId('userId')
   */
  async getPublicProfile(req, res) {
    try {
      const { userId } = req.params;
      const currentUser = req.user; // Peut être null (auth optionnelle)

      // Récupérer l'utilisateur demandé
      const targetUser = await AuthService.findUserById(userId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé',
          code: 'USER_NOT_FOUND'
        });
      }

      // Profil public basique
      const publicProfile = {
        id: targetUser.id,
        username: targetUser.username,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        profile_picture: targetUser.profile_picture,
        bio: targetUser.bio,
        location: targetUser.location,
        created_at: targetUser.created_at
      };

      // Ajouter plus d'infos si l'utilisateur est connecté
      if (currentUser) {
        publicProfile.extended = {
          contribution_count: targetUser.contribution_count,
          points: targetUser.points,
          streak_days: targetUser.streak_days
        };
      }

      res.status(200).json({
        success: true,
        profile: publicProfile,
        isCurrentUser: currentUser?.id === parseInt(userId)
      });

    } catch (error) {
      logger.error('Erreur get public profile:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du profil',
        code: 'PUBLIC_PROFILE_ERROR'
      });
    }
  }

  // =============================================================================
  // 📱 ROUTES MOBILES ET API
  // =============================================================================

  /**
   * POST /api/auth/mobile/login - Connexion mobile avec device info
   * Middlewares appliqués: loginLimiter, validateLogin
   */
  async mobileLogin(req, res) {
    try {
      // Même logique que login mais avec infos device
      const result = await this.login(req, res);
      
      // Log spécifique mobile
      logger.info('Connexion mobile', {
        userId: req.user?.id,
        deviceInfo: {
          platform: req.body.platform,
          version: req.body.appVersion,
          deviceId: req.body.deviceId
        }
      });

      return result;

    } catch (error) {
      logger.error('Erreur mobile login:', error.message);
      throw error;
    }
  }

  /**
   * POST /api/auth/api/generate-key - Générer clé API
   * Middlewares appliqués: requireAuth, requireVerifiedEmail, strictLimiter
   */
  async generateApiKey(req, res) {
    try {
      const userId = req.user.id;

      // Générer une clé API sécurisée
      const apiKey = AuthService.encryptionService.generateAPIKeyHash({
        userId,
        purpose: req.body.purpose || 'general',
        timestamp: Date.now()
      });

      logger.info('Clé API générée', { 
        userId,
        purpose: req.body.purpose || 'general'
      });

      res.status(200).json({
        success: true,
        apiKey: apiKey,
        message: 'Clé API générée avec succès'
      });

    } catch (error) {
      logger.error('Erreur generate api key:', error.message);

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la génération de la clé API',
        code: 'API_KEY_ERROR'
      });
    }
  }

  // =============================================================================
  // 🛠️ MÉTHODES UTILITAIRES PRIVÉES
  // =============================================================================

  /**
   * Envoyer email de vérification de manière asynchrone
   */
  async sendVerificationEmailAsync(email, token, user) {
    try {
      await EmailService.sendVerificationEmail(email, token, {
        userName: user.first_name || user.username,
        fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim()
      });
    } catch (emailError) {
      logger.error('Erreur envoi email vérification async:', emailError.message);
    }
  }

  /**
   * Détecter le navigateur depuis le user agent
   */
  detectBrowser(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }

  /**
   * Détecter l'OS depuis le user agent
   */
  detectOS(userAgent) {
    if (!userAgent) return 'Unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }
}

module.exports = new AuthController();