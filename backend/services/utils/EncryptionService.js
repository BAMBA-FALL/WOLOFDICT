// =============================================================================
// 🔐 WOLOFDICT - ENCRYPTIONSERVICE COMPLET
// Service de chiffrement et sécurité pour données sensibles
// =============================================================================

const logger = require('./LoggerService');
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.isInitialized = false;
    this.name = 'EncryptionService';
    this.bcrypt = null;
    this.jwt = null;
    
    // Configuration par défaut
    this.config = {
      algorithm: 'aes-256-gcm',
      keyLength: 32,
      ivLength: 16,
      tagLength: 16,
      saltRounds: 12,
      jwtExpiresIn: '24h',
      jwtRefreshExpiresIn: '7d'
    };
    
    // Clés de chiffrement
    this.keys = {
      encryption: null,
      jwt: null
    };
    
    // Statistiques
    this.stats = {
      encryptions: 0,
      decryptions: 0,
      hashes: 0,
      tokens: 0,
      errors: 0
    };
  }

  async initialize() {
    try {
      // Configuration du service
      await this.setup();
      
      // Charger les dépendances
      await this.loadDependencies();
      
      // Initialiser les clés
      await this.initializeKeys();
      
      this.isInitialized = true;
      logger.info('EncryptionService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation EncryptionService:', error.message);
      throw error;
    }
  }

  async setup() {
    // Charger la configuration depuis les variables d'environnement
    this.config = {
      ...this.config,
      algorithm: process.env.ENCRYPTION_ALGORITHM || this.config.algorithm,
      saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || this.config.saltRounds,
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || this.config.jwtExpiresIn,
      jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || this.config.jwtRefreshExpiresIn
    };
    
    logger.debug('Configuration EncryptionService terminée');
  }

  async loadDependencies() {
    try {
      // Charger bcrypt pour le hashing des mots de passe
      this.bcrypt = require('bcrypt');
      logger.info('bcrypt chargé pour le hashing des mots de passe');
    } catch (error) {
      logger.warn('bcrypt non disponible, hashing basique activé');
    }

    try {
      // Charger jsonwebtoken pour les JWT
      this.jwt = require('jsonwebtoken');
      logger.info('jsonwebtoken chargé pour les tokens JWT');
    } catch (error) {
      logger.warn('jsonwebtoken non disponible, tokens basiques activés');
    }
  }

  async initializeKeys() {
    // Clé de chiffrement principal
    this.keys.encryption = process.env.ENCRYPTION_KEY || this.generateSecureKey();
    
    // Clé JWT
    this.keys.jwt = process.env.JWT_SECRET || this.generateSecureKey();
    
    // Vérifier que les clés ont la bonne longueur
    if (Buffer.from(this.keys.encryption, 'hex').length !== this.config.keyLength) {
      this.keys.encryption = this.generateSecureKey();
      logger.warn('Clé de chiffrement générée automatiquement (définir ENCRYPTION_KEY)');
    }
    
    logger.info('Clés de chiffrement initialisées');
  }

  // =============================================================================
  // 🔐 CHIFFREMENT SYMÉTRIQUE
  // =============================================================================

  /**
   * 🔒 Chiffrer des données sensibles
   */
  encrypt(data, customKey = null) {
    try {
      if (!data) {
        throw new Error('Données à chiffrer requises');
      }

      const key = customKey ? Buffer.from(customKey, 'hex') : Buffer.from(this.keys.encryption, 'hex');
      const iv = crypto.randomBytes(this.config.ivLength);
      
      const cipher = crypto.createCipher(this.config.algorithm, key);
      cipher.setAAD(iv);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combiner IV + tag + données chiffrées
      const result = {
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        data: encrypted
      };
      
      this.stats.encryptions++;
      
      logger.debug('Données chiffrées avec succès');
      return Buffer.from(JSON.stringify(result)).toString('base64');
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur chiffrement:', error.message);
      throw error;
    }
  }

  /**
   * 🔓 Déchiffrer des données
   */
  decrypt(encryptedData, customKey = null) {
    try {
      if (!encryptedData) {
        throw new Error('Données chiffrées requises');
      }

      const key = customKey ? Buffer.from(customKey, 'hex') : Buffer.from(this.keys.encryption, 'hex');
      
      // Décoder et parser les données
      const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString('utf8'));
      const { iv, tag, data } = parsed;
      
      const decipher = crypto.createDecipher(this.config.algorithm, key);
      decipher.setAAD(Buffer.from(iv, 'hex'));
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
      
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      this.stats.decryptions++;
      
      logger.debug('Données déchiffrées avec succès');
      return JSON.parse(decrypted);
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur déchiffrement:', error.message);
      throw error;
    }
  }

  /**
   * 🔐 Chiffrer un champ spécifique (pour BDD)
   */
  encryptField(value) {
    if (!value || typeof value !== 'string') {
      return value;
    }
    
    try {
      return this.encrypt({ value });
    } catch (error) {
      logger.error('Erreur chiffrement champ:', error.message);
      return value; // Retourner la valeur originale en cas d'erreur
    }
  }

  /**
   * 🔓 Déchiffrer un champ spécifique
   */
  decryptField(encryptedValue) {
    if (!encryptedValue || typeof encryptedValue !== 'string') {
      return encryptedValue;
    }
    
    try {
      const decrypted = this.decrypt(encryptedValue);
      return decrypted.value;
    } catch (error) {
      logger.error('Erreur déchiffrement champ:', error.message);
      return encryptedValue; // Retourner la valeur originale en cas d'erreur
    }
  }

  // =============================================================================
  // 🔑 HASHING (MOTS DE PASSE)
  // =============================================================================

  /**
   * 🔐 Hasher un mot de passe
   */
  async hashPassword(password) {
    try {
      if (!password) {
        throw new Error('Mot de passe requis');
      }

      if (this.bcrypt) {
        const hash = await this.bcrypt.hash(password, this.config.saltRounds);
        this.stats.hashes++;
        return hash;
      } else {
        // Fallback basique avec crypto natif
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
        this.stats.hashes++;
        return `${salt}:${hash}`;
      }
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur hashing mot de passe:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Vérifier un mot de passe
   */
  async verifyPassword(password, hash) {
    try {
      if (!password || !hash) {
        return false;
      }

      if (this.bcrypt) {
        return await this.bcrypt.compare(password, hash);
      } else {
        // Fallback basique
        const [salt, storedHash] = hash.split(':');
        const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
        return computedHash === storedHash;
      }
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur vérification mot de passe:', error.message);
      return false;
    }
  }

  // =============================================================================
  // 🎫 TOKENS JWT
  // =============================================================================

  /**
   * 🎫 Générer un token JWT
   */
  generateToken(payload, options = {}) {
    try {
      const tokenPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000)
      };

      const tokenOptions = {
        expiresIn: options.expiresIn || this.config.jwtExpiresIn,
        issuer: options.issuer || 'WolofDict',
        audience: options.audience || 'wolofdict-users'
      };

      if (this.jwt) {
        const token = this.jwt.sign(tokenPayload, this.keys.jwt, tokenOptions);
        this.stats.tokens++;
        return token;
      } else {
        // Fallback basique
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
        const payload64 = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
        const signature = crypto.createHmac('sha256', this.keys.jwt)
          .update(`${header}.${payload64}`)
          .digest('base64url');
        
        this.stats.tokens++;
        return `${header}.${payload64}.${signature}`;
      }
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur génération token:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Vérifier un token JWT
   */
  verifyToken(token, options = {}) {
    try {
      if (!token) {
        throw new Error('Token requis');
      }

      if (this.jwt) {
        const decoded = this.jwt.verify(token, this.keys.jwt, {
          issuer: options.issuer || 'WolofDict',
          audience: options.audience || 'wolofdict-users'
        });
        return { valid: true, payload: decoded };
      } else {
        // Fallback basique
        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) {
          throw new Error('Format token invalide');
        }

        const expectedSignature = crypto.createHmac('sha256', this.keys.jwt)
          .update(`${header}.${payload}`)
          .digest('base64url');

        if (signature !== expectedSignature) {
          throw new Error('Signature token invalide');
        }

        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
        
        // Vérifier l'expiration
        if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
          throw new Error('Token expiré');
        }

        return { valid: true, payload: decodedPayload };
      }
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Erreur vérification token:', error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * 🔄 Générer une paire de tokens (access + refresh)
   */
  generateTokenPair(payload) {
    try {
      const accessToken = this.generateToken(payload, {
        expiresIn: this.config.jwtExpiresIn
      });

      const refreshToken = this.generateToken(
        { userId: payload.userId, type: 'refresh' },
        { expiresIn: this.config.jwtRefreshExpiresIn }
      );

      return {
        accessToken,
        refreshToken,
        expiresIn: this.config.jwtExpiresIn
      };
      
    } catch (error) {
      logger.error('Erreur génération paire tokens:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🎲 GÉNÉRATION DE CLÉS ET TOKENS
  // =============================================================================

  /**
   * 🔑 Générer une clé sécurisée
   */
  generateSecureKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 🎲 Générer un token aléatoire
   */
  generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 🔢 Générer un code numérique
   */
  generateNumericCode(length = 6) {
    const digits = '0123456789';
    let code = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      code += digits[randomIndex];
    }
    
    return code;
  }

  /**
   * 📧 Générer un token de vérification email
   */
  generateEmailVerificationToken(email, userId) {
    const payload = {
      email,
      userId,
      type: 'email_verification',
      timestamp: Date.now()
    };
    
    return this.generateToken(payload, { expiresIn: '24h' });
  }

  /**
   * 🔐 Générer un token de reset password
   */
  generatePasswordResetToken(userId) {
    const payload = {
      userId,
      type: 'password_reset',
      timestamp: Date.now()
    };
    
    return this.generateToken(payload, { expiresIn: '1h' });
  }

  // =============================================================================
  // 🛡️ SÉCURITÉ AVANCÉE
  // =============================================================================

  /**
   * 🔐 Chiffrer des données sensibles avec rotation de clés
   */
  encryptWithRotation(data, keyVersion = 'current') {
    try {
      const metadata = {
        version: keyVersion,
        timestamp: Date.now(),
        algorithm: this.config.algorithm
      };

      const encryptedData = this.encrypt(data);
      const encryptedMetadata = this.encrypt(metadata);

      return {
        data: encryptedData,
        metadata: encryptedMetadata
      };
      
    } catch (error) {
      logger.error('Erreur chiffrement avec rotation:', error.message);
      throw error;
    }
  }

  /**
   * 📝 Créer une signature HMAC
   */
  createSignature(data, secret = null) {
    try {
      const key = secret || this.keys.encryption;
      const hmac = crypto.createHmac('sha256', key);
      hmac.update(typeof data === 'string' ? data : JSON.stringify(data));
      return hmac.digest('hex');
    } catch (error) {
      logger.error('Erreur création signature:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Vérifier une signature HMAC
   */
  verifySignature(data, signature, secret = null) {
    try {
      const expectedSignature = this.createSignature(data, secret);
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Erreur vérification signature:', error.message);
      return false;
    }
  }

  /**
   * 🎯 Générer un hash sécurisé pour API keys
   */
  generateAPIKeyHash(keyData) {
    try {
      const data = {
        ...keyData,
        timestamp: Date.now(),
        random: this.generateSecureKey(16)
      };
      
      return this.createSignature(data);
    } catch (error) {
      logger.error('Erreur génération hash API key:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🛠️ UTILITAIRES DE SÉCURITÉ
  // =============================================================================

  /**
   * 🔒 Masquer des données sensibles
   */
  maskSensitiveData(data, fields = ['password', 'token', 'secret']) {
    try {
      if (typeof data !== 'object' || !data) {
        return data;
      }

      const masked = { ...data };
      
      fields.forEach(field => {
        if (masked[field]) {
          const value = masked[field].toString();
          if (value.length <= 4) {
            masked[field] = '***';
          } else {
            const start = value.substring(0, 2);
            const end = value.substring(value.length - 2);
            masked[field] = `${start}${'*'.repeat(value.length - 4)}${end}`;
          }
        }
      });

      return masked;
    } catch (error) {
      logger.error('Erreur masquage données:', error.message);
      return data;
    }
  }

  /**
   * 🔍 Valider la force d'un mot de passe
   */
  validatePasswordStrength(password) {
    const result = {
      score: 0,
      strength: 'very_weak',
      feedback: []
    };

    if (!password) {
      result.feedback.push('Mot de passe requis');
      return result;
    }

    // Longueur
    if (password.length >= 8) result.score += 1;
    if (password.length >= 12) result.score += 1;
    if (password.length >= 16) result.score += 1;

    // Complexité
    if (/[a-z]/.test(password)) result.score += 1;
    if (/[A-Z]/.test(password)) result.score += 1;
    if (/\d/.test(password)) result.score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) result.score += 1;

    // Entropie
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) result.score += 1;

    // Déterminer la force
    if (result.score <= 2) {
      result.strength = 'very_weak';
      result.feedback.push('Mot de passe très faible');
    } else if (result.score <= 4) {
      result.strength = 'weak';
      result.feedback.push('Mot de passe faible');
    } else if (result.score <= 6) {
      result.strength = 'medium';
      result.feedback.push('Mot de passe moyen');
    } else if (result.score <= 7) {
      result.strength = 'strong';
      result.feedback.push('Mot de passe fort');
    } else {
      result.strength = 'very_strong';
      result.feedback.push('Mot de passe très fort');
    }

    // Suggestions d'amélioration
    if (password.length < 12) {
      result.feedback.push('Utilisez au moins 12 caractères');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      result.feedback.push('Ajoutez des caractères spéciaux');
    }

    return result;
  }

  /**
   * 🧹 Nettoyer les données sensibles de la mémoire
   */
  secureClear(obj) {
    try {
      if (typeof obj === 'string') {
        // Pour les chaînes, on ne peut pas vraiment les "effacer" en JS
        // mais on peut au moins les remplacer
        obj = '*'.repeat(obj.length);
      } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'string') {
            obj[key] = '*'.repeat(obj[key].length);
          } else {
            delete obj[key];
          }
        });
      }
    } catch (error) {
      logger.warn('Erreur nettoyage sécurisé:', error.message);
    }
  }

  // =============================================================================
  // 📊 MONITORING ET STATISTIQUES
  // =============================================================================

  /**
   * 📊 Obtenir les statistiques du service
   */
  getStats() {
    return {
      ...this.stats,
      uptime: this.isInitialized ? Date.now() - this.stats.startTime : 0,
      error_rate: this.stats.encryptions + this.stats.decryptions > 0 
        ? (this.stats.errors / (this.stats.encryptions + this.stats.decryptions + this.stats.hashes + this.stats.tokens)) * 100 
        : 0
    };
  }

  /**
   * 🔧 Diagnostic du service
   */
  runDiagnostic() {
    const diagnostic = {
      service_health: 'healthy',
      dependencies: {
        bcrypt: !!this.bcrypt,
        jwt: !!this.jwt,
        crypto: true
      },
      keys: {
        encryption_key_set: !!this.keys.encryption,
        jwt_key_set: !!this.keys.jwt
      },
      config: this.config,
      issues: []
    };

    // Vérifications
    if (!this.bcrypt) {
      diagnostic.issues.push('bcrypt non disponible - hashing basique activé');
    }
    
    if (!this.jwt) {
      diagnostic.issues.push('jsonwebtoken non disponible - tokens basiques activés');
    }

    if (this.keys.encryption === this.generateSecureKey()) {
      diagnostic.issues.push('Clé de chiffrement générée automatiquement - définir ENCRYPTION_KEY');
    }

    if (diagnostic.issues.length > 0) {
      diagnostic.service_health = 'degraded';
    }

    return diagnostic;
  }

  /**
   * 📋 Obtenir le statut du service
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      dependencies: {
        bcrypt: !!this.bcrypt,
        jwt: !!this.jwt
      },
      features: {
        encryption: true,
        password_hashing: true,
        jwt_tokens: true,
        secure_keys: true,
        signatures: true
      },
      stats: this.getStats(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🧹 Nettoyage du service
   */
  async cleanup() {
    // Nettoyer les clés sensibles
    this.secureClear(this.keys);
    
    // Reset des stats
    this.stats = {
      encryptions: 0,
      decryptions: 0,
      hashes: 0,
      tokens: 0,
      errors: 0
    };
    
    this.isInitialized = false;
    logger.info(this.name + ' nettoyé');
  }
}

module.exports = new EncryptionService();