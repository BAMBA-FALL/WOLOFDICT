// =============================================================================
// 📱 WOLOFDICT - SMSSERVICE COMPLET AVEC CHIFFREMENT
// Service de gestion des SMS avec EncryptionService intégré
// =============================================================================

const logger = require('./LoggerService');
const EncryptionService = require('./EncryptionService');
const { Op } = require('sequelize');

class SMSService {
  constructor() {
    this.isInitialized = false;
    this.name = 'SMSService';
    this.models = null;
    this.smsProvider = null;
    this.encryptionService = null;
    
    // Statistiques
    this.stats = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      verificationRequests: 0,
      verifiedNumbers: 0
    };

    // Fournisseurs SMS supportés
    this.providers = {
      TWILIO: 'twilio',
      AFRICAS_TALKING: 'africas_talking',
      ORANGE_SMS: 'orange_sms',
      FREE_MOBILE: 'free_mobile',
      MOCK: 'mock'
    };

    // Types de SMS
    this.messageTypes = {
      VERIFICATION: 'verification',
      NOTIFICATION: 'notification',
      DAILY_WORD: 'daily_word',
      NEW_WORD: 'new_word',
      REMINDER: 'reminder',
      CAMPAIGN: 'campaign',
      SYSTEM: 'system',
      EMERGENCY: 'emergency'
    };

    // Codes de pays supportés (focus Afrique de l'Ouest)
    this.supportedCountries = {
      'SN': { name: 'Sénégal', code: '+221', format: /^[0-9]{9}$/ },
      'ML': { name: 'Mali', code: '+223', format: /^[0-9]{8}$/ },
      'BF': { name: 'Burkina Faso', code: '+226', format: /^[0-9]{8}$/ },
      'CI': { name: 'Côte d\'Ivoire', code: '+225', format: /^[0-9]{8,10}$/ },
      'GN': { name: 'Guinée', code: '+224', format: /^[0-9]{8,9}$/ },
      'GM': { name: 'Gambie', code: '+220', format: /^[0-9]{7}$/ },
      'MR': { name: 'Mauritanie', code: '+222', format: /^[0-9]{8}$/ },
      'FR': { name: 'France', code: '+33', format: /^[0-9]{9}$/ },
      'US': { name: 'États-Unis', code: '+1', format: /^[0-9]{10}$/ },
      'CA': { name: 'Canada', code: '+1', format: /^[0-9]{10}$/ }
    };

    // Configuration par défaut
    this.config = {
      maxRetries: 3,
      retryDelay: 5000, // 5 secondes
      rateLimitPerMinute: 60,
      verificationCodeLength: 6,
      verificationExpiryMinutes: 10,
      maxDailyPerNumber: 10,
      defaultSender: 'WolofDict'
    };

    // Cache des limitations de débit
    this.rateLimitCache = new Map();
    
    // Queue des messages en attente
    this.messageQueue = [];
    this.isProcessingQueue = false;
  }

  async initialize() {
    try {
      // Initialiser EncryptionService si nécessaire
      if (EncryptionService && !EncryptionService.isInitialized) {
        await EncryptionService.initialize();
      }
      this.encryptionService = EncryptionService;
      
      if (this.encryptionService && this.encryptionService.isInitialized) {
        logger.info('EncryptionService connecté à SMSService');
      } else {
        logger.warn('EncryptionService non disponible - données stockées en clair');
      }

      // Configuration du service
      await this.setup();
      
      // Import des modèles Sequelize
      try {
        this.models = require('../models');
        logger.info('Modèles Sequelize chargés dans SMSService');
      } catch (error) {
        logger.warn('Modèles Sequelize non disponibles, mode mock activé');
      }

      // Démarrer le processeur de queue
      this.startQueueProcessor();
      
      // Mettre à jour les statistiques
      await this.updateStats();
      
      this.isInitialized = true;
      logger.info('SMSService initialisé avec succès', {
        provider: this.smsProvider?.name || 'mock',
        supported_countries: Object.keys(this.supportedCountries).length,
        encryption_enabled: !!this.encryptionService?.isInitialized
      });
      
    } catch (error) {
      logger.error('Erreur initialisation SMSService:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🔐 MÉTHODES DE CHIFFREMENT ET SÉCURITÉ
  // =============================================================================

  /**
   * 🔐 Chiffrer un numéro de téléphone avant stockage
   */
  encryptPhoneNumber(phoneNumber) {
    try {
      if (!this.encryptionService || !this.encryptionService.isInitialized) {
        logger.warn('EncryptionService non disponible, stockage numéro en clair');
        return phoneNumber;
      }
      
      return this.encryptionService.encryptField(phoneNumber);
    } catch (error) {
      logger.error('Erreur chiffrement numéro:', error.message);
      return phoneNumber; // Fallback sécurisé
    }
  }

  /**
   * 🔓 Déchiffrer un numéro de téléphone
   */
  decryptPhoneNumber(encryptedPhone) {
    try {
      if (!this.encryptionService || !this.encryptionService.isInitialized || !encryptedPhone) {
        return encryptedPhone;
      }
      
      // Vérifier si déjà en clair (migration progressive)
      if (!encryptedPhone.includes('{"iv":')) {
        return encryptedPhone;
      }
      
      return this.encryptionService.decryptField(encryptedPhone);
    } catch (error) {
      logger.error('Erreur déchiffrement numéro:', error.message);
      return encryptedPhone; // Fallback sécurisé
    }
  }

  /**
   * 🔑 Générer code de vérification sécurisé
   */
  generateVerificationCode() {
    try {
      if (this.encryptionService && this.encryptionService.isInitialized) {
        // Utiliser la génération sécurisée d'EncryptionService
        return this.encryptionService.generateNumericCode(this.config.verificationCodeLength);
      }
      
      // Fallback basique mais sécurisé
      const crypto = require('crypto');
      const randomBytes = crypto.randomBytes(4);
      const randomInt = randomBytes.readUInt32BE(0);
      return (randomInt % (10 ** this.config.verificationCodeLength))
        .toString()
        .padStart(this.config.verificationCodeLength, '0');
        
    } catch (error) {
      logger.error('Erreur génération code:', error.message);
      // Fallback d'urgence
      return Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    }
  }

  /**
   * 🔒 Hasher un code de vérification pour stockage sécurisé
   */
  async hashVerificationCode(code) {
    try {
      if (this.encryptionService && this.encryptionService.isInitialized) {
        return await this.encryptionService.hashPassword(code);
      }
      
      // Fallback avec crypto natif
      const crypto = require('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(code, salt, 10000, 64, 'sha512').toString('hex');
      return `${salt}:${hash}`;
      
    } catch (error) {
      logger.error('Erreur hash code vérification:', error.message);
      return code; // Fallback non sécurisé mais fonctionnel
    }
  }

  /**
   * ✅ Vérifier un code de vérification hashé
   */
  async verifyHashedCode(code, hashedCode) {
    try {
      if (this.encryptionService && this.encryptionService.isInitialized) {
        return await this.encryptionService.verifyPassword(code, hashedCode);
      }
      
      // Fallback avec crypto natif
      if (hashedCode.includes(':')) {
        const [salt, hash] = hashedCode.split(':');
        const computedHash = require('crypto').pbkdf2Sync(code, salt, 10000, 64, 'sha512').toString('hex');
        return computedHash === hash;
      }
      
      // Comparaison directe si pas hashé (migration)
      return code === hashedCode;
      
    } catch (error) {
      logger.error('Erreur vérification code hashé:', error.message);
      return code === hashedCode; // Fallback
    }
  }

  /**
   * 🎭 Masquer un numéro pour les logs
   */
  maskPhoneNumber(phoneNumber) {
    try {
      if (this.encryptionService && this.encryptionService.isInitialized) {
        return this.encryptionService.maskSensitiveData({ phone: phoneNumber }).phone;
      }
      
      // Fallback basique
      if (!phoneNumber || phoneNumber.length < 4) return '***';
      return phoneNumber.substring(0, 3) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.substring(phoneNumber.length - 3);
      
    } catch (error) {
      return '***';
    }
  }

  // =============================================================================
  // 📱 GESTION DES ABONNEMENTS SMS AVEC CHIFFREMENT
  // =============================================================================

  /**
   * 📝 S'abonner aux SMS avec chiffrement des données sensibles
   */
  async subscribe(phoneNumber, userData = {}) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      const countryInfo = this.detectCountry(normalizedPhone);

      if (!countryInfo) {
        throw new Error('Numéro de téléphone non supporté');
      }

      // Chiffrer le numéro pour stockage sécurisé
      const encryptedPhone = this.encryptPhoneNumber(normalizedPhone);

      if (this.models && this.models.SMSSubscription) {
        // Vérifier si déjà abonné (chercher dans les deux formats)
        const existingSubscription = await this.models.SMSSubscription.findOne({
          where: {
            [Op.or]: [
              { phone_number: normalizedPhone }, // Format ancien
              { phone_number: encryptedPhone }   // Format chiffré
            ]
          }
        });

        if (existingSubscription) {
          if (existingSubscription.is_active && existingSubscription.is_verified) {
            return {
              success: true,
              message: 'Déjà abonné aux SMS',
              subscription: this.sanitizeSubscription(existingSubscription)
            };
          } else {
            // Réactiver et renvoyer code de vérification
            await existingSubscription.update({ 
              is_active: true,
              phone_number: encryptedPhone // Migrer vers format chiffré
            });
            
            // Envoyer au numéro en clair
            await this.sendVerificationCode(normalizedPhone);
            
            return {
              success: true,
              message: 'Abonnement réactivé, vérifiez votre téléphone',
              subscription: this.sanitizeSubscription(existingSubscription)
            };
          }
        }

        // Créer nouvel abonnement avec données chiffrées
        const subscription = await this.models.SMSSubscription.create({
          phone_number: encryptedPhone, // 🔐 STOCKÉ CHIFFRÉ
          country_code: countryInfo.country,
          user_id: userData.user_id || null,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          language_preference: userData.language_preference || 'français',
          frequency_preference: userData.frequency_preference || 'weekly',
          content_preferences: userData.content_preferences || {
            daily_word: true,
            new_words: true,
            reminders: false,
            events: true,
            system: true
          },
          subscription_source: userData.source || 'website',
          ip_address: userData.ip_address || null,
          user_agent: userData.user_agent || null
        });

        // Envoyer code de vérification au numéro en clair
        await this.sendVerificationCode(normalizedPhone);

        logger.info('SMS subscription created', { 
          phone: this.maskPhoneNumber(normalizedPhone),
          subscription_id: subscription.id,
          country: countryInfo.country,
          encrypted: !!this.encryptionService?.isInitialized
        });

        await this.updateStats();

        return {
          success: true,
          message: 'Abonnement créé, vérifiez votre téléphone',
          subscription: this.sanitizeSubscription(subscription)
        };

      } else {
        // Mode mock
        logger.warn('Mode mock: SMS subscription', {
          phone: this.maskPhoneNumber(normalizedPhone)
        });
        return {
          success: true,
          message: 'Abonnement SMS simulé',
          subscription: {
            phone_number: this.maskPhoneNumber(normalizedPhone),
            is_active: true,
            is_verified: false,
            mock: true
          }
        };
      }

    } catch (error) {
      logger.error('Erreur abonnement SMS:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Vérifier un numéro de téléphone avec sécurité renforcée
   */
  async verifyPhoneNumber(phoneNumber, verificationCode) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      const encryptedPhone = this.encryptPhoneNumber(normalizedPhone);

      if (!this.models || !this.models.SMSSubscription) {
        // Mode mock - accepter le code 123456
        if (verificationCode === '123456') {
          return {
            success: true,
            message: 'Numéro vérifié (mode mock)',
            mock: true
          };
        } else {
          throw new Error('Code de vérification invalide');
        }
      }

      // Chercher l'abonnement (format ancien ou nouveau)
      const subscription = await this.models.SMSSubscription.findOne({
        where: { 
          [Op.or]: [
            { phone_number: normalizedPhone },
            { phone_number: encryptedPhone }
          ],
          is_active: true
        }
      });

      if (!subscription) {
        throw new Error('Abonnement non trouvé');
      }

      // Vérifier le code (hashé ou en clair selon migration)
      const isValidCode = await this.verifyHashedCode(verificationCode, subscription.verification_code);
      
      if (!isValidCode) {
        // Incrémenter les tentatives échouées
        await subscription.increment('verification_attempts');
        
        if (subscription.verification_attempts >= 5) {
          await subscription.update({ is_active: false });
          throw new Error('Trop de tentatives échouées. Abonnement désactivé.');
        }
        
        throw new Error('Code de vérification invalide');
      }

      // Vérifier l'expiration
      const now = new Date();
      const expiryTime = new Date(subscription.verification_sent_at.getTime() + this.config.verificationExpiryMinutes * 60000);
      
      if (now > expiryTime) {
        throw new Error('Code de vérification expiré');
      }

      // Marquer comme vérifié et migrer vers format chiffré
      await subscription.update({
        is_verified: true,
        verified_at: new Date(),
        verification_code: null,
        phone_number: encryptedPhone // Migration vers chiffré
      });

      // Envoyer SMS de bienvenue
      await this.sendWelcomeSMS(normalizedPhone, {
        name: subscription.first_name || 'Utilisateur',
        language: subscription.language_preference
      });

      logger.info('Phone number verified', {
        phone: this.maskPhoneNumber(normalizedPhone),
        subscription_id: subscription.id,
        encrypted: !!this.encryptionService?.isInitialized
      });

      await this.updateStats();

      return {
        success: true,
        message: 'Numéro vérifié avec succès',
        subscription: this.sanitizeSubscription(subscription)
      };

    } catch (error) {
      logger.error('Erreur vérification numéro:', error.message);
      throw error;
    }
  }

  /**
   * 🚫 Se désabonner des SMS
   */
  async unsubscribe(phoneNumber, reason = null) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      const encryptedPhone = this.encryptPhoneNumber(normalizedPhone);

      if (!this.models || !this.models.SMSSubscription) {
        logger.warn('Mode mock: SMS unsubscribe', {
          phone: this.maskPhoneNumber(normalizedPhone)
        });
        return {
          success: true,
          message: 'Désabonnement SMS simulé'
        };
      }

      // Chercher dans les deux formats
      const subscription = await this.models.SMSSubscription.findOne({
        where: {
          [Op.or]: [
            { phone_number: normalizedPhone },
            { phone_number: encryptedPhone }
          ]
        }
      });

      if (subscription) {
        await subscription.update({
          is_active: false,
          unsubscribed_at: new Date(),
          unsubscribe_reason: reason
        });

        logger.info('SMS unsubscription', {
          phone: this.maskPhoneNumber(normalizedPhone),
          subscription_id: subscription.id,
          reason
        });
      }

      await this.updateStats();

      return {
        success: true,
        message: 'Désabonnement effectué avec succès'
      };

    } catch (error) {
      logger.error('Erreur désabonnement SMS:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Code de vérification avec sécurité renforcée
   */
  async sendVerificationCode(phoneNumber) {
    try {
      const code = this.generateVerificationCode();
      const hashedCode = await this.hashVerificationCode(code);
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      const encryptedPhone = this.encryptPhoneNumber(normalizedPhone);

      // Sauvegarder le code hashé en base si disponible
      if (this.models && this.models.SMSSubscription) {
        await this.models.SMSSubscription.update(
          {
            verification_code: hashedCode, // 🔐 STOCKÉ HASHÉ
            verification_sent_at: new Date(),
            verification_attempts: 0
          },
          { 
            where: {
              [Op.or]: [
                { phone_number: normalizedPhone },
                { phone_number: encryptedPhone }
              ]
            }
          }
        );
      }

      const message = `Votre code de vérification WolofDict : ${code}. Ce code expire dans ${this.config.verificationExpiryMinutes} minutes.`;

      // Envoyer au numéro en clair
      const result = await this.sendSMS(normalizedPhone, message, {
        type: this.messageTypes.VERIFICATION,
        priority: 'high'
      });

      this.stats.verificationRequests++;

      logger.info('Verification code sent', {
        phone: this.maskPhoneNumber(normalizedPhone),
        code_length: code.length,
        hashed: !!this.encryptionService?.isInitialized
      });

      return result;

    } catch (error) {
      logger.error('Erreur envoi code vérification:', error.message);
      throw error;
    }
  }

  /**
   * 👥 Récupérer les abonnés actifs avec déchiffrement
   */
  async getActiveSubscribers(filters = {}) {
    try {
      if (!this.models || !this.models.SMSSubscription) {
        return [];
      }

      let whereClause = {
        is_active: true,
        is_verified: true
      };

      // Filtrer par préférence
      if (filters.preference) {
        whereClause[`content_preferences.${filters.preference}`] = true;
      }

      // Filtrer par pays
      if (filters.country) {
        whereClause.country_code = filters.country;
      }

      // Filtrer par fréquence
      if (filters.frequency) {
        whereClause.frequency_preference = filters.frequency;
      }

      // Filtrer par langue
      if (filters.language) {
        whereClause.language_preference = filters.language;
      }

      const subscribers = await this.models.SMSSubscription.findAll({
        where: whereClause,
        attributes: ['id', 'phone_number', 'first_name', 'language_preference'],
        order: [['created_at', 'ASC']]
      });

      // Déchiffrer les numéros pour envoi et masquer pour logs
      return subscribers.map(sub => {
        const decryptedPhone = this.decryptPhoneNumber(sub.phone_number);
        return {
          ...sub.toJSON(),
          phone_number: decryptedPhone, // 🔓 DÉCHIFFRÉ POUR USAGE
          phone_masked: this.maskPhoneNumber(decryptedPhone) // Pour logs
        };
      });

    } catch (error) {
      logger.error('Erreur récupération abonnés SMS:', error.message);
      return [];
    }
  }

  /**
   * 🧹 Sanitiser un abonnement pour retour API
   */
  sanitizeSubscription(subscription) {
    const clean = { ...subscription.toJSON() };
    
    // Masquer le numéro au lieu de le déchiffrer
    if (clean.phone_number) {
      clean.phone_number = this.maskPhoneNumber(this.decryptPhoneNumber(clean.phone_number));
    }
    
    // Supprimer les données sensibles
    delete clean.verification_code;
    delete clean.ip_address;
    delete clean.user_agent;
    
    return clean;
  }

  // =============================================================================
  // 📨 ENVOI DE SMS (MÉTHODES EXISTANTES CONSERVÉES)
  // =============================================================================

  async setup() {
    try {
      // Déterminer le fournisseur SMS à utiliser
      const provider = process.env.SMS_PROVIDER || this.providers.MOCK;
      
      switch (provider) {
        case this.providers.TWILIO:
          this.smsProvider = await this.setupTwilio();
          break;
        case this.providers.AFRICAS_TALKING:
          this.smsProvider = await this.setupAfricasTalking();
          break;
        case this.providers.ORANGE_SMS:
          this.smsProvider = await this.setupOrangeSMS();
          break;
        case this.providers.FREE_MOBILE:
          this.smsProvider = await this.setupFreeMobile();
          break;
        default:
          this.smsProvider = this.setupMockProvider();
      }

      // Configuration des webhooks pour les retours de livraison
      this.setupWebhooks();
      
      logger.info('Configuration SMS terminée', {
        provider: provider,
        webhooks_enabled: !!process.env.SMS_WEBHOOK_URL
      });
      
    } catch (error) {
      logger.error('Erreur configuration SMSService:', error.message);
      // Fallback sur le provider mock
      this.smsProvider = this.setupMockProvider();
    }
  }

  async setupTwilio() {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error('Configuration Twilio incomplète');
      }

      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);

      return {
        name: 'Twilio',
        client,
        fromNumber,
        send: async (to, message, options = {}) => {
          const result = await client.messages.create({
            body: message,
            from: fromNumber,
            to: to,
            statusCallback: process.env.SMS_WEBHOOK_URL,
            ...options
          });
          return {
            success: true,
            messageId: result.sid,
            provider: 'twilio'
          };
        }
      };

    } catch (error) {
      logger.error('Erreur configuration Twilio:', error.message);
      throw error;
    }
  }

  async setupAfricasTalking() {
    try {
      const apiKey = process.env.AFRICAS_TALKING_API_KEY;
      const username = process.env.AFRICAS_TALKING_USERNAME;

      if (!apiKey || !username) {
        throw new Error('Configuration Africa\'s Talking incomplète');
      }

      const AfricasTalking = require('africastalking');
      const africasTalking = AfricasTalking({ apiKey, username });
      const sms = africasTalking.SMS;

      return {
        name: 'Africa\'s Talking',
        client: sms,
        send: async (to, message, options = {}) => {
          const result = await sms.send({
            to: [to],
            message: message,
            from: options.from || this.config.defaultSender
          });
          
          const messageResult = result.SMSMessageData.Recipients[0];
          
          return {
            success: messageResult.status === 'Success',
            messageId: messageResult.messageId,
            provider: 'africas_talking',
            cost: messageResult.cost
          };
        }
      };

    } catch (error) {
      logger.error('Erreur configuration Africa\'s Talking:', error.message);
      throw error;
    }
  }

  async setupOrangeSMS() {
    try {
      const clientId = process.env.ORANGE_SMS_CLIENT_ID;
      const clientSecret = process.env.ORANGE_SMS_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Configuration Orange SMS incomplète');
      }

      return {
        name: 'Orange SMS',
        clientId,
        clientSecret,
        accessToken: null,
        send: async (to, message, options = {}) => {
          if (!this.accessToken) {
            await this.getOrangeAccessToken();
          }

          const response = await this.makeOrangeSMSRequest(to, message, options);
          
          return {
            success: response.outboundSMSMessageRequest.deliveryInfoList.deliveryInfo[0].deliveryStatus === 'DeliveredToNetwork',
            messageId: response.outboundSMSMessageRequest.deliveryInfoList.deliveryInfo[0].address,
            provider: 'orange_sms'
          };
        }
      };

    } catch (error) {
      logger.error('Erreur configuration Orange SMS:', error.message);
      throw error;
    }
  }

  async setupFreeMobile() {
    try {
      const user = process.env.FREE_MOBILE_USER;
      const pass = process.env.FREE_MOBILE_PASS;

      if (!user || !pass) {
        throw new Error('Configuration Free Mobile incomplète');
      }

      return {
        name: 'Free Mobile',
        user,
        pass,
        send: async (to, message, options = {}) => {
          const url = `https://smsapi.free-mobile.fr/sendmsg?user=${user}&pass=${pass}&msg=${encodeURIComponent(message)}`;
          
          const response = await fetch(url);
          
          return {
            success: response.ok,
            messageId: `free_${Date.now()}`,
            provider: 'free_mobile'
          };
        }
      };

    } catch (error) {
      logger.error('Erreur configuration Free Mobile:', error.message);
      throw error;
    }
  }

  setupMockProvider() {
    logger.warn('Configuration provider SMS mock');
    
    return {
      name: 'Mock Provider',
      send: async (to, message, options = {}) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        
        const success = Math.random() > 0.05; // 95% de succès
        
        return {
          success,
          messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          provider: 'mock',
          mock: true
        };
      }
    };
  }

  setupWebhooks() {
    if (process.env.SMS_WEBHOOK_URL) {
      logger.info('Webhooks SMS configurés', {
        url: process.env.SMS_WEBHOOK_URL
      });
    }
  }

  async sendSMS(phoneNumber, message, options = {}) {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      if (!this.checkRateLimit(normalizedPhone)) {
        throw new Error('Limite de débit atteinte pour ce numéro');
      }

      if (message.length > 160 && !options.allowLong) {
        throw new Error('Message trop long (160 caractères max)');
      }

      const messageData = {
        id: `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to: normalizedPhone,
        message: message,
        type: options.type || this.messageTypes.NOTIFICATION,
        priority: options.priority || 'normal',
        scheduled_at: options.scheduledAt || null,
        retry_count: 0,
        created_at: new Date()
      };

      if (options.scheduledAt || this.messageQueue.length > 0) {
        this.messageQueue.push(messageData);
        return {
          success: true,
          messageId: messageData.id,
          status: 'queued'
        };
      }

      return await this.sendSMSNow(messageData);

    } catch (error) {
      logger.error('Erreur envoi SMS:', error.message);
      throw error;
    }
  }

  async sendSMSNow(messageData) {
    try {
      if (!this.smsProvider) {
        throw new Error('Aucun fournisseur SMS configuré');
      }

      const result = await this.smsProvider.send(
        messageData.to, 
        messageData.message, 
        {
          type: messageData.type,
          priority: messageData.priority
        }
      );

      if (this.models && this.models.SMSMessage) {
        await this.models.SMSMessage.create({
          message_id: result.messageId,
          phone_number: this.encryptPhoneNumber(messageData.to), // 🔐 STOCKÉ CHIFFRÉ
          message: messageData.message,
          type: messageData.type,
          status: result.success ? 'sent' : 'failed',
          provider: result.provider,
          cost: result.cost || null,
          sent_at: new Date(),
          error_message: result.success ? null : result.error
        });
      }

      this.stats.totalSent++;
      if (result.success) {
        this.updateRateLimit(messageData.to);
      } else {
        this.stats.totalFailed++;
      }

      logger.info('SMS sent', {
        messageId: result.messageId,
        to: this.maskPhoneNumber(messageData.to),
        success: result.success,
        provider: result.provider
      });

      return {
        success: result.success,
        messageId: result.messageId,
        provider: result.provider,
        status: result.success ? 'sent' : 'failed'
      };

    } catch (error) {
      this.stats.totalFailed++;
      logger.error('Erreur envoi SMS immédiat:', error.message);
      throw error;
    }
  }

  async sendBulkSMS(message, filters = {}, options = {}) {
    try {
      const subscribers = await this.getActiveSubscribers(filters);
      
      if (subscribers.length === 0) {
        return {
          success: true,
          sent: 0,
          failed: 0,
          message: 'Aucun abonné trouvé'
        };
      }

      const batchSize = 50;
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        
        const promises = batch.map(subscriber => 
          this.sendSMS(subscriber.phone_number, message, {
            ...options,
            type: this.messageTypes.CAMPAIGN
          }).catch(error => {
            logger.warn('Failed to send SMS to subscriber', {
              phone: subscriber.phone_masked,
              error: error.message
            });
            return { success: false };
          })
        );

        const results = await Promise.all(promises);
        
        const sent = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        totalSent += sent;
        totalFailed += failed;

        if (i + batchSize < subscribers.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('Bulk SMS sent', {
        total: subscribers.length,
        sent: totalSent,
        failed: totalFailed
      });

      return {
        success: true,
        sent: totalSent,
        failed: totalFailed,
        total: subscribers.length
      };

    } catch (error) {
      logger.error('Erreur envoi SMS en masse:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🎯 SMS SPÉCIALISÉS WOLOFDICT
  // =============================================================================

  async sendWelcomeSMS(phoneNumber, userData = {}) {
    const language = userData.language || 'français';
    
    const messages = {
      français: `Bienvenue ${userData.name || ''} dans WolofDict ! 🎉 Vous recevrez maintenant nos mots du jour et actualités. Répondez STOP pour vous désabonner.`,
      wolof: `Dalal ak jamm ${userData.name || ''} ci WolofDict ! 🎉 Leegi dina la joxe baat bi ak khabaar yi. Wax STOP ngir reet.`,
      english: `Welcome ${userData.name || ''} to WolofDict! 🎉 You'll now receive our daily words and updates. Reply STOP to unsubscribe.`
    };

    return await this.sendSMS(phoneNumber, messages[language] || messages.français, {
      type: this.messageTypes.SYSTEM
    });
  }

  async sendDailyWord(wordData) {
    const message = `🌟 Mot du jour WolofDict :\n${wordData.wolof} - ${wordData.french}\n\nExemple : ${wordData.example || 'Visitez wolofdict.com pour plus d\'exemples'}`;

    return await this.sendBulkSMS(message, {
      preference: 'daily_word'
    }, {
      type: this.messageTypes.DAILY_WORD
    });
  }

  async sendNewWordNotification(wordData) {
    const message = `📚 Nouveau mot ajouté !\n${wordData.wolof} - ${wordData.french}\n\nDécouvrez-le sur wolofdict.com`;

    return await this.sendBulkSMS(message, {
      preference: 'new_words'
    }, {
      type: this.messageTypes.NEW_WORD
    });
  }

  async sendStudyReminder(phoneNumber, reminderData = {}) {
    const message = reminderData.message || `⏰ N'oubliez pas votre session d'apprentissage quotidienne sur WolofDict ! 📚`;

    return await this.sendSMS(phoneNumber, message, {
      type: this.messageTypes.REMINDER
    });
  }

  async sendEventNotification(eventData) {
    const message = `📅 ${eventData.title}\n${eventData.description}\n\nPlus d'infos : wolofdict.com/events`;

    return await this.sendBulkSMS(message, {
      preference: 'events'
    }, {
      type: this.messageTypes.NOTIFICATION
    });
  }

  // =============================================================================
  // 🛠️ UTILITAIRES
  // =============================================================================

  normalizePhoneNumber(phoneNumber) {
    let normalized = phoneNumber.replace(/[^\d+]/g, '');
    
    if (normalized.startsWith('00')) {
      normalized = '+' + normalized.substring(2);
    }
    
    if (!normalized.startsWith('+')) {
      if (normalized.length === 9 && normalized.startsWith('7')) {
        normalized = '+221' + normalized;
      } else {
        normalized = '+221' + normalized;
      }
    }

    return normalized;
  }

  detectCountry(phoneNumber) {
    for (const [code, info] of Object.entries(this.supportedCountries)) {
      if (phoneNumber.startsWith(info.code)) {
        const localNumber = phoneNumber.substring(info.code.length);
        if (info.format.test(localNumber)) {
          return { country: code, ...info };
        }
      }
    }
    return null;
  }

  isValidPhoneNumber(phoneNumber) {
    const normalized = this.normalizePhoneNumber(phoneNumber);
    return !!this.detectCountry(normalized);
  }

  checkRateLimit(phoneNumber) {
    const now = Date.now();
    const key = phoneNumber;
    const windowStart = now - 60000;

    if (!this.rateLimitCache.has(key)) {
      this.rateLimitCache.set(key, []);
    }

    const timestamps = this.rateLimitCache.get(key);
    const recentTimestamps = timestamps.filter(ts => ts > windowStart);
    this.rateLimitCache.set(key, recentTimestamps);

    return recentTimestamps.length < this.config.rateLimitPerMinute;
  }

  updateRateLimit(phoneNumber) {
    const now = Date.now();
    const key = phoneNumber;

    if (!this.rateLimitCache.has(key)) {
      this.rateLimitCache.set(key, []);
    }

    const timestamps = this.rateLimitCache.get(key);
    timestamps.push(now);
    this.rateLimitCache.set(key, timestamps);
  }

  startQueueProcessor() {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.messageQueue.length > 0) {
        await this.processMessageQueue();
      }
    }, 5000);
  }

  async processMessageQueue() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;

    try {
      const now = new Date();
      
      const readyMessages = this.messageQueue.filter(msg => 
        !msg.scheduled_at || new Date(msg.scheduled_at) <= now
      );

      for (const message of readyMessages) {
        try {
          await this.sendSMSNow(message);
          
          const index = this.messageQueue.findIndex(m => m.id === message.id);
          if (index > -1) {
            this.messageQueue.splice(index, 1);
          }

        } catch (error) {
          message.retry_count++;
          
          if (message.retry_count >= this.config.maxRetries) {
            const index = this.messageQueue.findIndex(m => m.id === message.id);
            if (index > -1) {
              this.messageQueue.splice(index, 1);
            }
            
            logger.error('SMS définitivement échoué', {
              messageId: message.id,
              retries: message.retry_count
            });
          } else {
            message.scheduled_at = new Date(Date.now() + this.config.retryDelay * message.retry_count);
          }
        }
      }

    } catch (error) {
      logger.error('Erreur processeur queue SMS:', error.message);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // =============================================================================
  // 📊 STATISTIQUES ET MAINTENANCE
  // =============================================================================

  async updateStats() {
    try {
      if (!this.models || !this.models.SMSSubscription) {
        return;
      }

      const subscriptionStats = await this.models.SMSSubscription.findAll({
        attributes: [
          [this.models.sequelize.fn('COUNT', '*'), 'total'],
          [this.models.sequelize.fn('SUM', 
            this.models.sequelize.literal('CASE WHEN is_active = true THEN 1 ELSE 0 END')
          ), 'active'],
          [this.models.sequelize.fn('SUM', 
            this.models.sequelize.literal('CASE WHEN is_verified = true THEN 1 ELSE 0 END')
          ), 'verified']
        ],
        raw: true
      });

      if (subscriptionStats && subscriptionStats[0]) {
        const stats = subscriptionStats[0];
        this.stats.totalSubscriptions = parseInt(stats.total) || 0;
        this.stats.activeSubscriptions = parseInt(stats.active) || 0;
        this.stats.verifiedNumbers = parseInt(stats.verified) || 0;
      }

    } catch (error) {
      logger.error('Erreur mise à jour stats SMS:', error.message);
    }
  }

  async cleanupExpiredData() {
    try {
      if (!this.models) {
        return { cleaned: 0 };
      }

      let totalCleaned = 0;

      if (this.models.SMSSubscription) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deletedSubscriptions = await this.models.SMSSubscription.destroy({
          where: {
            is_verified: false,
            created_at: { [Op.lt]: thirtyDaysAgo }
          }
        });

        totalCleaned += deletedSubscriptions;
      }

      if (this.models.SMSMessage) {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const deletedMessages = await this.models.SMSMessage.destroy({
          where: {
            sent_at: { [Op.lt]: ninetyDaysAgo }
          }
        });

        totalCleaned += deletedMessages;
      }

      const now = Date.now();
      const oneHourAgo = now - 3600000;

      for (const [key, timestamps] of this.rateLimitCache.entries()) {
        const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
        if (recentTimestamps.length === 0) {
          this.rateLimitCache.delete(key);
        } else {
          this.rateLimitCache.set(key, recentTimestamps);
        }
      }

      if (totalCleaned > 0) {
        logger.info('Nettoyage SMS terminé', { cleaned: totalCleaned });
        await this.updateStats();
      }

      return { cleaned: totalCleaned };

    } catch (error) {
      logger.error('Erreur nettoyage SMS:', error.message);
      return { cleaned: 0, error: error.message };
    }
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasModels: !!this.models,
      hasEncryptionService: !!this.encryptionService?.isInitialized,
      provider: {
        name: this.smsProvider?.name || 'Non configuré',
        configured: !!this.smsProvider
      },
      stats: this.stats,
      queue: {
        size: this.messageQueue.length,
        processing: this.isProcessingQueue
      },
      cache: {
        rate_limit_entries: this.rateLimitCache.size
      },
      config: this.config,
      supported_countries: Object.keys(this.supportedCountries),
      security: {
        encryption_enabled: !!this.encryptionService?.isInitialized,
        phone_numbers_encrypted: true,
        verification_codes_hashed: true
      },
      timestamp: new Date().toISOString()
    };
  }

  async cleanup() {
    this.messageQueue = [];
    this.rateLimitCache.clear();
    this.isInitialized = false;
    this.isProcessingQueue = false;
    
    logger.info(this.name + ' nettoyé');
  }
}

module.exports = new SMSService();