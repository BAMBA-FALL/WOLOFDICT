// =============================================================================
// 📰 WOLOFDICT - NEWSLETTERSERVICE CORRIGÉ ET ALIGNÉ
// Service de gestion des newsletters avec abonnements et envois en masse
// =============================================================================

const logger = require('./LoggerService');
const { Op } = require('sequelize');

class NewsletterService {
  constructor() {
    this.isInitialized = false;
    this.name = 'NewsletterService';
    this.models = null;
    this.emailService = null;
    this.subscriptionStats = {
      totalSubscribers: 0,
      activeSubscribers: 0,
      pendingVerification: 0,
      unsubscribed: 0,
      bouncing: 0,
      complained: 0
    };
    this.campaignStats = {
      totalCampaigns: 0,
      sent: 0,
      drafts: 0,
      scheduled: 0,
      sending: 0,
      failed: 0
    };
  }

  async initialize() {
    try {
      // Import des modèles Sequelize
      try {
        this.models = require('../models');
        logger.info('Modèles Sequelize chargés dans NewsletterService');
      } catch (error) {
        logger.warn('Modèles Sequelize non disponibles, mode mock activé');
      }

      // Import du service Email
      try {
        this.emailService = require('./EmailService');
        if (!this.emailService.isInitialized) {
          await this.emailService.initialize();
        }
        logger.info('EmailService connecté au NewsletterService');
      } catch (error) {
        logger.warn('EmailService non disponible pour NewsletterService');
      }

      // Calculer les statistiques initiales
      await this.updateStats();
      
      // Nettoyer les abonnements non confirmés (tâche de maintenance)
      await this.cleanupExpiredTokens();
      
      this.isInitialized = true;
      logger.info('NewsletterService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation NewsletterService:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 📧 GESTION DES ABONNEMENTS - ALIGNÉ AVEC LE MODÈLE
  // =============================================================================

  /**
   * 📝 S'abonner à la newsletter - CORRIGÉ
   */
  async subscribe(email, userData = {}) {
    try {
      if (!this.isValidEmail(email)) {
        throw new Error('Adresse email invalide');
      }

      if (this.models && this.models.NewsletterSubscription) {
        // Vérifier si déjà abonné
        const existingSubscription = await this.models.NewsletterSubscription.findOne({
          where: { email }
        });

        if (existingSubscription) {
          if (existingSubscription.is_active && existingSubscription.is_confirmed) {
            return {
              success: true,
              message: 'Déjà abonné à la newsletter',
              subscription: existingSubscription
            };
          } else if (existingSubscription.is_active && !existingSubscription.is_confirmed) {
            // Renvoyer email de confirmation
            await this.sendConfirmationEmail(email, {
              ...userData,
              confirmation_token: existingSubscription.confirmation_token
            });
            
            return {
              success: true,
              message: 'Email de confirmation renvoyé',
              subscription: existingSubscription
            };
          } else {
            // Réactiver l'abonnement
            await existingSubscription.reactivate();
            
            // Envoyer nouvel email de confirmation
            await this.sendConfirmationEmail(email, {
              ...userData,
              confirmation_token: existingSubscription.confirmation_token
            });
            
            return {
              success: true,
              message: 'Abonnement réactivé, vérifiez votre email',
              subscription: existingSubscription
            };
          }
        }

        // Créer nouvel abonnement - UTILISANT LES VRAIS CHAMPS DU MODÈLE
        const subscription = await this.models.NewsletterSubscription.create({
          email,
          user_id: userData.user_id || null,
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          language_preference: userData.language_preference || 'français',
          subscription_source: this.mapSource(userData.source || 'website'),
          frequency_preference: userData.frequency_preference || 'weekly',
          content_preferences: userData.content_preferences || {
            new_words: true,
            new_phrases: true,
            events: true,
            community_highlights: true,
            learning_tips: true,
            cultural_content: true,
            project_updates: false,
            technical_updates: false
          },
          demographics: userData.demographics || {},
          interests: userData.interests || [],
          referrer_url: userData.referrer_url || null,
          utm_source: userData.utm_source || null,
          utm_medium: userData.utm_medium || null,
          utm_campaign: userData.utm_campaign || null,
          ip_address: userData.ip_address || null,
          user_agent: userData.user_agent || null
          // confirmation_token et unsubscribe_token générés automatiquement par le hook
        });

        // Envoyer email de confirmation
        await this.sendConfirmationEmail(email, {
          ...userData,
          confirmation_token: subscription.confirmation_token
        });

        logger.info('Newsletter subscription created', { 
          email, 
          subscription_id: subscription.id,
          language: subscription.language_preference,
          source: subscription.subscription_source
        });
        
        await this.updateStats();

        return {
          success: true,
          message: 'Abonnement créé, vérifiez votre email',
          subscription
        };

      } else {
        // Mode mock
        logger.warn('Mode mock: newsletter subscription');
        return {
          success: true,
          message: 'Abonnement newsletter simulé',
          subscription: {
            email,
            is_active: true,
            is_confirmed: false,
            mock: true
          }
        };
      }

    } catch (error) {
      logger.error('Erreur abonnement newsletter:', error.message);
      throw error;
    }
  }

  /**
   * ✅ Confirmer l'abonnement newsletter - UTILISE LA MÉTHODE NATIVE
   */
  async confirmSubscription(token) {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        throw new Error('Modèles non disponibles pour confirmation');
      }

      const subscription = await this.models.NewsletterSubscription.findOne({
        where: { 
          confirmation_token: token,
          is_active: true,
          is_confirmed: false
        }
      });

      if (!subscription) {
        throw new Error('Token de confirmation invalide ou expiré');
      }

      // UTILISER LA MÉTHODE NATIVE DU MODÈLE
      await subscription.confirm();

      // Email de bienvenue avec les bonnes données
      if (this.emailService) {
        await this.emailService.sendNewsletterEmail(subscription.email, {
          userName: subscription.first_name || subscription.email.split('@')[0],
          subject: 'Bienvenue dans la newsletter WolofDict !',
          title: 'Abonnement confirmé',
          content: `
            <p>Félicitations ! Votre abonnement à la newsletter WolofDict est maintenant actif.</p>
            <p>Vous recevrez nos dernières actualités, nouveaux mots et événements directement dans votre boîte mail.</p>
            <p><strong>Fréquence :</strong> ${this.getFrequencyLabel(subscription.frequency_preference)}</p>
            <p><strong>Langue :</strong> ${subscription.language_preference}</p>
            <p><strong>Contenu :</strong> ${this.getContentPreferencesLabel(subscription.content_preferences)}</p>
          `,
          unsubscribe_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/newsletter/unsubscribe/${subscription.unsubscribe_token}`
        });
      }

      logger.info('Newsletter subscription confirmed', { 
        email: subscription.email,
        subscription_id: subscription.id
      });
      
      await this.updateStats();

      return {
        success: true,
        message: 'Abonnement confirmé avec succès',
        subscription
      };

    } catch (error) {
      logger.error('Erreur confirmation newsletter:', error.message);
      throw error;
    }
  }

  /**
   * 🚫 Se désabonner de la newsletter - UTILISE LA MÉTHODE NATIVE
   */
  async unsubscribe(emailOrToken, reason = null, feedback = null) {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        logger.warn('Mode mock: newsletter unsubscribe');
        return {
          success: true,
          message: 'Désabonnement simulé'
        };
      }

      let subscription;

      // Recherche par email ou token de désabonnement
      if (this.isValidEmail(emailOrToken)) {
        subscription = await this.models.NewsletterSubscription.findOne({
          where: { email: emailOrToken }
        });
      } else {
        subscription = await this.models.NewsletterSubscription.findOne({
          where: { unsubscribe_token: emailOrToken }
        });
      }

      if (!subscription) {
        return {
          success: true,
          message: 'Abonnement non trouvé'
        };
      }

      // UTILISER LA MÉTHODE NATIVE DU MODÈLE
      await subscription.unsubscribe(reason, feedback);

      logger.info('Newsletter unsubscription', { 
        email: subscription.email,
        subscription_id: subscription.id,
        reason,
        feedback: feedback ? 'provided' : 'none'
      });
      
      await this.updateStats();

      return {
        success: true,
        message: 'Désabonnement effectué avec succès',
        subscription
      };

    } catch (error) {
      logger.error('Erreur désabonnement newsletter:', error.message);
      throw error;
    }
  }

  /**
   * ⚙️ Mettre à jour les préférences - CORRIGÉ
   */
  async updatePreferences(email, preferences) {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        throw new Error('Modèles non disponibles pour mise à jour préférences');
      }

      const subscription = await this.models.NewsletterSubscription.findOne({
        where: { 
          email, 
          is_active: true,
          is_confirmed: true
        }
      });

      if (!subscription) {
        throw new Error('Abonnement non trouvé ou inactif');
      }

      // Construire les données à mettre à jour
      const updateData = {};
      
      if (preferences.language_preference) {
        updateData.language_preference = preferences.language_preference;
      }
      
      if (preferences.frequency_preference) {
        updateData.frequency_preference = preferences.frequency_preference;
      }
      
      if (preferences.content_preferences) {
        updateData.content_preferences = {
          ...subscription.content_preferences,
          ...preferences.content_preferences
        };
      }
      
      if (preferences.interests) {
        updateData.interests = preferences.interests;
      }

      await subscription.update(updateData);

      logger.info('Newsletter preferences updated', { 
        email,
        subscription_id: subscription.id,
        updated_fields: Object.keys(updateData)
      });

      return {
        success: true,
        message: 'Préférences mises à jour',
        subscription
      };

    } catch (error) {
      logger.error('Erreur mise à jour préférences newsletter:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 📨 GESTION DES CAMPAGNES - ALIGNÉ AVEC LE MODÈLE
  // =============================================================================

  /**
   * 📊 Créer une campagne newsletter - CORRIGÉ
   */
  async createCampaign(campaignData) {
    try {
      const {
        subject,
        content,
        preview_text,
        template_name = 'newsletter',
        template_data = {},
        send_at = null,
        target_audience = 'all',
        audience_filters = null,
        campaign_type = 'newsletter',
        created_by,
        from_name = 'WolofDict',
        from_email = null,
        reply_to = null,
        tags = [],
        notes = null,
        is_recurring = false,
        recurrence_config = null
      } = campaignData;

      if (!subject || !content) {
        throw new Error('Sujet et contenu requis');
      }

      if (!created_by) {
        throw new Error('Créateur de la campagne requis');
      }

      if (this.models && this.models.NewsletterCampaign) {
        // UTILISER LES VRAIS CHAMPS ET STATUTS DU MODÈLE
        const campaign = await this.models.NewsletterCampaign.create({
          subject,
          content,
          preview_text,
          template_name,
          template_data,
          status: send_at ? 'scheduled' : 'draft', // Statuts officiels
          send_at: send_at ? new Date(send_at) : null,
          target_audience,
          audience_filters,
          campaign_type,
          created_by,
          from_name,
          from_email, // Sera défini automatiquement par le hook si null
          reply_to,
          tags,
          notes,
          is_recurring,
          recurrence_config
          // from_email défini automatiquement par le hook beforeCreate
        });

        logger.info('Newsletter campaign created', { 
          campaign_id: campaign.id, 
          subject,
          campaign_type,
          target_audience,
          status: campaign.status
        });

        await this.updateStats();

        return {
          success: true,
          message: 'Campagne créée avec succès',
          campaign
        };

      } else {
        // Mode mock
        const campaign = {
          id: Date.now(),
          subject,
          content,
          status: 'draft',
          campaign_type,
          mock: true
        };

        logger.warn('Mode mock: newsletter campaign created');
        return {
          success: true,
          message: 'Campagne simulée créée',
          campaign
        };
      }

    } catch (error) {
      logger.error('Erreur création campagne newsletter:', error.message);
      throw error;
    }
  }

  /**
   * 🚀 Envoyer une campagne newsletter - AMÉLIORÉ AVEC TRACKING
   */
  async sendCampaign(campaignId) {
    try {
      if (!this.emailService) {
        throw new Error('EmailService non disponible pour envoi campagne');
      }

      if (!this.models || !this.models.NewsletterCampaign) {
        throw new Error('Modèles non disponibles pour envoi campagne');
      }

      // Récupérer la campagne
      const campaign = await this.models.NewsletterCampaign.findByPk(campaignId);
      if (!campaign) {
        throw new Error('Campagne non trouvée');
      }

      // UTILISER LA MÉTHODE DE VALIDATION DU MODÈLE
      if (!campaign.canBeSent()) {
        throw new Error('Campagne non prête à être envoyée');
      }

      // Vérifier si c'est une campagne planifiée
      if (campaign.status === 'scheduled' && !campaign.isScheduledForSending()) {
        throw new Error('Campagne planifiée pas encore prête');
      }

      // Récupérer les abonnés actifs AVEC LA MÉTHODE DU MODÈLE
      const subscribers = await this.getActiveSubscribersForCampaign(campaign);
      
      if (subscribers.length === 0) {
        throw new Error('Aucun abonné trouvé pour cette campagne');
      }

      // Marquer la campagne comme en cours d'envoi
      await campaign.update({
        status: 'sending',
        send_started_at: new Date(),
        recipients_count: subscribers.length
      });

      logger.info('Starting newsletter campaign send', {
        campaign_id: campaignId,
        recipients_count: subscribers.length,
        target_audience: campaign.target_audience
      });

      // Préparer les données pour l'envoi en masse
      const emailData = {
        subject: campaign.subject,
        template: campaign.template_name,
        data: {
          ...campaign.template_data,
          preview_text: campaign.preview_text,
          campaign_id: campaign.id,
          unsubscribe_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/newsletter/unsubscribe`
        }
      };

      let successful = 0;
      let failed = 0;
      let bounced = 0;

      // Envoyer à chaque abonné avec tracking individuel
      for (const subscriber of subscribers) {
        try {
          // Personnaliser l'email pour chaque abonné
          const personalizedData = {
            ...emailData.data,
            subscriber_name: subscriber.first_name || subscriber.email.split('@')[0],
            subscription_id: subscriber.id,
            unsubscribe_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/newsletter/unsubscribe/${subscriber.unsubscribe_token}`
          };

          await this.emailService.sendEmail({
            to: subscriber.email,
            subject: campaign.subject,
            template: campaign.template_name,
            data: personalizedData
          });

          // UTILISER LA MÉTHODE DE TRACKING DU MODÈLE
          await subscriber.recordEmailSent();
          successful++;

        } catch (error) {
          logger.warn('Failed to send to subscriber', {
            email: subscriber.email,
            error: error.message
          });

          // Vérifier si c'est un rebond
          if (error.message.includes('bounce') || error.message.includes('invalid')) {
            await subscriber.recordBounce();
            bounced++;
          }
          
          failed++;
        }
      }

      // Mettre à jour le statut de la campagne avec les VRAIS CHAMPS DU MODÈLE
      await campaign.update({
        status: 'sent',
        send_completed_at: new Date(),
        successful_sends: successful,
        failed_sends: failed,
        bounced_sends: bounced
      });

      logger.info('Newsletter campaign sent successfully', {
        campaign_id: campaignId,
        total: subscribers.length,
        successful,
        failed,
        bounced,
        delivery_rate: campaign.getDeliveryRate()
      });

      await this.updateStats();

      return {
        success: true,
        message: 'Campagne envoyée avec succès',
        stats: {
          total: subscribers.length,
          successful,
          failed,
          bounced,
          delivery_rate: campaign.getDeliveryRate()
        }
      };

    } catch (error) {
      // Marquer la campagne comme échouée
      if (this.models && this.models.NewsletterCampaign) {
        try {
          await this.models.NewsletterCampaign.update(
            { 
              status: 'failed', 
              error_message: error.message,
              send_completed_at: new Date()
            },
            { where: { id: campaignId } }
          );
        } catch (updateError) {
          logger.error('Erreur mise à jour statut campagne échouée:', updateError.message);
        }
      }

      logger.error('Erreur envoi campagne newsletter:', error.message);
      throw error;
    }
  }

  /**
   * 👥 Récupérer les abonnés actifs pour une campagne - UTILISE LES MÉTHODES DU MODÈLE
   */
  async getActiveSubscribersForCampaign(campaign) {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        logger.warn('Mode mock: getActiveSubscribersForCampaign');
        return [];
      }

      const baseFilters = this.buildAudienceFilters(campaign.target_audience);
      
      // Appliquer les filtres personnalisés si définis
      let whereClause = baseFilters;
      if (campaign.audience_filters) {
        whereClause = {
          ...baseFilters,
          ...campaign.audience_filters
        };
      }

      // UTILISER LA MÉTHODE OPTIMISÉE DU MODÈLE
      const subscribers = await this.models.NewsletterSubscription.findActiveSubscribers({
        where: whereClause,
        attributes: [
          'id', 'email', 'first_name', 'last_name', 
          'language_preference', 'frequency_preference', 
          'content_preferences', 'unsubscribe_token', 'engagement_score'
        ],
        order: [['engagement_score', 'DESC']]
      });

      // Filtrer par fréquence si c'est une newsletter régulière
      if (campaign.campaign_type === 'newsletter') {
        return subscribers.filter(subscriber => 
          subscriber.shouldReceiveEmail(subscriber.frequency_preference)
        );
      }

      return subscribers;

    } catch (error) {
      logger.error('Erreur récupération abonnés pour campagne:', error.message);
      throw error;
    }
  }

  /**
   * 🎯 Construire les filtres d'audience - ALIGNÉ AVEC LE MODÈLE
   */
  buildAudienceFilters(targetAudience) {
    const baseFilters = {};

    switch (targetAudience) {
      case 'premium':
        return {
          ...baseFilters,
          user_id: { [Op.not]: null }
        };
        
      case 'free':
        return {
          ...baseFilters,
          user_id: null
        };
        
      case 'contributors':
        // Abonnés avec des tags spécifiques ou qui ont contribué
        return {
          ...baseFilters,
          tags: { [Op.contains]: ['contributor'] }
        };
        
      case 'engaged':
        return {
          ...baseFilters,
          engagement_score: { [Op.gte]: 50 }
        };
        
      case 'inactive':
        return {
          ...baseFilters,
          engagement_score: { [Op.lt]: 20 },
          last_email_opened: {
            [Op.or]: [
              null,
              { [Op.lt]: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } // 60 jours
            ]
          }
        };
        
      case 'french_speakers':
        return {
          ...baseFilters,
          language_preference: { [Op.in]: ['français', 'both'] }
        };
        
      case 'wolof_speakers':
        return {
          ...baseFilters,
          language_preference: { [Op.in]: ['wolof', 'both'] }
        };
        
      case 'daily':
        return {
          ...baseFilters,
          frequency_preference: 'daily'
        };
        
      case 'weekly':
        return {
          ...baseFilters,
          frequency_preference: 'weekly'
        };
        
      case 'all':
      default:
        return baseFilters;
    }
  }

  // =============================================================================
  // 📊 TRACKING ET MÉTRIQUES - NOUVELLES FONCTIONNALITÉS
  // =============================================================================

  /**
   * 👁️ Tracker l'ouverture d'un email
   */
  async trackEmailOpened(subscriptionId, campaignId) {
    try {
      if (!this.models) return;

      const [subscription, campaign] = await Promise.all([
        this.models.NewsletterSubscription.findByPk(subscriptionId),
        this.models.NewsletterCampaign.findByPk(campaignId)
      ]);

      if (subscription) {
        await subscription.recordEmailOpened();
      }

      if (campaign) {
        await campaign.increment('unique_opens');
      }

      logger.debug('Email opened tracked', { subscriptionId, campaignId });

    } catch (error) {
      logger.error('Erreur tracking ouverture email:', error.message);
    }
  }

  /**
   * 🖱️ Tracker le clic sur un lien
   */
  async trackEmailClicked(subscriptionId, campaignId, linkUrl = null) {
    try {
      if (!this.models) return;

      const [subscription, campaign] = await Promise.all([
        this.models.NewsletterSubscription.findByPk(subscriptionId),
        this.models.NewsletterCampaign.findByPk(campaignId)
      ]);

      if (subscription) {
        await subscription.recordEmailClicked();
      }

      if (campaign) {
        await campaign.increment('unique_clicks');
      }

      logger.debug('Email clicked tracked', { subscriptionId, campaignId, linkUrl });

    } catch (error) {
      logger.error('Erreur tracking clic email:', error.message);
    }
  }

  /**
   * ⚠️ Signaler un rebond
   */
  async recordBounce(subscriptionId, campaignId, bounceType = 'hard') {
    try {
      if (!this.models) return;

      const [subscription, campaign] = await Promise.all([
        this.models.NewsletterSubscription.findByPk(subscriptionId),
        this.models.NewsletterCampaign.findByPk(campaignId)
      ]);

      if (subscription) {
        await subscription.recordBounce();
      }

      if (campaign) {
        await campaign.increment('bounced_sends');
      }

      logger.info('Bounce recorded', { subscriptionId, campaignId, bounceType });

    } catch (error) {
      logger.error('Erreur enregistrement rebond:', error.message);
    }
  }

  /**
   * 🚨 Signaler un spam
   */
  async recordSpamComplaint(subscriptionId, campaignId) {
    try {
      if (!this.models) return;

      const [subscription, campaign] = await Promise.all([
        this.models.NewsletterSubscription.findByPk(subscriptionId),
        this.models.NewsletterCampaign.findByPk(campaignId)
      ]);

      if (subscription) {
        await subscription.recordComplaint();
      }

      if (campaign) {
        await campaign.increment('spam_complaints');
      }

      logger.warn('Spam complaint recorded', { subscriptionId, campaignId });

    } catch (error) {
      logger.error('Erreur enregistrement plainte spam:', error.message);
    }
  }

  /**
   * 📈 Obtenir les métriques d'une campagne - UTILISE LES MÉTHODES DU MODÈLE
   */
  async getCampaignMetrics(campaignId) {
    try {
      if (!this.models || !this.models.NewsletterCampaign) {
        return null;
      }

      const campaign = await this.models.NewsletterCampaign.findByPk(campaignId);
      if (!campaign) {
        throw new Error('Campagne non trouvée');
      }

      // UTILISER LES MÉTHODES AUTOMATIQUES DU MODÈLE
      return {
        campaign_id: campaign.id,
        subject: campaign.subject,
        status: campaign.status,
        recipients_count: campaign.recipients_count,
        successful_sends: campaign.successful_sends,
        failed_sends: campaign.failed_sends,
        bounced_sends: campaign.bounced_sends,
        unique_opens: campaign.unique_opens,
        unique_clicks: campaign.unique_clicks,
        unsubscribes: campaign.unsubscribes,
        spam_complaints: campaign.spam_complaints,
        
        // Métriques calculées automatiquement
        delivery_rate: campaign.getDeliveryRate(),
        open_rate: campaign.getOpenRate(),
        click_rate: campaign.getClickRate(),
        click_to_open_rate: campaign.getClickToOpenRate(),
        bounce_rate: campaign.getBounceRate(),
        unsubscribe_rate: campaign.getUnsubscribeRate(),
        engagement_score: campaign.getEngagementScore(),
        
        // Dates
        send_started_at: campaign.send_started_at,
        send_completed_at: campaign.send_completed_at,
        created_at: campaign.created_at
      };

    } catch (error) {
      logger.error('Erreur récupération métriques campagne:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 📊 STATISTIQUES ET ANALYTICS - AMÉLIORÉES
  // =============================================================================

  /**
   * 📈 Mettre à jour les statistiques - UTILISE LES NOUVEAUX CHAMPS
   */
  async updateStats() {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        return;
      }

      // Statistiques abonnements avec les VRAIS champs du modèle
      const subscriptionStats = await this.models.NewsletterSubscription.findAll({
        attributes: [
          [this.models.sequelize.fn('COUNT', '*'), 'total'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.literal('CASE WHEN is_active = true THEN 1 ELSE 0 END')), 'active'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.literal('CASE WHEN is_confirmed = false AND is_active = true THEN 1 ELSE 0 END')), 'pending'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.literal('CASE WHEN is_active = false THEN 1 ELSE 0 END')), 'unsubscribed'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.literal('CASE WHEN is_bouncing = true THEN 1 ELSE 0 END')), 'bouncing'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.literal('CASE WHEN is_complained = true THEN 1 ELSE 0 END')), 'complained']
        ],
        raw: true
      });

      if (subscriptionStats && subscriptionStats[0]) {
        const stats = subscriptionStats[0];
        this.subscriptionStats = {
          totalSubscribers: parseInt(stats.total) || 0,
          activeSubscribers: parseInt(stats.active) || 0,
          pendingVerification: parseInt(stats.pending) || 0,
          unsubscribed: parseInt(stats.unsubscribed) || 0,
          bouncing: parseInt(stats.bouncing) || 0,
          complained: parseInt(stats.complained) || 0
        };
      }

      // Statistiques campagnes avec les VRAIS statuts du modèle
      if (this.models.NewsletterCampaign) {
        const campaignCounts = await this.models.NewsletterCampaign.findAll({
          attributes: [
            'status',
            [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'count']
          ],
          group: ['status'],
          raw: true
        });

        this.campaignStats = {
          totalCampaigns: 0,
          sent: 0,
          drafts: 0,
          scheduled: 0,
          sending: 0,
          failed: 0,
          paused: 0,
          cancelled: 0
        };

        campaignCounts.forEach(stat => {
          const status = stat.status;
          const count = parseInt(stat.count);
          
          this.campaignStats.totalCampaigns += count;
          if (this.campaignStats.hasOwnProperty(status)) {
            this.campaignStats[status] = count;
          }
        });
      }

    } catch (error) {
      logger.error('Erreur mise à jour statistiques newsletter:', error.message);
    }
  }

  /**
   * 📊 Récupérer les statistiques complètes - AMÉLIORÉES
   */
  async getNewsletterStats() {
    await this.updateStats();
    
    return {
      subscriptions: this.subscriptionStats,
      campaigns: this.campaignStats,
      segmentation: await this.getSegmentationStats(),
      engagement: await this.getEngagementStats(),
      growth: await this.getGrowthStats()
    };
  }

  /**
   * 🎯 Statistiques de segmentation - UTILISE LES MÉTHODES DU MODÈLE
   */
  async getSegmentationStats() {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        return {};
      }

      // UTILISER LA MÉTHODE NATIVE DU MODÈLE
      const segmentStats = await this.models.NewsletterSubscription.getSegmentStats();
      
      // Statistiques par engagement
      const highEngagement = await this.models.NewsletterSubscription.findHighEngagement(70, 1);
      const totalActive = await this.models.NewsletterSubscription.count({
        where: { is_active: true, is_confirmed: true }
      });

      return {
        by_language: segmentStats.filter(s => s.language_preference),
        by_frequency: segmentStats.filter(s => s.frequency_preference),
        high_engagement_count: highEngagement.length,
        high_engagement_percentage: totalActive > 0 ? Math.round((highEngagement.length / totalActive) * 100) : 0
      };

    } catch (error) {
      logger.error('Erreur statistiques segmentation:', error.message);
      return {};
    }
  }

  /**
   * 📈 Statistiques de croissance - AMÉLIORÉES
   */
  async getGrowthStats() {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        return { daily: [], weekly: [], monthly: [] };
      }

      // Croissance des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyGrowth = await this.models.NewsletterSubscription.findAll({
        attributes: [
          [this.models.sequelize.fn('DATE', this.models.sequelize.col('subscription_date')), 'date'],
          [this.models.sequelize.fn('COUNT', this.models.sequelize.col('id')), 'subscriptions']
        ],
        where: {
          subscription_date: { [Op.gte]: thirtyDaysAgo }
        },
        group: [this.models.sequelize.fn('DATE', this.models.sequelize.col('subscription_date'))],
        order: [[this.models.sequelize.fn('DATE', this.models.sequelize.col('subscription_date')), 'ASC']],
        raw: true
      });

      return {
        daily: dailyGrowth.map(row => ({
          date: row.date,
          subscriptions: parseInt(row.subscriptions)
        }))
      };

    } catch (error) {
      logger.error('Erreur statistiques croissance newsletter:', error.message);
      return { daily: [] };
    }
  }

  /**
   * 💬 Statistiques d'engagement - RÉELLES
   */
  async getEngagementStats() {
    try {
      if (!this.models || !this.models.NewsletterCampaign) {
        return {
          open_rate: 0,
          click_rate: 0,
          bounce_rate: 0,
          unsubscribe_rate: 0
        };
      }

      // Calculer les moyennes sur les campagnes envoyées
      const campaignStats = await this.models.NewsletterCampaign.findAll({
        attributes: [
          [this.models.sequelize.fn('AVG', this.models.sequelize.literal('(unique_opens * 100.0 / NULLIF(successful_sends, 0))')), 'avg_open_rate'],
          [this.models.sequelize.fn('AVG', this.models.sequelize.literal('(unique_clicks * 100.0 / NULLIF(unique_opens, 0))')), 'avg_click_rate'],
          [this.models.sequelize.fn('AVG', this.models.sequelize.literal('(bounced_sends * 100.0 / NULLIF(recipients_count, 0))')), 'avg_bounce_rate'],
          [this.models.sequelize.fn('AVG', this.models.sequelize.literal('(unsubscribes * 100.0 / NULLIF(successful_sends, 0))')), 'avg_unsubscribe_rate']
        ],
        where: {
          status: 'sent',
          successful_sends: { [Op.gt]: 0 }
        },
        raw: true
      });

      const stats = campaignStats[0] || {};

      return {
        open_rate: Math.round(parseFloat(stats.avg_open_rate) || 0),
        click_rate: Math.round(parseFloat(stats.avg_click_rate) || 0),
        bounce_rate: Math.round(parseFloat(stats.avg_bounce_rate) || 0),
        unsubscribe_rate: Math.round(parseFloat(stats.avg_unsubscribe_rate) || 0)
      };

    } catch (error) {
      logger.error('Erreur statistiques engagement newsletter:', error.message);
      return {
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0,
        unsubscribe_rate: 0
      };
    }
  }

  // =============================================================================
  // 🔄 CAMPAGNES RÉCURRENTES - NOUVELLES FONCTIONNALITÉS
  // =============================================================================

  /**
   * 🔄 Traiter les campagnes récurrentes
   */
  async processRecurringCampaigns() {
    try {
      if (!this.models || !this.models.NewsletterCampaign) {
        return [];
      }

      // Trouver les campagnes récurrentes prêtes à être envoyées
      const recurringCampaigns = await this.models.NewsletterCampaign.findAll({
        where: {
          is_recurring: true,
          next_send_at: { [Op.lte]: new Date() },
          status: 'sent' // La campagne précédente doit être envoyée
        }
      });

      const processedCampaigns = [];

      for (const originalCampaign of recurringCampaigns) {
        try {
          // Créer une nouvelle campagne basée sur l'originale
          const newCampaign = await this.models.NewsletterCampaign.create({
            subject: originalCampaign.subject,
            content: originalCampaign.content,
            preview_text: originalCampaign.preview_text,
            template_name: originalCampaign.template_name,
            template_data: originalCampaign.template_data,
            status: 'scheduled',
            send_at: new Date(), // Envoyer maintenant
            target_audience: originalCampaign.target_audience,
            audience_filters: originalCampaign.audience_filters,
            campaign_type: originalCampaign.campaign_type,
            created_by: originalCampaign.created_by,
            from_name: originalCampaign.from_name,
            from_email: originalCampaign.from_email,
            reply_to: originalCampaign.reply_to,
            tags: [...(originalCampaign.tags || []), 'recurring'],
            is_recurring: false // La nouvelle instance n'est pas récurrente
          });

          // Envoyer la campagne
          await this.sendCampaign(newCampaign.id);
          
          processedCampaigns.push(newCampaign);
          
          logger.info('Recurring campaign processed', {
            original_campaign_id: originalCampaign.id,
            new_campaign_id: newCampaign.id
          });

        } catch (error) {
          logger.error('Erreur traitement campagne récurrente:', {
            campaign_id: originalCampaign.id,
            error: error.message
          });
        }
      }

      return processedCampaigns;

    } catch (error) {
      logger.error('Erreur traitement campagnes récurrentes:', error.message);
      return [];
    }
  }

  // =============================================================================
  // 🧹 MAINTENANCE ET NETTOYAGE - AMÉLIORÉES
  // =============================================================================

  /**
   * 🧹 Nettoyer les données - UTILISE LES MÉTHODES DU MODÈLE
   */
  async cleanupExpiredTokens() {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        return 0;
      }

      // UTILISER LA MÉTHODE NATIVE DE NETTOYAGE
      const deletedCount = await this.models.NewsletterSubscription.cleanupInactive(365);

      // Nettoyer aussi les tokens de confirmation expirés (7 jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const expiredTokens = await this.models.NewsletterSubscription.destroy({
        where: {
          is_confirmed: false,
          is_active: true,
          confirmation_sent_at: { [Op.lt]: sevenDaysAgo }
        }
      });

      const totalCleaned = deletedCount + expiredTokens;

      if (totalCleaned > 0) {
        logger.info('Newsletter cleanup completed', {
          inactive_deleted: deletedCount,
          expired_tokens_deleted: expiredTokens,
          total: totalCleaned
        });
        await this.updateStats();
      }

      return totalCleaned;

    } catch (error) {
      logger.error('Erreur nettoyage newsletter:', error.message);
      return 0;
    }
  }

  /**
   * 🔧 Maintenance périodique
   */
  async performMaintenance() {
    try {
      logger.info('Starting newsletter maintenance');

      const results = {
        cleaned_subscriptions: await this.cleanupExpiredTokens(),
        processed_recurring: await this.processRecurringCampaigns(),
        updated_engagement: await this.updateAllEngagementScores()
      };

      logger.info('Newsletter maintenance completed', results);
      return results;

    } catch (error) {
      logger.error('Erreur maintenance newsletter:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Mettre à jour tous les scores d'engagement
   */
  async updateAllEngagementScores() {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        return 0;
      }

      const activeSubscribers = await this.models.NewsletterSubscription.findAll({
        where: { is_active: true, is_confirmed: true }
      });

      let updated = 0;
      for (const subscriber of activeSubscribers) {
        try {
          await subscriber.updateEngagementScore();
          updated++;
        } catch (error) {
          logger.warn('Failed to update engagement score', {
            subscription_id: subscriber.id,
            error: error.message
          });
        }
      }

      logger.info('Engagement scores updated', { count: updated });
      return updated;

    } catch (error) {
      logger.error('Erreur mise à jour scores engagement:', error.message);
      return 0;
    }
  }

  // =============================================================================
  // 🛠️ UTILITAIRES - AMÉLIORÉS
  // =============================================================================

  /**
   * 📧 Envoyer email de confirmation d'abonnement - AMÉLIORÉ
   */
  async sendConfirmationEmail(email, userData = {}) {
    try {
      if (!this.emailService) {
        logger.warn('EmailService non disponible pour confirmation newsletter');
        return;
      }

      const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/newsletter/confirm/${userData.confirmation_token}`;

      await this.emailService.sendEmail({
        to: email,
        subject: 'Confirmez votre abonnement à la newsletter WolofDict',
        template: 'newsletter_confirmation',
        data: {
          userName: userData.first_name || userData.userName || email.split('@')[0],
          title: 'Confirmez votre abonnement',
          confirmation_url: confirmationUrl,
          language_preference: userData.language_preference || 'français',
          frequency_preference: userData.frequency_preference || 'weekly',
          content: `
            <p>Merci de votre intérêt pour la newsletter WolofDict !</p>
            <p>Pour confirmer votre abonnement et commencer à recevoir nos contenus, cliquez sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Confirmer mon abonnement
              </a>
            </div>
            <p><strong>Vos préférences :</strong></p>
            <ul>
              <li>Langue : ${userData.language_preference || 'français'}</li>
              <li>Fréquence : ${this.getFrequencyLabel(userData.frequency_preference || 'weekly')}</li>
            </ul>
            <p>Si vous n'avez pas demandé cet abonnement, ignorez simplement cet email.</p>
            <p style="font-size: 12px; color: #666;">
              Ce lien expirera dans 7 jours pour votre sécurité.
            </p>
          `
        }
      });

      // Marquer la date d'envoi de confirmation
      if (userData.subscription_id && this.models) {
        await this.models.NewsletterSubscription.update(
          { confirmation_sent_at: new Date() },
          { where: { id: userData.subscription_id } }
        );
      }

    } catch (error) {
      logger.error('Erreur envoi email confirmation newsletter:', error.message);
    }
  }

  /**
   * 🏷️ Obtenir le libellé de fréquence
   */
  getFrequencyLabel(frequency) {
    const labels = {
      daily: 'Quotidienne',
      weekly: 'Hebdomadaire', 
      biweekly: 'Bimensuelle',
      monthly: 'Mensuelle'
    };
    return labels[frequency] || 'Hebdomadaire';
  }

  /**
   * 📋 Obtenir le libellé des préférences de contenu
   */
  getContentPreferencesLabel(preferences = {}) {
    const activePrefs = Object.entries(preferences)
      .filter(([key, value]) => value === true)
      .map(([key]) => {
        const labels = {
          new_words: 'Nouveaux mots',
          new_phrases: 'Nouvelles phrases',
          events: 'Événements',
          community_highlights: 'Actualités communauté',
          learning_tips: 'Conseils d\'apprentissage',
          cultural_content: 'Contenu culturel',
          project_updates: 'Mises à jour du projet',
          technical_updates: 'Mises à jour techniques'
        };
        return labels[key] || key;
      });

    return activePrefs.length > 0 ? activePrefs.join(', ') : 'Contenu général';
  }

  /**
   * 📍 Mapper les sources d'abonnement
   */
  mapSource(source) {
    const validSources = ['website', 'mobile_app', 'event', 'referral', 'import', 'api'];
    return validSources.includes(source) ? source : 'website';
  }

  /**
   * ✅ Valider adresse email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 🔍 Rechercher des abonnés
   */
  async searchSubscribers(query, filters = {}) {
    try {
      if (!this.models || !this.models.NewsletterSubscription) {
        return [];
      }

      const whereClause = {
        ...filters,
        [Op.or]: [
          { email: { [Op.iLike]: `%${query}%` } },
          { first_name: { [Op.iLike]: `%${query}%` } },
          { last_name: { [Op.iLike]: `%${query}%` } }
        ]
      };

      return await this.models.NewsletterSubscription.findAll({
        where: whereClause,
        attributes: [
          'id', 'email', 'first_name', 'last_name', 
          'is_active', 'is_confirmed', 'language_preference', 
          'frequency_preference', 'engagement_score', 'subscription_date'
        ],
        order: [['engagement_score', 'DESC']],
        limit: 50
      });

    } catch (error) {
      logger.error('Erreur recherche abonnés:', error.message);
      return [];
    }
  }

  /**
   * 📊 Obtenir le statut du service
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasModels: !!this.models,
      hasEmailService: !!this.emailService,
      subscriptionStats: this.subscriptionStats,
      campaignStats: this.campaignStats,
      features: {
        tracking: true,
        segmentation: true,
        recurring_campaigns: true,
        engagement_scoring: true,
        cleanup: true
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new NewsletterService();