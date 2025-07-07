// =============================================================================
// 📱 WOLOFDICT - PUSHSERVICE COMPLET AVEC CHIFFREMENT
// Service de notifications push avec EncryptionService intégré
// =============================================================================

const logger = require('./LoggerService');
const EncryptionService = require('./EncryptionService');
const webpush = require('web-push');

class PushService {
  constructor() {
    this.isInitialized = false;
    this.name = 'PushService';
    this.models = null;
    this.encryptionService = null;
    this.vapidKeys = null;
    this.subscriptions = new Map(); // Cache des abonnements (données déchiffrées)
    
    // Statistiques
    this.stats = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      sentNotifications: 0,
      failedNotifications: 0,
      clickedNotifications: 0
    };

    // Types de notifications supportées
    this.notificationTypes = {
      NEW_WORD: 'new_word',
      NEW_PHRASE: 'new_phrase', 
      DAILY_WORD: 'daily_word',
      EVENT: 'event',
      ACHIEVEMENT: 'achievement',
      REMINDER: 'reminder',
      SYSTEM: 'system',
      COMMUNITY: 'community'
    };

    // Configuration par défaut des notifications
    this.defaultConfig = {
      badge: '/icons/badge-96x96.png',
      icon: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      silent: false
    };
  }

  async initialize() {
    try {
      // Initialiser EncryptionService si nécessaire
      if (EncryptionService && !EncryptionService.isInitialized) {
        await EncryptionService.initialize();
      }
      this.encryptionService = EncryptionService;
      
      if (this.encryptionService && this.encryptionService.isInitialized) {
        logger.info('EncryptionService connecté à PushService');
      } else {
        logger.warn('EncryptionService non disponible - données push stockées en clair');
      }

      // Configuration du service
      await this.setup();
      
      // Import des modèles Sequelize
      try {
        this.models = require('../models');
        logger.info('Modèles Sequelize chargés dans PushService');
      } catch (error) {
        logger.warn('Modèles Sequelize non disponibles, mode mock activé');
      }

      // Charger les abonnements existants
      await this.loadSubscriptions();
      
      // Mettre à jour les statistiques
      await this.updateStats();
      
      this.isInitialized = true;
      logger.info('PushService initialisé avec succès', {
        subscriptions: this.stats.totalSubscriptions,
        vapid_configured: !!this.vapidKeys,
        encryption_enabled: !!this.encryptionService?.isInitialized
      });
      
    } catch (error) {
      logger.error('Erreur initialisation PushService:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🔐 MÉTHODES DE CHIFFREMENT ET SÉCURITÉ
  // =============================================================================

  /**
   * 🔐 Chiffrer un endpoint push
   */
  encryptEndpoint(endpoint) {
    try {
      if (!this.encryptionService || !this.encryptionService.isInitialized) {
        logger.warn('EncryptionService non disponible, stockage endpoint en clair');
        return endpoint;
      }
      
      return this.encryptionService.encryptField(endpoint);
    } catch (error) {
      logger.error('Erreur chiffrement endpoint:', error.message);
      return endpoint; // Fallback sécurisé
    }
  }

  /**
   * 🔓 Déchiffrer un endpoint push
   */
  decryptEndpoint(encryptedEndpoint) {
    try {
      if (!this.encryptionService || !this.encryptionService.isInitialized || !encryptedEndpoint) {
        return encryptedEndpoint;
      }
      
      // Vérifier si déjà en clair (migration progressive)
      if (!encryptedEndpoint.includes('{"iv":')) {
        return encryptedEndpoint;
      }
      
      return this.encryptionService.decryptField(encryptedEndpoint);
    } catch (error) {
      logger.error('Erreur déchiffrement endpoint:', error.message);
      return encryptedEndpoint; // Fallback sécurisé
    }
  }

  /**
   * 🔐 Chiffrer les clés push (p256dh et auth)
   */
  encryptPushKeys(keys) {
    try {
      if (!this.encryptionService || !this.encryptionService.isInitialized || !keys) {
        return keys;
      }
      
      return {
        p256dh: this.encryptionService.encryptField(keys.p256dh),
        auth: this.encryptionService.encryptField(keys.auth)
      };
    } catch (error) {
      logger.error('Erreur chiffrement clés push:', error.message);
      return keys; // Fallback sécurisé
    }
  }

  /**
   * 🔓 Déchiffrer les clés push
   */
  decryptPushKeys(encryptedKeys) {
    try {
      if (!this.encryptionService || !this.encryptionService.isInitialized || !encryptedKeys) {
        return encryptedKeys;
      }
      
      // Gérer la migration progressive
      const p256dh = encryptedKeys.p256dh?.includes('{"iv":') 
        ? this.encryptionService.decryptField(encryptedKeys.p256dh)
        : encryptedKeys.p256dh;
        
      const auth = encryptedKeys.auth?.includes('{"iv":')
        ? this.encryptionService.decryptField(encryptedKeys.auth)
        : encryptedKeys.auth;
      
      return { p256dh, auth };
    } catch (error) {
      logger.error('Erreur déchiffrement clés push:', error.message);
      return encryptedKeys; // Fallback sécurisé
    }
  }

  /**
   * 🎭 Masquer un endpoint pour les logs
   */
  maskEndpoint(endpoint) {
    try {
      if (this.encryptionService && this.encryptionService.isInitialized) {
        return this.encryptionService.maskSensitiveData({ endpoint }).endpoint;
      }
      
      // Fallback basique
      if (!endpoint || endpoint.length < 20) return '***';
      return endpoint.substring(0, 10) + '***' + endpoint.substring(endpoint.length - 10);
      
    } catch (error) {
      return '***';
    }
  }

  /**
   * 🔑 Générer un hash sécurisé pour l'ID d'abonnement
   */
  generateSubscriptionId(endpoint) {
    try {
      if (this.encryptionService && this.encryptionService.isInitialized) {
        return this.encryptionService.createSignature(endpoint).substring(0, 32);
      }
      
      // Fallback avec crypto natif
      return require('crypto').createHash('sha256').update(endpoint).digest('hex').substring(0, 32);
    } catch (error) {
      // Fallback basique
      return require('crypto').createHash('md5').update(endpoint).digest('hex');
    }
  }

  /**
   * 🧹 Sanitiser un abonnement pour retour API
   */
  sanitizeSubscription(subscription) {
    const clean = { ...subscription.toJSON() };
    
    // Masquer l'endpoint au lieu de le déchiffrer
    if (clean.endpoint) {
      clean.endpoint = this.maskEndpoint(this.decryptEndpoint(clean.endpoint));
    }
    
    // Supprimer les clés sensibles
    delete clean.p256dh_key;
    delete clean.auth_key;
    
    return clean;
  }

  // =============================================================================
  // 📱 GESTION DES ABONNEMENTS AVEC CHIFFREMENT
  // =============================================================================

  /**
   * 🔔 S'abonner aux notifications push avec chiffrement
   */
  async subscribe(subscriptionData, userId = null, preferences = {}) {
    try {
      const { endpoint, keys } = subscriptionData;
      
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        throw new Error('Données d\'abonnement invalides');
      }

      // Chiffrer les données sensibles pour stockage
      const encryptedEndpoint = this.encryptEndpoint(endpoint);
      const encryptedKeys = this.encryptPushKeys(keys);

      // Créer un ID unique pour l'abonnement (basé sur endpoint en clair)
      const subscriptionId = this.generateSubscriptionId(endpoint);

      if (this.models && this.models.PushSubscription) {
        // Vérifier si déjà abonné (chercher dans les deux formats pour migration)
        const existingSubscription = await this.models.PushSubscription.findOne({
          where: {
            [require('sequelize').Op.or]: [
              { endpoint: endpoint }, // Format ancien
              { endpoint: encryptedEndpoint } // Format chiffré
            ]
          }
        });

        if (existingSubscription) {
          // Mettre à jour l'abonnement existant avec chiffrement
          await existingSubscription.update({
            endpoint: encryptedEndpoint, // 🔐 MIGRER VERS CHIFFRÉ
            p256dh_key: encryptedKeys.p256dh, // 🔐 CHIFFRÉ
            auth_key: encryptedKeys.auth, // 🔐 CHIFFRÉ
            user_id: userId,
            preferences: {
              ...existingSubscription.preferences,
              ...preferences
            },
            is_active: true,
            last_updated: new Date()
          });

          // Mettre à jour le cache avec données en clair pour usage
          this.subscriptions.set(subscriptionId, {
            endpoint, // En clair pour usage
            keys, // En clair pour usage
            id: existingSubscription.id,
            preferences: existingSubscription.preferences
          });

          logger.info('Abonnement push mis à jour', {
            subscription_id: existingSubscription.id,
            user_id: userId,
            endpoint: this.maskEndpoint(endpoint),
            encrypted: !!this.encryptionService?.isInitialized
          });

          return {
            success: true,
            message: 'Abonnement mis à jour',
            subscriptionId: existingSubscription.id
          };
        }

        // Créer nouvel abonnement avec données chiffrées
        const subscription = await this.models.PushSubscription.create({
          endpoint: encryptedEndpoint, // 🔐 STOCKÉ CHIFFRÉ
          p256dh_key: encryptedKeys.p256dh, // 🔐 STOCKÉ CHIFFRÉ
          auth_key: encryptedKeys.auth, // 🔐 STOCKÉ CHIFFRÉ
          user_id: userId,
          preferences: {
            new_words: true,
            daily_word: true,
            events: true,
            achievements: true,
            reminders: false,
            ...preferences
          },
          user_agent: subscriptionData.userAgent || null,
          is_active: true
        });

        // Stocker en cache avec données déchiffrées pour usage
        this.subscriptions.set(subscriptionId, {
          endpoint, // 🔓 EN CLAIR POUR USAGE
          keys, // 🔓 EN CLAIR POUR USAGE
          id: subscription.id,
          preferences: subscription.preferences
        });

        logger.info('Nouvel abonnement push créé', {
          subscription_id: subscription.id,
          user_id: userId,
          endpoint: this.maskEndpoint(endpoint),
          encrypted: !!this.encryptionService?.isInitialized
        });

        await this.updateStats();

        return {
          success: true,
          message: 'Abonnement créé avec succès',
          subscriptionId: subscription.id
        };

      } else {
        // Mode mock
        this.subscriptions.set(subscriptionId, {
          endpoint,
          keys,
          id: Date.now(),
          preferences: preferences,
          mock: true
        });

        logger.warn('Mode mock: abonnement push simulé', {
          endpoint: this.maskEndpoint(endpoint)
        });
        
        return {
          success: true,
          message: 'Abonnement simulé',
          subscriptionId: subscriptionId,
          mock: true
        };
      }

    } catch (error) {
      logger.error('Erreur abonnement push:', error.message);
      throw error;
    }
  }

  /**
   * 🚫 Se désabonner des notifications push
   */
  async unsubscribe(endpoint) {
    try {
      const subscriptionId = this.generateSubscriptionId(endpoint);
      const encryptedEndpoint = this.encryptEndpoint(endpoint);

      if (this.models && this.models.PushSubscription) {
        const subscription = await this.models.PushSubscription.findOne({
          where: {
            [require('sequelize').Op.or]: [
              { endpoint: endpoint },
              { endpoint: encryptedEndpoint }
            ]
          }
        });

        if (subscription) {
          await subscription.update({ is_active: false });
          logger.info('Désabonnement push effectué', {
            subscription_id: subscription.id,
            endpoint: this.maskEndpoint(endpoint)
          });
        }
      }

      // Supprimer du cache
      this.subscriptions.delete(subscriptionId);
      await this.updateStats();

      return {
        success: true,
        message: 'Désabonnement effectué'
      };

    } catch (error) {
      logger.error('Erreur désabonnement push:', error.message);
      throw error;
    }
  }

  /**
   * ⚙️ Mettre à jour les préférences de notification
   */
  async updatePreferences(endpoint, preferences) {
    try {
      const encryptedEndpoint = this.encryptEndpoint(endpoint);

      if (this.models && this.models.PushSubscription) {
        const subscription = await this.models.PushSubscription.findOne({
          where: { 
            [require('sequelize').Op.or]: [
              { endpoint: endpoint },
              { endpoint: encryptedEndpoint }
            ],
            is_active: true 
          }
        });

        if (!subscription) {
          throw new Error('Abonnement non trouvé');
        }

        const updatedPreferences = {
          ...subscription.preferences,
          ...preferences
        };

        await subscription.update({
          preferences: updatedPreferences
        });

        // Mettre à jour le cache
        const subscriptionId = this.generateSubscriptionId(endpoint);
        const cachedSub = this.subscriptions.get(subscriptionId);
        if (cachedSub) {
          cachedSub.preferences = updatedPreferences;
        }

        logger.info('Préférences push mises à jour', {
          subscription_id: subscription.id,
          endpoint: this.maskEndpoint(endpoint)
        });

        return {
          success: true,
          message: 'Préférences mises à jour',
          preferences: updatedPreferences
        };
      }

      throw new Error('Modèles non disponibles');

    } catch (error) {
      logger.error('Erreur mise à jour préférences push:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Charger les abonnements existants avec déchiffrement
   */
  async loadSubscriptions() {
    try {
      if (!this.models || !this.models.PushSubscription) {
        return;
      }

      const subscriptions = await this.models.PushSubscription.findAll({
        where: { is_active: true },
        attributes: ['id', 'endpoint', 'p256dh_key', 'auth_key', 'preferences']
      });

      this.subscriptions.clear();
      
      subscriptions.forEach(sub => {
        try {
          // Déchiffrer les données pour usage
          const endpoint = this.decryptEndpoint(sub.endpoint);
          const keys = this.decryptPushKeys({
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          });

          const subscriptionId = this.generateSubscriptionId(endpoint);
          this.subscriptions.set(subscriptionId, {
            endpoint, // 🔓 DÉCHIFFRÉ POUR USAGE
            keys, // 🔓 DÉCHIFFRÉ POUR USAGE
            id: sub.id,
            preferences: sub.preferences
          });
        } catch (error) {
          logger.warn('Impossible de déchiffrer abonnement push:', {
            subscription_id: sub.id,
            error: error.message
          });
        }
      });

      logger.info('Abonnements push chargés', {
        total: subscriptions.length,
        loaded_in_cache: this.subscriptions.size
      });

    } catch (error) {
      logger.error('Erreur chargement abonnements push:', error.message);
    }
  }

  // =============================================================================
  // 📨 ENVOI DE NOTIFICATIONS
  // =============================================================================

  async setup() {
    try {
      // Configuration VAPID pour Web Push
      this.vapidKeys = {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
        subject: process.env.VAPID_SUBJECT || 'mailto:admin@wolofdict.com'
      };

      if (!this.vapidKeys.publicKey || !this.vapidKeys.privateKey) {
        logger.warn('Clés VAPID non configurées - génération automatique');
        const keys = webpush.generateVAPIDKeys();
        this.vapidKeys.publicKey = keys.publicKey;
        this.vapidKeys.privateKey = keys.privateKey;
        
        logger.info('Clés VAPID générées:', {
          publicKey: keys.publicKey,
          privateKey: keys.privateKey
        });
      }

      // Configurer web-push
      webpush.setVapidDetails(
        this.vapidKeys.subject,
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey
      );

      logger.debug('Configuration PushService terminée');
      
    } catch (error) {
      logger.error('Erreur configuration PushService:', error.message);
      throw error;
    }
  }

  /**
   * 📤 Envoyer une notification à un utilisateur spécifique
   */
  async sendToUser(userId, notification) {
    try {
      if (!this.models || !this.models.PushSubscription) {
        logger.warn('Mode mock: envoi notification à utilisateur');
        return { success: true, sent: 0, failed: 0, mock: true };
      }

      const subscriptions = await this.models.PushSubscription.findAll({
        where: {
          user_id: userId,
          is_active: true
        }
      });

      if (subscriptions.length === 0) {
        return { success: true, sent: 0, failed: 0, message: 'Aucun abonnement trouvé' };
      }

      // Déchiffrer et envoyer
      const results = await Promise.allSettled(
        subscriptions.map(async (sub) => {
          // Créer un objet subscription déchiffré
          const decryptedSub = {
            id: sub.id,
            endpoint: this.decryptEndpoint(sub.endpoint),
            p256dh_key: this.decryptPushKeys({ p256dh: sub.p256dh_key, auth: sub.auth_key }).p256dh,
            auth_key: this.decryptPushKeys({ p256dh: sub.p256dh_key, auth: sub.auth_key }).auth,
            preferences: sub.preferences
          };
          
          return this.sendToSubscription(decryptedSub, notification);
        })
      );

      const sent = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info('Notification envoyée à utilisateur', {
        user_id: userId,
        sent,
        failed,
        total: subscriptions.length
      });

      return { success: true, sent, failed, total: subscriptions.length };

    } catch (error) {
      logger.error('Erreur envoi notification utilisateur:', error.message);
      throw error;
    }
  }

  /**
   * 📢 Envoyer une notification en masse
   */
  async sendToAll(notification, filters = {}) {
    try {
      const subscriptions = await this.getActiveSubscriptions(filters);
      
      if (subscriptions.length === 0) {
        return { success: true, sent: 0, failed: 0, message: 'Aucun abonnement trouvé' };
      }

      // Envoyer par batches pour éviter la surcharge
      const batchSize = 100;
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < subscriptions.length; i += batchSize) {
        const batch = subscriptions.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(sub => this.sendToSubscription(sub, notification))
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        totalSent += sent;
        totalFailed += failed;

        // Pause entre les batches
        if (i + batchSize < subscriptions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info('Notification en masse envoyée', {
        total: subscriptions.length,
        sent: totalSent,
        failed: totalFailed,
        type: notification.type
      });

      await this.updateStats();

      return {
        success: true,
        sent: totalSent,
        failed: totalFailed,
        total: subscriptions.length
      };

    } catch (error) {
      logger.error('Erreur envoi notification masse:', error.message);
      throw error;
    }
  }

  /**
   * 📱 Envoyer à un abonnement spécifique
   */
  async sendToSubscription(subscription, notification) {
    try {
      // Vérifier les préférences
      if (!this.shouldSendNotification(subscription, notification)) {
        return { success: true, skipped: true, reason: 'preferences' };
      }

      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh_key,
          auth: subscription.auth_key
        }
      };

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || this.defaultConfig.icon,
        badge: notification.badge || this.defaultConfig.badge,
        data: {
          type: notification.type,
          url: notification.url,
          timestamp: Date.now(),
          ...notification.data
        },
        actions: notification.actions || [],
        vibrate: notification.vibrate || this.defaultConfig.vibrate,
        requireInteraction: notification.requireInteraction || this.defaultConfig.requireInteraction,
        silent: notification.silent || this.defaultConfig.silent
      });

      await webpush.sendNotification(pushSubscription, payload);

      // Enregistrer l'envoi si modèle disponible
      if (this.models && this.models.PushNotification) {
        await this.models.PushNotification.create({
          subscription_id: subscription.id,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data || {},
          sent_at: new Date(),
          status: 'sent'
        });
      }

      this.stats.sentNotifications++;

      return { success: true };

    } catch (error) {
      this.stats.failedNotifications++;

      // Gérer les erreurs spécifiques
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Abonnement expiré - le désactiver
        await this.handleExpiredSubscription(subscription);
        logger.warn('Abonnement push expiré désactivé', {
          subscription_id: subscription.id,
          endpoint: this.maskEndpoint(subscription.endpoint)
        });
      }

      logger.error('Erreur envoi notification push:', {
        subscription_id: subscription.id,
        endpoint: this.maskEndpoint(subscription.endpoint),
        error: error.message,
        statusCode: error.statusCode
      });

      throw error;
    }
  }

  // =============================================================================
  // 🎯 NOTIFICATIONS SPÉCIALISÉES WOLOFDICT
  // =============================================================================

  /**
   * 📚 Notification nouveau mot
   */
  async notifyNewWord(wordData) {
    const notification = {
      type: this.notificationTypes.NEW_WORD,
      title: '🆕 Nouveau mot ajouté !',
      body: `${wordData.wolof} - ${wordData.french}`,
      icon: '/icons/word-icon.png',
      url: `/words/${wordData.id}`,
      data: { wordId: wordData.id },
      actions: [
        { action: 'view', title: 'Voir le mot' },
        { action: 'practice', title: 'Pratiquer' }
      ]
    };

    return await this.sendToAll(notification, {
      preference: 'new_words'
    });
  }

  /**
   * 📝 Notification nouvelle phrase
   */
  async notifyNewPhrase(phraseData) {
    const notification = {
      type: this.notificationTypes.NEW_PHRASE,
      title: '✨ Nouvelle phrase disponible !',
      body: `${phraseData.wolof}`,
      url: `/phrases/${phraseData.id}`,
      data: { phraseId: phraseData.id }
    };

    return await this.sendToAll(notification, {
      preference: 'new_phrases'
    });
  }

  /**
   * 📅 Mot du jour
   */
  async notifyDailyWord(wordData) {
    const notification = {
      type: this.notificationTypes.DAILY_WORD,
      title: '🌟 Mot du jour',
      body: `Aujourd'hui : ${wordData.wolof} - ${wordData.french}`,
      icon: '/icons/daily-word.png',
      url: `/daily-word`,
      data: { wordId: wordData.id },
      requireInteraction: true
    };

    return await this.sendToAll(notification, {
      preference: 'daily_word'
    });
  }

  /**
   * 🎉 Notification événement
   */
  async notifyEvent(eventData) {
    const notification = {
      type: this.notificationTypes.EVENT,
      title: `📅 ${eventData.title}`,
      body: eventData.description,
      url: `/events/${eventData.id}`,
      data: { eventId: eventData.id }
    };

    return await this.sendToAll(notification, {
      preference: 'events'
    });
  }

  /**
   * 🏆 Notification achievement
   */
  async notifyAchievement(userId, achievementData) {
    const notification = {
      type: this.notificationTypes.ACHIEVEMENT,
      title: '🏆 Félicitations !',
      body: `Vous avez débloqué : ${achievementData.title}`,
      icon: '/icons/achievement.png',
      url: `/profile/achievements`,
      data: { achievementId: achievementData.id },
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    };

    return await this.sendToUser(userId, notification);
  }

  /**
   * ⏰ Rappel d'étude
   */
  async notifyStudyReminder(userId, reminderData) {
    const notification = {
      type: this.notificationTypes.REMINDER,
      title: '⏰ Temps d\'étudier !',
      body: reminderData.message || 'N\'oubliez pas votre session d\'apprentissage quotidienne',
      url: '/study',
      data: { type: 'study_reminder' }
    };

    return await this.sendToUser(userId, notification);
  }

  // =============================================================================
  // 🛠️ UTILITAIRES
  // =============================================================================

  /**
   * 📈 Récupérer les abonnements actifs avec déchiffrement et filtres
   */
  async getActiveSubscriptions(filters = {}) {
    try {
      if (!this.models || !this.models.PushSubscription) {
        return Array.from(this.subscriptions.values());
      }

      let whereClause = { is_active: true };

      // Filtrer par préférence
      if (filters.preference) {
        whereClause.preferences = {
          [filters.preference]: true
        };
      }

      // Filtrer par utilisateur
      if (filters.userId) {
        whereClause.user_id = filters.userId;
      }

      const subscriptions = await this.models.PushSubscription.findAll({
        where: whereClause
      });

      // Déchiffrer pour usage
      return subscriptions.map(sub => {
        try {
          return {
            id: sub.id,
            endpoint: this.decryptEndpoint(sub.endpoint),
            p256dh_key: this.decryptPushKeys({ p256dh: sub.p256dh_key, auth: sub.auth_key }).p256dh,
            auth_key: this.decryptPushKeys({ p256dh: sub.p256dh_key, auth: sub.auth_key }).auth,
            preferences: sub.preferences
          };
        } catch (error) {
          logger.warn('Erreur déchiffrement abonnement pour envoi:', sub.id);
          return null;
        }
      }).filter(Boolean);

    } catch (error) {
      logger.error('Erreur récupération abonnements actifs:', error.message);
      return [];
    }
  }

  /**
   * ✅ Vérifier si on doit envoyer la notification
   */
  shouldSendNotification(subscription, notification) {
    if (!subscription.preferences) return true;

    const typePreferenceMap = {
      [this.notificationTypes.NEW_WORD]: 'new_words',
      [this.notificationTypes.NEW_PHRASE]: 'new_phrases',
      [this.notificationTypes.DAILY_WORD]: 'daily_word',
      [this.notificationTypes.EVENT]: 'events',
      [this.notificationTypes.ACHIEVEMENT]: 'achievements',
      [this.notificationTypes.REMINDER]: 'reminders'
    };

    const preferenceKey = typePreferenceMap[notification.type];
    if (!preferenceKey) return true; // Envoyer si type non mappé

    return subscription.preferences[preferenceKey] !== false;
  }

  /**
   * 💀 Gérer un abonnement expiré
   */
  async handleExpiredSubscription(subscription) {
    try {
      if (this.models && this.models.PushSubscription) {
        await this.models.PushSubscription.update(
          { is_active: false },
          { where: { id: subscription.id } }
        );
      }

      // Supprimer du cache
      const subscriptionId = this.generateSubscriptionId(subscription.endpoint);
      this.subscriptions.delete(subscriptionId);

    } catch (error) {
      logger.error('Erreur gestion abonnement expiré:', error.message);
    }
  }

  /**
   * 📊 Mettre à jour les statistiques
   */
  async updateStats() {
    try {
      if (!this.models || !this.models.PushSubscription) {
        this.stats.totalSubscriptions = this.subscriptions.size;
        this.stats.activeSubscriptions = this.subscriptions.size;
        return;
      }

      const counts = await this.models.PushSubscription.findAll({
        attributes: [
          [this.models.sequelize.fn('COUNT', '*'), 'total'],
          [this.models.sequelize.fn('SUM', 
            this.models.sequelize.literal('CASE WHEN is_active = true THEN 1 ELSE 0 END')
          ), 'active']
        ],
        raw: true
      });

      if (counts && counts[0]) {
        this.stats.totalSubscriptions = parseInt(counts[0].total) || 0;
        this.stats.activeSubscriptions = parseInt(counts[0].active) || 0;
      }

    } catch (error) {
      logger.error('Erreur mise à jour stats push:', error.message);
    }
  }

  /**
   * 🧹 Nettoyer les abonnements expirés
   */
  async cleanupExpiredSubscriptions() {
    try {
      if (!this.models || !this.models.PushSubscription) {
        return 0;
      }

      // Supprimer les abonnements inactifs depuis plus de 30 jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleted = await this.models.PushSubscription.destroy({
        where: {
          is_active: false,
          updated_at: { [require('sequelize').Op.lt]: thirtyDaysAgo }
        }
      });

      if (deleted > 0) {
        logger.info('Abonnements push expirés supprimés', { count: deleted });
        await this.updateStats();
      }

      return deleted;

    } catch (error) {
      logger.error('Erreur nettoyage abonnements push:', error.message);
      return 0;
    }
  }

  /**
   * 🔧 Obtenir les clés VAPID publiques
   */
  getVapidPublicKey() {
    return this.vapidKeys ? this.vapidKeys.publicKey : null;
  }

  /**
   * 📊 Obtenir les statistiques
   */
  getStats() {
    return {
      ...this.stats,
      subscriptions_cached: this.subscriptions.size,
      vapid_configured: !!this.vapidKeys,
      encryption_enabled: !!this.encryptionService?.isInitialized
    };
  }

  /**
   * 📋 Obtenir le statut du service
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasModels: !!this.models,
      hasEncryptionService: !!this.encryptionService?.isInitialized,
      stats: this.getStats(),
      vapidPublicKey: this.getVapidPublicKey(),
      security: {
        encryption_enabled: !!this.encryptionService?.isInitialized,
        endpoints_encrypted: true,
        keys_encrypted: true,
        endpoints_masked_in_logs: true
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🧹 Nettoyage du service
   */
  async cleanup() {
    this.subscriptions.clear();
    this.isInitialized = false;
    logger.info(this.name + ' nettoyé');
  }
}

module.exports = new PushService();