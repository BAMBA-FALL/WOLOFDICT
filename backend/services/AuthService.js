// =============================================================================
// 🌍 WOLOFDICT - AUTH SERVICE COMPLET
// Service d'authentification avec EncryptionService intégré
// =============================================================================

const logger = require('./LoggerService');
const EncryptionService = require('./EncryptionService');

class AuthService {
  constructor() {
    this.isInitialized = false;
    this.name = 'AuthService';
    this.encryptionService = EncryptionService;
    this.models = null;
    this.blacklistedTokens = new Set();
    
    // Configuration
    this.config = {
      jwtExpires: process.env.JWT_EXPIRES || '24h',
      refreshExpires: process.env.REFRESH_TOKEN_EXPIRES || '7d',
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      lockoutDuration: parseInt(process.env.LOCKOUT_DURATION) || 900000, // 15 minutes
      passwordResetExpires: 3600000, // 1 heure
      emailVerificationExpires: 86400000 // 24 heures
    };
    
    // Cache des tentatives de connexion
    this.loginAttempts = new Map();
  }

  async initialize() {
    try {
      // Initialiser EncryptionService si nécessaire
      if (!this.encryptionService.isInitialized) {
        await this.encryptionService.initialize();
      }

      // Import des modèles Sequelize
      try {
        this.models = require('../models');
        logger.info('Modèles Sequelize chargés dans AuthService');
      } catch (error) {
        logger.warn('Modèles Sequelize non disponibles, mode mock activé');
      }
      
      // Démarrer le nettoyage automatique
      this.startCleanupTasks();
      
      this.isInitialized = true;
      logger.info('AuthService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation AuthService:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🔐 AUTHENTIFICATION PRINCIPALE
  // =============================================================================

  async login(email, password, options = {}) {
    try {
      const clientIP = options.clientIP || 'unknown';
      
      // Vérifier les tentatives de connexion
      if (this.isAccountLocked(email)) {
        throw new Error('Compte temporairement verrouillé suite à trop de tentatives');
      }

      // Rechercher l'utilisateur
      const user = await this.findUserByEmail(email);
      if (!user) {
        this.recordFailedAttempt(email);
        throw new Error('Identifiants invalides');
      }

      // Vérifier si l'utilisateur est actif
      if (user.status === 'suspended') {
        throw new Error('Compte suspendu - contactez l\'administration');
      }

      if (user.status === 'deleted') {
        throw new Error('Compte supprimé');
      }

      // Vérifier le mot de passe avec EncryptionService
      const isValid = await this.encryptionService.verifyPassword(password, user.password);
      if (!isValid) {
        this.recordFailedAttempt(email);
        throw new Error('Identifiants invalides');
      }

      // Réinitialiser les tentatives en cas de succès
      this.clearFailedAttempts(email);

      // Mettre à jour la dernière connexion
      await this.updateLastLogin(user.id, clientIP);

      // Générer les tokens avec EncryptionService
      const tokens = this.generateTokens(user);
      
      logger.info('Connexion réussie', { 
        email: this.encryptionService.maskSensitiveData({ email }).email,
        userId: user.id,
        clientIP 
      });
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: this.config.jwtExpires
      };
      
    } catch (error) {
      logger.error('Erreur login:', error.message);
      throw error;
    }
  }

  async register(userData, options = {}) {
    try {
      const { email, password, firstName, lastName, phoneNumber } = userData;
      const clientIP = options.clientIP || 'unknown';

      // Vérifier si l'utilisateur existe
      const existing = await this.findUserByEmail(email);
      if (existing) {
        throw new Error('Cette adresse email est déjà utilisée');
      }

      // Valider la force du mot de passe avec EncryptionService
      const passwordValidation = this.encryptionService.validatePasswordStrength(password);
      if (passwordValidation.strength === 'very_weak' || passwordValidation.strength === 'weak') {
        throw new Error(`Mot de passe trop faible: ${passwordValidation.feedback.join(', ')}`);
      }

      // Hasher le mot de passe avec EncryptionService
      const hashedPassword = await this.encryptionService.hashPassword(password);
      
      // Générer token de vérification email avec EncryptionService
      const verificationToken = this.encryptionService.generateEmailVerificationToken(email, null);

      // Chiffrer les données sensibles
      const encryptedPhone = phoneNumber ? this.encryptionService.encryptField(phoneNumber) : null;

      // Créer l'utilisateur
      const user = await this.createUser({
        email,
        password: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        phone_number: encryptedPhone,
        is_verified: false,
        email_verification_token: verificationToken,
        status: 'active',
        role: 'user',
        registration_ip: clientIP,
        created_at: new Date(),
        last_login_at: null
      });

      // Générer les tokens d'authentification
      const tokens = this.generateTokens(user);
      
      logger.info('Nouvel utilisateur créé', { 
        email: this.encryptionService.maskSensitiveData({ email }).email,
        userId: user.id,
        clientIP 
      });
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        verificationToken,
        message: 'Compte créé avec succès. Vérifiez votre email.'
      };
      
    } catch (error) {
      logger.error('Erreur register:', error.message);
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Vérifier si le token est blacklisté
      if (this.blacklistedTokens.has(refreshToken)) {
        throw new Error('Token révoqué');
      }

      // Vérifier le token avec EncryptionService
      const tokenValidation = this.encryptionService.verifyToken(refreshToken);
      if (!tokenValidation.valid) {
        throw new Error('Token invalide: ' + tokenValidation.error);
      }

      const decoded = tokenValidation.payload;
      const user = await this.findUserById(decoded.userId);
      
      if (!user || user.status !== 'active') {
        throw new Error('Utilisateur non trouvé ou inactif');
      }

      // Générer nouveaux tokens
      const tokens = this.generateTokens(user);
      
      // Blacklister l'ancien refresh token pour sécurité
      this.blacklistedTokens.add(refreshToken);
      
      return {
        success: true,
        user: this.sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
      
    } catch (error) {
      logger.error('Erreur refresh token:', error.message);
      throw error;
    }
  }

  async logout(refreshToken, options = {}) {
    try {
      if (refreshToken) {
        this.blacklistedTokens.add(refreshToken);
        logger.info('Token blacklisté pour logout', { 
          clientIP: options.clientIP || 'unknown'
        });
      }
      return { 
        success: true, 
        message: 'Déconnexion réussie' 
      };
    } catch (error) {
      logger.error('Erreur logout:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 📧 VÉRIFICATION EMAIL
  // =============================================================================

  async verifyEmail(token) {
    try {
      // Vérifier le token avec EncryptionService
      const tokenValidation = this.encryptionService.verifyToken(token);
      if (!tokenValidation.valid) {
        throw new Error('Token de vérification invalide ou expiré');
      }

      const decoded = tokenValidation.payload;
      
      if (decoded.type !== 'email_verification') {
        throw new Error('Type de token invalide');
      }

      const user = await this.findUserByEmail(decoded.email);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      if (user.is_verified) {
        return { 
          success: true, 
          message: 'Email déjà vérifié',
          alreadyVerified: true 
        };
      }

      await this.updateUser(user.id, { 
        is_verified: true, 
        email_verification_token: null,
        email_verified_at: new Date()
      });
      
      logger.info('Email vérifié', { 
        email: this.encryptionService.maskSensitiveData({ email: user.email }).email,
        userId: user.id 
      });
      
      return { 
        success: true, 
        message: 'Email vérifié avec succès' 
      };
      
    } catch (error) {
      logger.error('Erreur vérification email:', error.message);
      throw error;
    }
  }

  async resendVerificationEmail(email) {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      if (user.is_verified) {
        return { 
          success: true, 
          message: 'Email déjà vérifié' 
        };
      }

      // Générer nouveau token avec EncryptionService
      const verificationToken = this.encryptionService.generateEmailVerificationToken(email, user.id);
      
      await this.updateUser(user.id, {
        email_verification_token: verificationToken
      });

      logger.info('Token de vérification email regénéré', { 
        email: this.encryptionService.maskSensitiveData({ email }).email,
        userId: user.id 
      });

      return {
        success: true,
        verificationToken,
        message: 'Nouveau lien de vérification envoyé'
      };

    } catch (error) {
      logger.error('Erreur renvoi vérification email:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🔑 RÉINITIALISATION MOT DE PASSE
  // =============================================================================

  async generatePasswordResetToken(email) {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) {
        // Pour la sécurité, ne pas révéler si l'email existe
        return { 
          success: true, 
          message: 'Si cet email existe, un lien de réinitialisation a été envoyé' 
        };
      }
      
      // Générer token avec EncryptionService
      const resetToken = this.encryptionService.generatePasswordResetToken(user.id);
      
      // Sauvegarder le token en DB pour sécurité
      await this.updateUser(user.id, {
        password_reset_token: resetToken,
        password_reset_expires: new Date(Date.now() + this.config.passwordResetExpires)
      });
      
      logger.info('Token reset password généré', { 
        email: this.encryptionService.maskSensitiveData({ email }).email,
        userId: user.id 
      });
      
      return { 
        success: true,
        resetToken, 
        user: this.sanitizeUser(user),
        message: 'Lien de réinitialisation envoyé'
      };
      
    } catch (error) {
      logger.error('Erreur génération token reset:', error.message);
      throw error;
    }
  }

  async resetPassword(token, newPassword) {
    try {
      // Vérifier le token avec EncryptionService
      const tokenValidation = this.encryptionService.verifyToken(token);
      if (!tokenValidation.valid) {
        throw new Error('Token de réinitialisation invalide ou expiré');
      }

      const decoded = tokenValidation.payload;
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Type de token invalide');
      }

      const user = await this.findUserById(decoded.userId);
      if (!user || user.password_reset_token !== token) {
        throw new Error('Token invalide ou expiré');
      }

      if (new Date() > user.password_reset_expires) {
        throw new Error('Token expiré');
      }

      // Valider le nouveau mot de passe
      const passwordValidation = this.encryptionService.validatePasswordStrength(newPassword);
      if (passwordValidation.strength === 'very_weak' || passwordValidation.strength === 'weak') {
        throw new Error(`Nouveau mot de passe trop faible: ${passwordValidation.feedback.join(', ')}`);
      }

      // Hasher le nouveau mot de passe avec EncryptionService
      const hashedPassword = await this.encryptionService.hashPassword(newPassword);
      
      await this.updateUser(user.id, {
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
        password_changed_at: new Date()
      });
      
      logger.info('Mot de passe réinitialisé', { 
        userId: user.id 
      });
      
      return { 
        success: true, 
        message: 'Mot de passe mis à jour avec succès' 
      };
      
    } catch (error) {
      logger.error('Erreur reset password:', error.message);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Vérifier le mot de passe actuel avec EncryptionService
      const isValid = await this.encryptionService.verifyPassword(currentPassword, user.password);
      if (!isValid) {
        throw new Error('Mot de passe actuel incorrect');
      }

      // Valider le nouveau mot de passe
      const passwordValidation = this.encryptionService.validatePasswordStrength(newPassword);
      if (passwordValidation.strength === 'very_weak' || passwordValidation.strength === 'weak') {
        throw new Error(`Nouveau mot de passe trop faible: ${passwordValidation.feedback.join(', ')}`);
      }

      // Hasher le nouveau mot de passe avec EncryptionService
      const hashedPassword = await this.encryptionService.hashPassword(newPassword);
      
      await this.updateUser(userId, {
        password: hashedPassword,
        password_changed_at: new Date()
      });
      
      logger.info('Mot de passe changé', { userId });
      return { 
        success: true, 
        message: 'Mot de passe mis à jour avec succès' 
      };
      
    } catch (error) {
      logger.error('Erreur changement password:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🎫 GESTION DES TOKENS
  // =============================================================================

  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role || 'user',
      isVerified: user.is_verified,
      hasSubscription: !!user.subscription
    };

    // Utiliser EncryptionService pour générer les tokens
    return this.encryptionService.generateTokenPair(payload);
  }

  verifyToken(token) {
    try {
      if (this.blacklistedTokens.has(token)) {
        throw new Error('Token révoqué');
      }
      
      // Utiliser EncryptionService pour vérifier
      const validation = this.encryptionService.verifyToken(token);
      if (!validation.valid) {
        throw new Error('Token invalide: ' + validation.error);
      }
      
      return validation.payload;
    } catch (error) {
      throw new Error('Token invalide: ' + error.message);
    }
  }

  // =============================================================================
  // 🔒 SÉCURITÉ ET PROTECTION
  // =============================================================================

  isAccountLocked(email) {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;
    
    return attempts.count >= this.config.maxLoginAttempts && 
           (Date.now() - attempts.lastAttempt) < this.config.lockoutDuration;
  }

  recordFailedAttempt(email) {
    const now = Date.now();
    const attempts = this.loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
    
    // Reset si dernier échec > lockoutDuration
    if ((now - attempts.lastAttempt) > this.config.lockoutDuration) {
      attempts.count = 0;
    }
    
    attempts.count++;
    attempts.lastAttempt = now;
    this.loginAttempts.set(email, attempts);
    
    logger.warn('Tentative de connexion échouée', { 
      email: this.encryptionService.maskSensitiveData({ email }).email,
      attempts: attempts.count 
    });
  }

  clearFailedAttempts(email) {
    this.loginAttempts.delete(email);
  }

  sanitizeUser(user) {
    const clean = { ...user.toJSON ? user.toJSON() : user };
    
    // Supprimer les champs sensibles
    const sensitiveFields = [
      'password', 
      'password_reset_token', 
      'email_verification_token',
      'registration_ip'
    ];
    
    sensitiveFields.forEach(field => delete clean[field]);
    
    // Déchiffrer les champs chiffrés si nécessaire
    if (clean.phone_number) {
      try {
        clean.phone_number = this.encryptionService.decryptField(clean.phone_number);
      } catch (error) {
        // Si déchiffrement échoue, masquer le champ
        clean.phone_number = this.encryptionService.maskSensitiveData({ phone_number: clean.phone_number }).phone_number;
      }
    }
    
    return clean;
  }

  // =============================================================================
  // 🗃️ MÉTHODES BASE DE DONNÉES
  // =============================================================================

  async findUserByEmail(email) {
    try {
      if (this.models && this.models.User) {
        return await this.models.User.findOne({ 
          where: { email },
          include: [
            { 
              model: this.models.Subscription, 
              as: 'subscription',
              include: [{ model: this.models.Plan, as: 'plan' }]
            }
          ]
        });
      } else {
        logger.warn('Mode mock: findUserByEmail');
        return null;
      }
    } catch (error) {
      logger.error('Erreur findUserByEmail:', error.message);
      throw error;
    }
  }

  async findUserById(id) {
    try {
      if (this.models && this.models.User) {
        return await this.models.User.findByPk(id, {
          include: [
            { 
              model: this.models.Subscription, 
              as: 'subscription',
              include: [{ model: this.models.Plan, as: 'plan' }]
            }
          ]
        });
      } else {
        logger.warn('Mode mock: findUserById');
        return null;
      }
    } catch (error) {
      logger.error('Erreur findUserById:', error.message);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      if (this.models && this.models.User) {
        const user = await this.models.User.create(userData);
        
        // Créer abonnement gratuit automatique
        if (this.models.Plan && this.models.Subscription) {
          const freePlan = await this.models.Plan.findOne({ where: { slug: 'free' } });
          if (freePlan) {
            await this.models.Subscription.create({
              user_id: user.id,
              plan_id: freePlan.id,
              status: 'active',
              starts_at: new Date()
            });
          }
        }
        
        return user;
      } else {
        logger.warn('Mode mock: createUser');
        return { id: Date.now(), ...userData };
      }
    } catch (error) {
      logger.error('Erreur createUser:', error.message);
      throw error;
    }
  }

  async updateUser(id, updates) {
    try {
      if (this.models && this.models.User) {
        await this.models.User.update(updates, { where: { id } });
        return await this.findUserById(id);
      } else {
        logger.warn('Mode mock: updateUser');
        return { id, ...updates };
      }
    } catch (error) {
      logger.error('Erreur updateUser:', error.message);
      throw error;
    }
  }

  async updateLastLogin(userId, clientIP) {
    try {
      return await this.updateUser(userId, { 
        last_login_at: new Date(),
        last_login_ip: clientIP
      });
    } catch (error) {
      logger.error('Erreur updateLastLogin:', error.message);
      // Non-bloquant
    }
  }

  // =============================================================================
  // 🧹 MAINTENANCE ET NETTOYAGE
  // =============================================================================

  startCleanupTasks() {
    // Nettoyer les tokens blacklistés expirés (toutes les heures)
    setInterval(() => {
      this.cleanupBlacklistedTokens();
    }, 3600000);

    // Nettoyer les tentatives de connexion anciennes (toutes les 4 heures)
    setInterval(() => {
      this.cleanupLoginAttempts();
    }, 14400000);
  }

  cleanupBlacklistedTokens() {
    const initialSize = this.blacklistedTokens.size;
    
    for (const token of this.blacklistedTokens) {
      try {
        const validation = this.encryptionService.verifyToken(token);
        if (!validation.valid) {
          this.blacklistedTokens.delete(token);
        }
      } catch (error) {
        // Token expiré, on peut le supprimer
        this.blacklistedTokens.delete(token);
      }
    }
    
    const cleaned = initialSize - this.blacklistedTokens.size;
    if (cleaned > 0) {
      logger.debug('Tokens blacklistés nettoyés:', cleaned);
    }
  }

  cleanupLoginAttempts() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [email, attempts] of this.loginAttempts.entries()) {
      if ((now - attempts.lastAttempt) > this.config.lockoutDuration) {
        this.loginAttempts.delete(email);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug('Tentatives de connexion nettoyées:', cleaned);
    }
  }

  // =============================================================================
  // 📊 STATUT ET DIAGNOSTIC
  // =============================================================================

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasModels: !!this.models,
      hasEncryptionService: !!this.encryptionService.isInitialized,
      security: {
        blacklistedTokensCount: this.blacklistedTokens.size,
        activeLoginAttempts: this.loginAttempts.size,
        maxLoginAttempts: this.config.maxLoginAttempts,
        lockoutDuration: this.config.lockoutDuration
      },
      features: {
        password_hashing: true,
        jwt_tokens: true,
        email_verification: true,
        password_reset: true,
        account_lockout: true,
        token_blacklisting: true,
        field_encryption: true
      },
      timestamp: new Date().toISOString()
    };
  }

  async cleanup() {
    // Nettoyer les données sensibles
    this.encryptionService.secureClear(this.blacklistedTokens);
    this.encryptionService.secureClear(this.loginAttempts);
    
    this.blacklistedTokens.clear();
    this.loginAttempts.clear();
    this.isInitialized = false;
    
    logger.info(this.name + ' nettoyé');
  }
}

module.exports = new AuthService();