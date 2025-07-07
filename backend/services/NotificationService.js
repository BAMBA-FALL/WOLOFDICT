// =============================================================================
// 🌍 WOLOFDICT - NOTIFICATION SERVICE COMPLET
// Service de notifications aligné avec le modèle Notification
// =============================================================================

const logger = require('./LoggerService');
const { Op } = require('sequelize');

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.name = 'NotificationService';
    this.firebase = null;
    this.emailService = null;
    this.smsService = null;
    this.pushService = null;
    this.models = null;
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    this.subscriptions = new Map(); // WebSocket connections
    
    // Types de notifications ALIGNÉS avec le modèle
    this.notificationTypes = {
      // Mots et phrases
      NEW_WORD: 'new_word',
      WORD_VERIFIED: 'word_verified',
      WORD_COMMENT: 'word_comment',
      NEW_PHRASE: 'new_phrase',
      PHRASE_VERIFIED: 'phrase_verified',
      PHRASE_COMMENT: 'phrase_comment',
      
      // Social
      NEW_FOLLOWER: 'new_follower',
      LIKE_RECEIVED: 'like_received',
      FAVORITE_ADDED: 'favorite_added',
      RATING_RECEIVED: 'rating_received',
      
      // Contributions
      CONTRIBUTION_APPROVED: 'contribution_approved',
      CONTRIBUTION_REJECTED: 'contribution_rejected',
      
      // Événements
      EVENT_REMINDER: 'event_reminder',
      EVENT_CANCELLED: 'event_cancelled',
      EVENT_UPDATED: 'event_updated',
      
      // Forum
      FORUM_REPLY: 'forum_reply',
      FORUM_MENTION: 'forum_mention',
      FORUM_TOPIC_LOCKED: 'forum_topic_locked',
      COMMENT_REPLY: 'comment_reply',
      
      // Projets
      PROJECT_INVITATION: 'project_invitation',
      PROJECT_UPDATE: 'project_update',
      PROJECT_COMPLETED: 'project_completed',
      
      // Système
      SYSTEM_UPDATE: 'system_update',
      MAINTENANCE: 'maintenance',
      WELCOME: 'welcome',
      MODERATION_ACTION: 'moderation_action',
      
      // Gamification
      ACHIEVEMENT: 'achievement',
      STREAK_MILESTONE: 'streak_milestone',
      
      // Marketing
      NEWSLETTER: 'newsletter',
      
      // Personnalisé
      CUSTOM: 'custom'
    };

    // Canaux ALIGNÉS avec le modèle
    this.channels = {
      IN_APP: 'in_app',
      EMAIL: 'email',
      PUSH: 'push',
      SMS: 'sms'
    };

    // Priorités ALIGNÉES avec le modèle
    this.priorities = {
      LOW: 'low',
      NORMAL: 'normal',
      HIGH: 'high',
      URGENT: 'urgent'
    };

    // Types d'entités liées ALIGNÉS avec le modèle
    this.relatedTypes = {
      WORD: 'word',
      PHRASE: 'phrase',
      PROVERB: 'proverb',
      EVENT: 'event',
      PROJECT: 'project',
      FORUM_TOPIC: 'forum_topic',
      FORUM_POST: 'forum_post',
      COMMENT: 'comment',
      USER: 'user'
    };
  }

  async initialize() {
    try {
      // Charger Firebase Admin si configuré
      try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          const admin = require('firebase-admin');
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          
          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              databaseURL: process.env.FIREBASE_DATABASE_URL
            });
          }
          
          this.firebase = admin.messaging();
          logger.info('Firebase Admin initialisé pour push notifications');
        }
      } catch (error) {
        logger.warn('Firebase non disponible:', error.message);
      }

      // Charger les autres services
      try {
        this.emailService = require('./EmailService');
        logger.info('EmailService connecté à NotificationService');
      } catch (error) {
        logger.warn('EmailService non disponible');
      }

      try {
        this.smsService = require('./SMSService');
        logger.info('SMSService connecté à NotificationService');
      } catch (error) {
        logger.warn('SMSService non disponible');
      }

      try {
        this.pushService = require('./PushService');
        logger.info('PushService connecté à NotificationService');
      } catch (error) {
        logger.warn('PushService non disponible');
      }

      // Charger les modèles
      try {
        this.models = require('../models');
        logger.info('Modèles chargés dans NotificationService');
      } catch (error) {
        logger.warn('Modèles non disponibles');
      }

      // Démarrer le processeur de queue
      this.startQueueProcessor();
      
      this.isInitialized = true;
      logger.info('NotificationService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation NotificationService:', error.message);
      throw error;
    }
  }

  /**
   * 📨 Envoyer une notification - ALIGNÉ avec le modèle
   */
  async sendNotification(notificationData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        userId,
        type,
        title,
        message,
        shortMessage = null,
        channel = this.channels.IN_APP,
        priority = this.priorities.NORMAL,
        actionUrl = null,
        actionText = null,
        icon = null,
        color = null,
        imageUrl = null,
        data = {},
        relatedType = null,
        relatedId = null,
        senderId = null,
        scheduledFor = null,
        expiresAt = null,
        templateId = null,
        personalizationData = {},
        groupKey = null,
        batchId = null
      } = notificationData;

      // Validation des données
      if (!userId || !type || !title || !message) {
        throw new Error('userId, type, title et message sont requis');
      }

      // Vérifier que l'utilisateur existe
      const user = await this.getUserWithPreferences(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Créer la notification en base AVEC TOUS LES CHAMPS DU MODÈLE
      const notification = await this.createNotificationInDB({
        user_id: userId,
        type,
        title,
        message,
        short_message: shortMessage,
        action_url: actionUrl,
        action_text: actionText,
        priority,
        channel,
        icon,
        color,
        image_url: imageUrl,
        data,
        related_type: relatedType,
        related_id: relatedId,
        sender_id: senderId,
        expires_at: expiresAt,
        scheduled_for: scheduledFor,
        is_scheduled: !!scheduledFor,
        template_id: templateId,
        personalization_data: personalizationData,
        group_key: groupKey,
        batch_id: batchId,
        is_grouped: !!groupKey,
        is_read: false,
        is_delivered: false,
        delivery_attempts: 0
      });

      // Programmer ou envoyer immédiatement
      if (scheduledFor && new Date(scheduledFor) > new Date()) {
        logger.info('Notification programmée:', {
          id: notification.id,
          scheduledFor: scheduledFor
        });
        return {
          success: true,
          notificationId: notification.id,
          scheduled: true
        };
      } else {
        return await this.deliverNotification(notification, user);
      }

    } catch (error) {
      logger.error('Erreur envoi notification:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Créer notification en base de données - UTILISE TOUS LES CHAMPS
   */
  async createNotificationInDB(notificationData) {
    try {
      if (!this.models || !this.models.Notification) {
        throw new Error('Modèle Notification non disponible');
      }

      const notification = await this.models.Notification.create(notificationData);
      
      logger.debug('Notification créée en BDD:', {
        id: notification.id,
        type: notification.type,
        user_id: notification.user_id
      });

      return notification;

    } catch (error) {
      logger.error('Erreur création notification BDD:', error.message);
      throw error;
    }
  }

  /**
   * 🚀 Livrer une notification - SELON LE CANAL
   */
  async deliverNotification(notification, user = null) {
    try {
      if (!user) {
        user = await this.getUserWithPreferences(notification.user_id);
      }

      const results = {
        notification_id: notification.id,
        channel: notification.channel,
        success: false,
        delivery_results: {}
      };

      // Vérifier les préférences utilisateur
      const userPrefs = user.notificationPreferences || {};
      
      // Incrémenter les tentatives de livraison
      await notification.incrementDeliveryAttempt();

      try {
        switch (notification.channel) {
          case this.channels.IN_APP:
            results.delivery_results.in_app = await this.deliverInApp(notification, user);
            break;

          case this.channels.EMAIL:
            if (userPrefs.allowEmail !== false) {
              results.delivery_results.email = await this.deliverEmail(notification, user);
            } else {
              results.delivery_results.email = { success: false, reason: 'user_disabled' };
            }
            break;

          case this.channels.PUSH:
            if (userPrefs.allowPush !== false) {
              results.delivery_results.push = await this.deliverPush(notification, user);
            } else {
              results.delivery_results.push = { success: false, reason: 'user_disabled' };
            }
            break;

          case this.channels.SMS:
            if (userPrefs.allowSMS !== false) {
              results.delivery_results.sms = await this.deliverSMS(notification, user);
            } else {
              results.delivery_results.sms = { success: false, reason: 'user_disabled' };
            }
            break;

          default:
            throw new Error(`Canal non supporté: ${notification.channel}`);
        }

        // Vérifier si au moins une livraison a réussi
        const hasSuccessfulDelivery = Object.values(results.delivery_results)
          .some(result => result.success);

        if (hasSuccessfulDelivery) {
          await notification.markAsDelivered();
          results.success = true;
        }

        logger.info('Notification livrée:', {
          id: notification.id,
          channel: notification.channel,
          success: results.success
        });

        return results;

      } catch (deliveryError) {
        await notification.incrementDeliveryAttempt(deliveryError);
        
        // Programmer un retry si nécessaire
        if (notification.shouldRetryDelivery()) {
          this.scheduleRetry(notification);
        }

        throw deliveryError;
      }

    } catch (error) {
      logger.error('Erreur livraison notification:', error.message);
      throw error;
    }
  }

  /**
   * 📱 Livraison in-app (temps réel)
   */
  async deliverInApp(notification, user) {
    try {
      // Envoyer en temps réel via WebSocket
      const realtimeResult = await this.sendRealtime(notification);
      
      return {
        success: true,
        realtime_sent: realtimeResult.success,
        connections: realtimeResult.sentTo || 0
      };

    } catch (error) {
      logger.error('Erreur livraison in-app:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📧 Livraison email
   */
  async deliverEmail(notification, user) {
    try {
      if (!this.emailService) {
        return { success: false, reason: 'email_service_unavailable' };
      }

      const emailData = {
        to: user.email,
        subject: notification.title,
        template: notification.template_id || 'notification',
        data: {
          userName: user.first_name || user.username || user.email,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.action_url,
          actionText: notification.action_text,
          type: notification.type,
          ...notification.personalization_data
        }
      };

      await this.emailService.sendEmail(emailData);
      
      return { success: true };

    } catch (error) {
      logger.error('Erreur livraison email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📱 Livraison push
   */
  async deliverPush(notification, user) {
    try {
      if (this.pushService) {
        // Utiliser notre PushService
        const pushData = {
          title: notification.title,
          body: notification.short_message || notification.message,
          icon: notification.icon,
          data: {
            notificationId: notification.id,
            type: notification.type,
            actionUrl: notification.action_url,
            ...notification.data
          },
          actions: notification.action_text ? [{
            action: 'view',
            title: notification.action_text
          }] : []
        };

        const result = await this.pushService.sendToUser(user.id, pushData);
        return { success: result.sent > 0, sent: result.sent };

      } else if (this.firebase && user.fcmToken) {
        // Utiliser Firebase directement
        const message = {
          token: user.fcmToken,
          notification: {
            title: notification.title,
            body: notification.short_message || notification.message
          },
          data: {
            notificationId: notification.id.toString(),
            type: notification.type,
            actionUrl: notification.action_url || '',
            ...notification.data
          }
        };

        const response = await this.firebase.send(message);
        return { success: true, messageId: response };

      } else {
        return { success: false, reason: 'no_push_service_or_token' };
      }

    } catch (error) {
      logger.error('Erreur livraison push:', error.message);
      
      // Token invalide, le supprimer
      if (error.code === 'messaging/registration-token-not-registered') {
        await this.invalidateFCMToken(user.id);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * 📱 Livraison SMS
   */
  async deliverSMS(notification, user) {
    try {
      if (!this.smsService) {
        return { success: false, reason: 'sms_service_unavailable' };
      }

      if (!user.phone_number) {
        return { success: false, reason: 'no_phone_number' };
      }

      // SMS uniquement pour notifications importantes
      if (!['high', 'urgent'].includes(notification.priority)) {
        return { success: false, reason: 'priority_too_low' };
      }

      const smsText = `${notification.title}: ${notification.short_message || notification.message}`;
      
      const result = await this.smsService.sendSMS(user.phone_number, smsText, {
        type: 'notification',
        priority: notification.priority
      });

      return { success: result.success, messageId: result.messageId };

    } catch (error) {
      logger.error('Erreur livraison SMS:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * ⏰ Temps réel via WebSocket
   */
  async sendRealtime(notification) {
    try {
      const userConnections = this.subscriptions.get(notification.user_id.toString());
      
      if (!userConnections || userConnections.size === 0) {
        return { success: false, reason: 'user_not_connected' };
      }

      const realtimeData = notification.getDisplayData();

      let sentCount = 0;
      userConnections.forEach(connection => {
        try {
          if (connection.readyState === 1) { // WebSocket OPEN
            connection.send(JSON.stringify({
              type: 'notification',
              payload: realtimeData
            }));
            sentCount++;
          }
        } catch (error) {
          logger.debug('Erreur envoi WebSocket:', error.message);
        }
      });

      return { success: sentCount > 0, sentTo: sentCount };

    } catch (error) {
      logger.error('Erreur notification temps réel:', error.message);
      return { success: false, error: error.message };
    }
  }

  // =============================================================================
  // 🎯 MÉTHODES SPÉCIALISÉES PAR TYPE - UTILISANT LES VRAIS TYPES DU MODÈLE
  // =============================================================================

  /**
   * 📚 Nouveau mot ajouté
   */
  async notifyNewWord(userId, wordData, senderId = null) {
    return this.sendNotification({
      userId,
      type: this.notificationTypes.NEW_WORD,
      title: 'Nouveau mot ajouté !',
      message: `Le mot "${wordData.wolof}" (${wordData.french}) a été ajouté au dictionnaire`,
      shortMessage: `Nouveau mot : ${wordData.wolof}`,
      channel: this.channels.IN_APP,
      priority: this.priorities.NORMAL,
      actionUrl: `/words/${wordData.id}`,
      actionText: 'Voir le mot',
      icon: 'book',
      color: '#10B981',
      relatedType: this.relatedTypes.WORD,
      relatedId: wordData.id,
      senderId,
      data: {
        word_id: wordData.id,
        wolof: wordData.wolof,
        french: wordData.french
      }
    });
  }

  /**
   * ✅ Mot vérifié/approuvé
   */
  async notifyWordVerified(userId, wordData, senderId = null) {
    return this.sendNotification({
      userId,
      type: this.notificationTypes.WORD_VERIFIED,
      title: 'Contribution approuvée !',
      message: `Votre mot "${wordData.wolof}" a été vérifié et publié`,
      shortMessage: `Mot approuvé : ${wordData.wolof}`,
      channel: this.channels.PUSH,
      priority: this.priorities.HIGH,
      actionUrl: `/words/${wordData.id}`,
      actionText: 'Voir le mot',
      icon: 'check-circle',
      color: '#059669',
      relatedType: this.relatedTypes.WORD,
      relatedId: wordData.id,
      senderId
    });
  }

  /**
   * 💬 Nouveau commentaire sur mot
   */
  async notifyWordComment(userId, wordData, commentData, senderId) {
    return this.sendNotification({
      userId,
      type: this.notificationTypes.WORD_COMMENT,
      title: 'Nouveau commentaire',
      message: `${commentData.author} a commenté le mot "${wordData.wolof}"`,
      shortMessage: `Commentaire sur ${wordData.wolof}`,
      channel: this.channels.IN_APP,
      priority: this.priorities.NORMAL,
      actionUrl: `/words/${wordData.id}#comment-${commentData.id}`,
      actionText: 'Voir le commentaire',
      icon: 'message-circle',
      color: '#3B82F6',
      relatedType: this.relatedTypes.COMMENT,
      relatedId: commentData.id,
      senderId,
      groupKey: `word_comment_${wordData.id}`
    });
  }

  /**
   * 👤 Nouveau follower
   */
  async notifyNewFollower(userId, followerData) {
    return this.sendNotification({
      userId,
      type: this.notificationTypes.NEW_FOLLOWER,
      title: 'Nouveau follower !',
      message: `${followerData.username} vous suit maintenant`,
      shortMessage: `${followerData.username} vous suit`,
      channel: this.channels.IN_APP,
      priority: this.priorities.NORMAL,
      actionUrl: `/users/${followerData.id}`,
      actionText: 'Voir le profil',
      icon: 'user-plus',
      color: '#8B5CF6',
      relatedType: this.relatedTypes.USER,
      relatedId: followerData.id,
      senderId: followerData.id
    });
  }

  /**
   * 📅 Rappel d'événement
   */
  async notifyEventReminder(userId, eventData, reminderType = 'day_before') {
    const reminderTimes = {
      'week_before': '1 semaine',
      'day_before': '1 jour',
      'hour_before': '1 heure'
    };

    return this.sendNotification({
      userId,
      type: this.notificationTypes.EVENT_REMINDER,
      title: 'Rappel d\'événement',
      message: `"${eventData.title}" commence dans ${reminderTimes[reminderType]}`,
      shortMessage: `Événement dans ${reminderTimes[reminderType]}`,
      channel: this.channels.PUSH,
      priority: this.priorities.HIGH,
      actionUrl: `/events/${eventData.id}`,
      actionText: 'Voir l\'événement',
      icon: 'calendar',
      color: '#F59E0B',
      relatedType: this.relatedTypes.EVENT,
      relatedId: eventData.id,
      data: {
        event_id: eventData.id,
        reminder_type: reminderType,
        event_date: eventData.start_date
      }
    });
  }

  /**
   * 🏆 Achievement débloqué
   */
  async notifyAchievement(userId, achievementData) {
    return this.sendNotification({
      userId,
      type: this.notificationTypes.ACHIEVEMENT,
      title: 'Achievement débloqué !',
      message: `Félicitations ! Vous avez débloqué "${achievementData.title}"`,
      shortMessage: `Achievement : ${achievementData.title}`,
      channel: this.channels.PUSH,
      priority: this.priorities.HIGH,
      actionUrl: `/profile/achievements`,
      actionText: 'Voir mes achievements',
      icon: 'trophy',
      color: '#F59E0B',
      data: {
        achievement_id: achievementData.id,
        achievement_type: achievementData.type
      }
    });
  }

  /**
   * 💌 Réponse de forum
   */
  async notifyForumReply(userId, topicData, replyData, senderId) {
    return this.sendNotification({
      userId,
      type: this.notificationTypes.FORUM_REPLY,
      title: 'Nouvelle réponse',
      message: `${replyData.author} a répondu à "${topicData.title}"`,
      shortMessage: `Réponse dans ${topicData.title}`,
      channel: this.channels.IN_APP,
      priority: this.priorities.NORMAL,
      actionUrl: `/forum/topics/${topicData.id}#post-${replyData.id}`,
      actionText: 'Voir la réponse',
      icon: 'message-square',
      color: '#8B5CF6',
      relatedType: this.relatedTypes.FORUM_POST,
      relatedId: replyData.id,
      senderId,
      groupKey: `forum_reply_${topicData.id}`
    });
  }

  // =============================================================================
  // 📋 GESTION DES NOTIFICATIONS - UTILISANT LES MÉTHODES DU MODÈLE
  // =============================================================================

  /**
   * 📖 Marquer comme lu
   */
  async markAsRead(notificationId, userId) {
    try {
      if (!this.models || !this.models.Notification) {
        return { success: false, reason: 'model_unavailable' };
      }

      const notification = await this.models.Notification.findOne({
        where: { id: notificationId, user_id: userId }
      });

      if (!notification) {
        return { success: false, reason: 'notification_not_found' };
      }

      // UTILISER LA MÉTHODE DU MODÈLE
      await notification.markAsRead();

      // Notifier en temps réel
      await this.sendRealtime({
        user_id: userId,
        getDisplayData: () => ({
          type: 'notification_read',
          notification_id: notificationId
        })
      });

      return { success: true };

    } catch (error) {
      logger.error('Erreur marquage notification lue:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📖 Marquer toutes comme lues
   */
  async markAllAsRead(userId) {
    try {
      if (!this.models || !this.models.Notification) {
        return { success: false, reason: 'model_unavailable' };
      }

      // UTILISER LA MÉTHODE STATIQUE DU MODÈLE
      await this.models.Notification.markAllAsReadByUser(userId);

      // Notifier en temps réel
      await this.sendRealtime({
        user_id: userId,
        getDisplayData: () => ({
          type: 'all_notifications_read'
        })
      });

      return { success: true };

    } catch (error) {
      logger.error('Erreur marquage toutes notifications lues:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 Obtenir les notifications non lues
   */
  async getUnreadNotifications(userId, options = {}) {
    try {
      if (!this.models || !this.models.Notification) {
        return [];
      }

      // UTILISER LA MÉTHODE DU MODÈLE
      const notifications = await this.models.Notification.findUnreadByUser(userId, {
        limit: options.limit || 20,
        offset: options.offset || 0,
        include: [
          {
            model: this.models.User,
            as: 'sender',
            attributes: ['id', 'username', 'first_name', 'last_name', 'avatar']
          }
        ]
      });

      return notifications.map(notif => notif.getDisplayData());

    } catch (error) {
      logger.error('Erreur récupération notifications non lues:', error.message);
      return [];
    }
  }

  /**
   * 🔢 Compter les notifications non lues
   */
  async getUnreadCount(userId) {
    try {
      if (!this.models || !this.models.Notification) {
        return 0;
      }

      // UTILISER LA MÉTHODE DU MODÈLE
      return await this.models.Notification.getUnreadCount(userId);

    } catch (error) {
      logger.error('Erreur comptage notifications non lues:', error.message);
      return 0;
    }
  }

  // =============================================================================
  // 🔄 GESTION DE LA QUEUE ET PROGRAMMATION
  // =============================================================================

  /**
   * 🔄 Processeur de queue
   */
  startQueueProcessor() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    const processQueue = async () => {
      try {
        // Traiter les notifications programmées
        await this.processScheduledNotifications();
        
        // Traiter les retry
        await this.processRetryQueue();
        
      } catch (error) {
        logger.error('Erreur processeur queue notifications:', error.message);
      }
      
      // Relancer dans 30 secondes
      setTimeout(processQueue, 30000);
    };
    
    processQueue();
  }

  /**
   * ⏰ Traiter les notifications programmées
   */
  async processScheduledNotifications() {
    try {
      if (!this.models || !this.models.Notification) {
        return;
      }

      // UTILISER LA MÉTHODE DU MODÈLE pour récupérer les notifications à envoyer
      const pendingNotifications = await this.models.Notification.getPendingDeliveries();

      for (const notification of pendingNotifications) {
        try {
          await this.deliverNotification(notification);
          
        } catch (error) {
          logger.error('Erreur livraison notification programmée:', {
            notification_id: notification.id,
            error: error.message
          });
        }
      }

      if (pendingNotifications.length > 0) {
        logger.info('Notifications programmées traitées:', pendingNotifications.length);
      }

    } catch (error) {
      logger.error('Erreur traitement notifications programmées:', error.message);
    }
  }

  /**
   * 🔁 Traiter la queue de retry
   */
  async processRetryQueue() {
    try {
      if (!this.models || !this.models.Notification) {
        return;
      }

      // Récupérer les notifications qui doivent être retentées
      const retryNotifications = await this.models.Notification.findAll({
        where: {
          is_delivered: false,
          delivery_attempts: { [Op.lt]: 3 },
          last_delivery_attempt: {
            [Op.lt]: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
          },
          [Op.or]: [
            { expires_at: null },
            { expires_at: { [Op.gt]: new Date() } }
          ]
        },
        include: [
          {
            model: this.models.User,
            as: 'user'
          }
        ]
      });

      for (const notification of retryNotifications) {
        try {
          if (notification.shouldRetryDelivery()) {
            await this.deliverNotification(notification, notification.user);
          }
          
        } catch (error) {
          logger.error('Erreur retry notification:', {
            notification_id: notification.id,
            error: error.message
          });
        }
      }

    } catch (error) {
      logger.error('Erreur traitement retry queue:', error.message);
    }
  }

  /**
   * 📅 Programmer un retry
   */
  scheduleRetry(notification) {
    // Le retry est géré directement par le processeur de queue
    // qui vérifie shouldRetryDelivery() du modèle
    logger.debug('Retry programmé pour notification:', notification.id);
  }

  // =============================================================================
  // 📊 NOTIFICATIONS EN MASSE - UTILISANT LES MÉTHODES DU MODÈLE
  // =============================================================================

  /**
   * 📢 Envoyer des notifications en masse
   */
  async sendBulkNotifications(notifications) {
    try {
      if (!this.models || !this.models.Notification) {
        throw new Error('Modèle Notification non disponible');
      }

      // Générer un batch_id unique
      const batchId = require('crypto').randomUUID();

      // Préparer les notifications avec batch_id
      const notificationsWithBatch = notifications.map(notif => ({
        user_id: notif.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        short_message: notif.shortMessage,
        action_url: notif.actionUrl,
        action_text: notif.actionText,
        priority: notif.priority || this.priorities.NORMAL,
        channel: notif.channel || this.channels.IN_APP,
        icon: notif.icon,
        color: notif.color,
        image_url: notif.imageUrl,
        data: notif.data || {},
        related_type: notif.relatedType,
        related_id: notif.relatedId,
        sender_id: notif.senderId,
        expires_at: notif.expiresAt,
        scheduled_for: notif.scheduledFor,
        is_scheduled: !!notif.scheduledFor,
        template_id: notif.templateId,
        personalization_data: notif.personalizationData || {},
        group_key: notif.groupKey,
        batch_id: batchId,
        is_grouped: !!notif.groupKey,
        is_read: false,
        is_delivered: false,
        delivery_attempts: 0
      }));

      // UTILISER LA MÉTHODE DU MODÈLE pour création en masse
      const createdNotifications = await this.models.Notification.createBulk(notificationsWithBatch);

      logger.info('Notifications en masse créées:', {
        batch_id: batchId,
        count: createdNotifications.length
      });

      // Les livrer si elles ne sont pas programmées
      const immediateNotifications = createdNotifications.filter(n => !n.scheduled_for);
      
      let delivered = 0;
      for (const notification of immediateNotifications) {
        try {
          await this.deliverNotification(notification);
          delivered++;
        } catch (error) {
          logger.error('Erreur livraison notification en masse:', {
            notification_id: notification.id,
            error: error.message
          });
        }
      }

      return {
        success: true,
        batch_id: batchId,
        created: createdNotifications.length,
        delivered: delivered,
        scheduled: createdNotifications.length - immediateNotifications.length
      };

    } catch (error) {
      logger.error('Erreur envoi notifications en masse:', error.message);
      throw error;
    }
  }

  /**
   * 🎯 Notifier tous les utilisateurs d'un type
   */
  async notifyUsersByType(userType, notificationData) {
    try {
      if (!this.models || !this.models.User) {
        throw new Error('Modèle User non disponible');
      }

      // Récupérer les utilisateurs selon le type
      let whereClause = {};
      
      switch (userType) {
        case 'premium':
          whereClause = {
            '$subscription.status$': 'active',
            '$subscription.plan.slug$': { [Op.in]: ['premium', 'pro'] }
          };
          break;
        case 'free':
          whereClause = {
            [Op.or]: [
              { '$subscription$': null },
              { '$subscription.plan.slug$': 'free' }
            ]
          };
          break;
        case 'contributors':
          whereClause = {
            '$contributions.id$': { [Op.ne]: null }
          };
          break;
        case 'active':
          whereClause = {
            last_login_at: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          };
          break;
      }

      const users = await this.models.User.findAll({
        where: whereClause,
        include: [
          { model: this.models.Subscription, as: 'subscription', include: ['plan'] },
          { model: this.models.UserContribution, as: 'contributions' }
        ],
        attributes: ['id']
      });

      // Créer une notification pour chaque utilisateur
      const notifications = users.map(user => ({
        userId: user.id,
        ...notificationData
      }));

      return await this.sendBulkNotifications(notifications);

    } catch (error) {
      logger.error('Erreur notification par type utilisateur:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🔌 GESTION DES CONNEXIONS WEBSOCKET
  // =============================================================================

  /**
   * ➕ Ajouter une connexion WebSocket
   */
  addWebSocketConnection(userId, connection) {
    const userIdStr = userId.toString();
    
    if (!this.subscriptions.has(userIdStr)) {
      this.subscriptions.set(userIdStr, new Set());
    }
    
    this.subscriptions.get(userIdStr).add(connection);
    
    // Nettoyer à la déconnexion
    connection.on('close', () => {
      this.removeWebSocketConnection(userId, connection);
    });
    
    // Envoyer le nombre de notifications non lues
    this.sendUnreadCount(userId, connection);
    
    logger.debug('Connexion WebSocket ajoutée pour utilisateur:', userId);
  }

  /**
   * ➖ Supprimer une connexion WebSocket
   */
  removeWebSocketConnection(userId, connection) {
    const userIdStr = userId.toString();
    const userConnections = this.subscriptions.get(userIdStr);
    
    if (userConnections) {
      userConnections.delete(connection);
      
      if (userConnections.size === 0) {
        this.subscriptions.delete(userIdStr);
      }
    }
    
    logger.debug('Connexion WebSocket supprimée pour utilisateur:', userId);
  }

  /**
   * 📊 Envoyer le nombre de notifications non lues
   */
  async sendUnreadCount(userId, connection = null) {
    try {
      const unreadCount = await this.getUnreadCount(userId);
      
      const message = JSON.stringify({
        type: 'unread_count',
        payload: { count: unreadCount }
      });

      if (connection) {
        // Envoyer à une connexion spécifique
        if (connection.readyState === 1) {
          connection.send(message);
        }
      } else {
        // Envoyer à toutes les connexions de l'utilisateur
        const userConnections = this.subscriptions.get(userId.toString());
        if (userConnections) {
          userConnections.forEach(conn => {
            if (conn.readyState === 1) {
              conn.send(message);
            }
          });
        }
      }

    } catch (error) {
      logger.error('Erreur envoi unread count:', error.message);
    }
  }

  // =============================================================================
  // 🛠️ MÉTHODES UTILITAIRES
  // =============================================================================

  /**
   * 👤 Récupérer utilisateur avec préférences
   */
  async getUserWithPreferences(userId) {
    try {
      if (!this.models || !this.models.User) {
        return null;
      }

      return await this.models.User.findByPk(userId, {
        include: [
          { 
            model: this.models.Subscription, 
            as: 'subscription',
            include: [{ model: this.models.Plan, as: 'plan' }]
          }
        ]
      });

    } catch (error) {
      logger.error('Erreur récupération utilisateur:', error.message);
      return null;
    }
  }

  /**
   * 🏆 Vérifier si utilisateur a premium
   */
  userHasPremium(user) {
    return user.subscription && 
           ['premium', 'pro'].includes(user.subscription.plan?.slug) &&
           user.subscription.status === 'active';
  }

  /**
   * 🔑 Invalider token FCM
   */
  async invalidateFCMToken(userId) {
    try {
      if (this.models && this.models.User) {
        await this.models.User.update(
          { fcm_token: null },
          { where: { id: userId } }
        );
      }
    } catch (error) {
      logger.error('Erreur invalidation FCM token:', error.message);
    }
  }

  // =============================================================================
  // 📊 STATISTIQUES ET ANALYTICS
  // =============================================================================

  /**
   * 📈 Obtenir les statistiques de notifications
   */
  async getNotificationStats(period = 'month') {
    try {
      if (!this.models || !this.models.Notification) {
        return {};
      }

      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Statistiques globales
      const stats = await this.models.Notification.findAll({
        attributes: [
          'type',
          'channel',
          'priority',
          [this.models.sequelize.fn('COUNT', '*'), 'count'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.cast(this.models.sequelize.col('is_delivered'), 'SIGNED')), 'delivered'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.cast(this.models.sequelize.col('is_read'), 'SIGNED')), 'read']
        ],
        where: {
          created_at: { [Op.gte]: startDate }
        },
        group: ['type', 'channel', 'priority'],
        raw: true
      });

      // Organiser les données
      const result = {
        period,
        total_sent: 0,
        total_delivered: 0,
        total_read: 0,
        by_type: {},
        by_channel: {},
        by_priority: {},
        delivery_rate: 0,
        read_rate: 0
      };

      stats.forEach(stat => {
        const count = parseInt(stat.count);
        const delivered = parseInt(stat.delivered);
        const read = parseInt(stat.read);

        result.total_sent += count;
        result.total_delivered += delivered;
        result.total_read += read;

        // Par type
        if (!result.by_type[stat.type]) {
          result.by_type[stat.type] = { sent: 0, delivered: 0, read: 0 };
        }
        result.by_type[stat.type].sent += count;
        result.by_type[stat.type].delivered += delivered;
        result.by_type[stat.type].read += read;

        // Par canal
        if (!result.by_channel[stat.channel]) {
          result.by_channel[stat.channel] = { sent: 0, delivered: 0, read: 0 };
        }
        result.by_channel[stat.channel].sent += count;
        result.by_channel[stat.channel].delivered += delivered;
        result.by_channel[stat.channel].read += read;

        // Par priorité
        if (!result.by_priority[stat.priority]) {
          result.by_priority[stat.priority] = { sent: 0, delivered: 0, read: 0 };
        }
        result.by_priority[stat.priority].sent += count;
        result.by_priority[stat.priority].delivered += delivered;
        result.by_priority[stat.priority].read += read;
      });

      // Calculer les taux
      result.delivery_rate = result.total_sent > 0 ? 
        Math.round((result.total_delivered / result.total_sent) * 100) : 0;
      result.read_rate = result.total_delivered > 0 ? 
        Math.round((result.total_read / result.total_delivered) * 100) : 0;

      return result;

    } catch (error) {
      logger.error('Erreur statistiques notifications:', error.message);
      return {};
    }
  }

  /**
   * 🔍 Obtenir les statistiques par utilisateur
   */
  async getUserNotificationStats(userId, period = 'month') {
    try {
      if (!this.models || !this.models.Notification) {
        return {};
      }

      // UTILISER LA MÉTHODE DU MODÈLE
      return await this.models.Notification.getStatsByUser(userId, period);

    } catch (error) {
      logger.error('Erreur statistiques utilisateur:', error.message);
      return {};
    }
  }

  // =============================================================================
  // 🧹 MAINTENANCE ET NETTOYAGE
  // =============================================================================

  /**
   * 🧹 Nettoyage périodique
   */
  async performMaintenance() {
    try {
      logger.info('Début maintenance NotificationService');

      const results = {
        expired_cleaned: 0,
        connections_cleaned: 0,
        failed_deliveries_cleaned: 0
      };

      // Supprimer les notifications expirées - UTILISER LA MÉTHODE DU MODÈLE
      if (this.models && this.models.Notification) {
        results.expired_cleaned = await this.models.Notification.cleanupExpired();
      }

      // Nettoyer les connexions WebSocket fermées
      this.subscriptions.forEach((connections, userId) => {
        const initialSize = connections.size;
        connections.forEach(connection => {
          if (connection.readyState !== 1) {
            connections.delete(connection);
            results.connections_cleaned++;
          }
        });
        
        if (connections.size === 0) {
          this.subscriptions.delete(userId);
        }
      });

      // Nettoyer les notifications qui ont échoué définitivement
      if (this.models && this.models.Notification) {
        const failedDeliveries = await this.models.Notification.destroy({
          where: {
            is_delivered: false,
            delivery_attempts: { [Op.gte]: 3 },
            created_at: { [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 jours
          }
        });
        results.failed_deliveries_cleaned = failedDeliveries;
      }

      logger.info('Maintenance NotificationService terminée', results);
      return results;

    } catch (error) {
      logger.error('Erreur maintenance NotificationService:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Obtenir le statut du service
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasFirebase: !!this.firebase,
      hasEmailService: !!this.emailService,
      hasSMSService: !!this.smsService,
      hasPushService: !!this.pushService,
      hasModels: !!this.models,
      queueSize: this.notificationQueue.length,
      activeConnections: this.subscriptions.size,
      isProcessingQueue: this.isProcessingQueue,
      features: {
        realtime: true,
        push: !!this.firebase || !!this.pushService,
        email: !!this.emailService,
        sms: !!this.smsService,
        scheduling: true,
        bulk_notifications: true,
        templates: true,
        analytics: true
      },
      supported_types: Object.values(this.notificationTypes),
      supported_channels: Object.values(this.channels),
      supported_priorities: Object.values(this.priorities),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🧹 Nettoyage du service
   */
  async cleanup() {
    this.notificationQueue = [];
    this.subscriptions.clear();
    this.isProcessingQueue = false;
    this.isInitialized = false;
    
    logger.info(this.name + ' nettoyé');
  }
}

module.exports = new NotificationService();