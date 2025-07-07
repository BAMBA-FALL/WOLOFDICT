// =============================================================================
// 🌍 WOLOFDICT - EMAIL SERVICE AMÉLIORÉ
// Service d'envoi d'emails avec Nodemailer + 7 templates Handlebars + Analytics
// =============================================================================

const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const logger = require('./LoggerService');

class EmailService {
  constructor() {
    this.isInitialized = false;
    this.name = 'EmailService';
    this.transporter = null;
    this.templates = {};
    this.emailQueue = [];
    this.isProcessingQueue = false;
    this.emailStats = {
      sent: 0,
      failed: 0,
      queued: 0
    };
  }

  async initialize() {
    try {
      // Configuration Nodemailer avec options avancées
      const transportConfig = {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        pool: true, // Pool de connexions
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 14 // 14 emails par seconde max
      };

      // Configuration SMTP personnalisée si fournie
      if (process.env.SMTP_HOST) {
        transportConfig.host = process.env.SMTP_HOST;
        transportConfig.port = parseInt(process.env.SMTP_PORT) || 587;
        transportConfig.secure = process.env.SMTP_SECURE === 'true';
        delete transportConfig.service;
      }

      this.transporter = nodemailer.createTransporter(transportConfig);

      // Test de connexion si credentials fournis
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await this.transporter.verify();
          logger.info('Connexion email vérifiée avec succès');
        } catch (error) {
          logger.warn('Vérification email échouée, mode dégradé activé:', error.message);
        }
      } else {
        logger.warn('Credentials email non configurés - Mode simulation activé');
      }

      // Charger les templates Handlebars
      await this.loadTemplates();
      
      // Démarrer le processeur de queue
      this.startQueueProcessor();
      
      this.isInitialized = true;
      logger.info('EmailService initialisé avec 7 templates');
      
    } catch (error) {
      logger.error('Erreur initialisation EmailService:', error.message);
      throw error;
    }
  }

  async loadTemplates() {
    this.templates = {
      welcome: this.createWelcomeTemplate(),
      verification: this.createVerificationTemplate(),
      passwordReset: this.createPasswordResetTemplate(),
      subscription: this.createSubscriptionTemplate(),
      subscriptionConfirmation: this.createSubscriptionConfirmationTemplate(),
      newsletter: this.createNewsletterTemplate(),
      notification: this.createNotificationTemplate()
    };
    
    // Enregistrer des helpers Handlebars utiles
    handlebars.registerHelper('formatDate', function(date) {
      return new Date(date).toLocaleDateString('fr-FR');
    });

    handlebars.registerHelper('capitalize', function(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    handlebars.registerHelper('eq', function(a, b) {
      return a === b;
    });
    
    logger.info('Templates Handlebars chargés: welcome, verification, passwordReset, subscription, subscriptionConfirmation, newsletter, notification');
  }

  async sendEmail({ to, subject, template, data, html, text, priority = 'normal', delay = 0 }) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validation des paramètres
      if (!to || !subject) {
        throw new Error('Email destinataire et sujet requis');
      }

      let htmlContent = html;
      
      // Utiliser template si fourni
      if (template && this.templates[template]) {
        try {
          htmlContent = this.templates[template](data || {});
        } catch (templateError) {
          logger.error('Erreur compilation template:', templateError.message);
          throw new Error('Erreur dans le template email');
        }
      }

      const emailData = {
        id: this.generateEmailId(),
        to: to,
        subject: subject,
        html: htmlContent,
        text: text,
        priority,
        delay,
        attempts: 0,
        maxAttempts: 3,
        createdAt: new Date(),
        scheduledFor: delay > 0 ? new Date(Date.now() + delay) : new Date()
      };

      // Ajouter à la queue ou envoyer immédiatement
      if (delay > 0 || priority === 'low') {
        return this.queueEmail(emailData);
      } else {
        return this.sendEmailNow(emailData);
      }
      
    } catch (error) {
      logger.error('Erreur préparation email:', error.message);
      this.emailStats.failed++;
      throw error;
    }
  }

  async sendEmailNow(emailData) {
    try {
      // Mode simulation si pas de credentials
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        logger.info('Mode simulation - Email:', {
          to: emailData.to,
          subject: emailData.subject,
          id: emailData.id
        });
        this.emailStats.sent++;
        return { 
          success: true, 
          messageId: emailData.id, 
          simulated: true 
        };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        headers: {
          'X-Email-ID': emailData.id,
          'X-Priority': emailData.priority === 'high' ? '1' : emailData.priority === 'low' ? '5' : '3'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      this.emailStats.sent++;
      logger.info('Email envoyé avec succès:', {
        to: emailData.to,
        subject: emailData.subject,
        messageId: result.messageId,
        id: emailData.id
      });
      
      return { 
        success: true, 
        messageId: result.messageId, 
        emailId: emailData.id 
      };
      
    } catch (error) {
      logger.error('Erreur envoi email:', {
        error: error.message,
        to: emailData.to,
        id: emailData.id
      });
      
      this.emailStats.failed++;
      
      // Retry si possible
      if (emailData.attempts < emailData.maxAttempts) {
        emailData.attempts++;
        emailData.scheduledFor = new Date(Date.now() + (emailData.attempts * 60000)); // Délai exponentiel
        this.queueEmail(emailData);
        return { success: false, retry: true, emailId: emailData.id };
      }
      
      throw error;
    }
  }

  queueEmail(emailData) {
    this.emailQueue.push(emailData);
    this.emailStats.queued++;
    logger.debug('Email ajouté à la queue:', {
      to: emailData.to,
      subject: emailData.subject,
      id: emailData.id,
      scheduledFor: emailData.scheduledFor
    });
    
    return { 
      success: true, 
      queued: true, 
      emailId: emailData.id,
      scheduledFor: emailData.scheduledFor
    };
  }

  startQueueProcessor() {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    
    const processQueue = async () => {
      while (this.emailQueue.length > 0) {
        const emailData = this.emailQueue.shift();
        this.emailStats.queued--;
        
        try {
          // Vérifier si c'est le moment d'envoyer
          if (new Date() >= emailData.scheduledFor) {
            await this.sendEmailNow(emailData);
          } else {
            // Remettre en queue si pas encore le moment
            this.emailQueue.push(emailData);
            this.emailStats.queued++;
          }
        } catch (error) {
          logger.error('Erreur traitement queue email:', error.message);
        }
        
        // Pause entre les envois pour éviter le spam
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Relancer dans 5 secondes
      setTimeout(processQueue, 5000);
    };
    
    processQueue();
  }

  // Templates prêts à l'emploi améliorés
  async sendWelcomeEmail(userEmail, userData = {}) {
    return this.sendEmail({
      to: userEmail,
      subject: 'Bienvenue sur WolofDict! 🌍',
      template: 'welcome',
      data: { 
        userName: userData.userName || userData.fullName || userEmail.split('@')[0],
        userEmail: userEmail,
        ...userData
      },
      priority: 'high'
    });
  }

  async sendVerificationEmail(userEmail, token, userData = {}) {
    const verificationUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/verify?token=' + token;
    return this.sendEmail({
      to: userEmail,
      subject: 'Vérifiez votre email - WolofDict',
      template: 'verification',
      data: { 
        verificationUrl, 
        userEmail,
        userName: userData.userName || userData.fullName || userEmail.split('@')[0],
        ...userData
      },
      priority: 'high'
    });
  }

  async sendPasswordResetEmail(userEmail, resetToken, userData = {}) {
    const resetUrl = (process.env.FRONTEND_URL || 'http://localhost:3000') + '/reset-password?token=' + resetToken;
    return this.sendEmail({
      to: userEmail,
      subject: 'Réinitialisation mot de passe - WolofDict',
      template: 'passwordReset',
      data: { 
        resetUrl, 
        userEmail,
        userName: userData.userName || userData.fullName || userEmail.split('@')[0],
        ...userData
      },
      priority: 'high'
    });
  }

  async sendSubscriptionEmail(userEmail, subscriptionData) {
    return this.sendEmail({
      to: userEmail,
      subject: `Abonnement ${subscriptionData.planName} activé! 🎉`,
      template: 'subscription',
      data: {
        userName: subscriptionData.userName || userEmail.split('@')[0],
        ...subscriptionData
      },
      priority: 'high'
    });
  }

  async sendSubscriptionConfirmation(userEmail, subscriptionData) {
    return this.sendEmail({
      to: userEmail,
      subject: `Confirmation d'abonnement ${subscriptionData.planName}`,
      template: 'subscriptionConfirmation',
      data: {
        userName: subscriptionData.userName || userEmail.split('@')[0],
        ...subscriptionData
      },
      priority: 'normal'
    });
  }

  async sendNewsletterEmail(userEmail, newsletterData) {
    return this.sendEmail({
      to: userEmail,
      subject: newsletterData.subject || 'Newsletter WolofDict',
      template: 'newsletter',
      data: { 
        userEmail,
        userName: newsletterData.userName || userEmail.split('@')[0],
        ...newsletterData 
      },
      priority: 'low'
    });
  }

  async sendNotificationEmail(userEmail, notificationData) {
    return this.sendEmail({
      to: userEmail,
      subject: notificationData.title || 'Notification WolofDict',
      template: 'notification',
      data: {
        userEmail,
        userName: notificationData.userName || userEmail.split('@')[0],
        ...notificationData
      },
      priority: notificationData.priority || 'normal'
    });
  }

  // Templates Handlebars améliorés
  createWelcomeTemplate() {
    const templateString = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Asalaam aleykum {{capitalize userName}}! 🌍</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">Bienvenue sur WolofDict</p>
  </div>
  <div style="padding: 40px 30px; background: white; margin: 20px 0;">
    <h2 style="color: #333; margin-top: 0;">Félicitations!</h2>
    <p style="color: #666; line-height: 1.6; font-size: 16px;">Vous faites maintenant partie de la communauté WolofDict, la plateforme collaborative pour apprendre et préserver la langue wolof.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="color: #333; margin-top: 0;">Commencez votre apprentissage :</h3>
      <ul style="color: #666; line-height: 1.6;">
        <li>🔍 Explorez notre dictionnaire de 10,000+ mots</li>
        <li>🔊 Écoutez les prononciations authentiques</li>
        <li>👥 Rejoignez notre communauté active</li>
        <li>💪 Contribuez à la préservation du wolof</li>
        <li>📱 Accédez depuis n'importe quel appareil</li>
      </ul>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Commencer l'apprentissage →</a>
    </div>
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #999; font-size: 14px;">
      <p>Besoin d'aide? Répondez à cet email ou visitez notre <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" style="color: #667eea;">centre d'aide</a>.</p>
    </div>
  </div>
</div>`;

    return handlebars.compile(templateString);
  }

  createVerificationTemplate() {
    const templateString = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #28a745; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Vérifiez votre email</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Dernière étape pour activer votre compte</p>
  </div>
  <div style="padding: 30px; background: white;">
    <p style="color: #666; line-height: 1.6;">Bonjour {{capitalize userName}},</p>
    <p style="color: #666; line-height: 1.6;">Cliquez sur le bouton ci-dessous pour vérifier votre adresse email <strong>{{userEmail}}</strong> et activer votre compte WolofDict.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{verificationUrl}}" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Vérifier mon email →</a>
    </div>
    <p style="color: #999; font-size: 14px;">Ce lien expire dans 24 heures. Si vous n'avez pas créé de compte, ignorez cet email.</p>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; color: #666;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur:<br>
      <span style="word-break: break-all;">{{verificationUrl}}</span>
    </div>
  </div>
</div>`;

    return handlebars.compile(templateString);
  }

  createPasswordResetTemplate() {
    const templateString = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #dc3545; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Réinitialisation mot de passe</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Demande de changement de mot de passe</p>
  </div>
  <div style="padding: 30px; background: white;">
    <p style="color: #666; line-height: 1.6;">Bonjour {{capitalize userName}},</p>
    <p style="color: #666; line-height: 1.6;">Vous avez demandé la réinitialisation de votre mot de passe pour le compte <strong>{{userEmail}}</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{resetUrl}}" style="background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe →</a>
    </div>
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <strong>⚠️ Important:</strong>
      <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
        <li>Ce lien expire dans 1 heure</li>
        <li>Utilisez-le une seule fois</li>
        <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
      </ul>
    </div>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 14px; color: #666;">
      Si le bouton ne fonctionne pas, copiez ce lien:<br>
      <span style="word-break: break-all;">{{resetUrl}}</span>
    </div>
  </div>
</div>`;

    return handlebars.compile(templateString);
  }

  createSubscriptionTemplate() {
    const templateString = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #ffc107; padding: 30px; text-align: center;">
    <h1 style="color: #212529; margin: 0;">Abonnement activé! 🎉</h1>
    <p style="color: #212529; margin: 10px 0 0 0; opacity: 0.8;">Bienvenue dans l'expérience Premium</p>
  </div>
  <div style="padding: 30px; background: white;">
    <h2 style="color: #333;">Félicitations {{capitalize userName}}!</h2>
    <p style="color: #666; line-height: 1.6;">Votre abonnement <strong>{{planName}}</strong> est maintenant actif et vous avez accès à toutes les fonctionnalités premium.</p>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">Vos nouveaux avantages :</h3>
      <ul style="color: #666;">
        <li>✨ Accès illimité au dictionnaire complet ({{totalWords}}+ mots)</li>
        <li>🔊 Audio haute qualité et téléchargements</li>
        <li>📖 Outils d'apprentissage avancés</li>
        <li>💬 Support prioritaire</li>
        <li>📊 Analytics personnalisées</li>
        <li>🎯 Contenu exclusif premium</li>
      </ul>
    </div>
    {{#if nextBillingDate}}
    <div style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
      <strong>💳 Prochaine facturation:</strong> {{formatDate nextBillingDate}}<br>
      <strong>💰 Montant:</strong> {{amount}}€
    </div>
    {{/if}}
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background: #ffc107; color: #212529; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Découvrir Premium →</a>
    </div>
  </div>
</div>`;

    return handlebars.compile(templateString);
  }

  createSubscriptionConfirmationTemplate() {
    const templateString = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #17a2b8; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Confirmation d'abonnement</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Récapitulatif de votre souscription</p>
  </div>
  <div style="padding: 30px; background: white;">
    <h2 style="color: #333;">Merci {{capitalize userName}}!</h2>
    <p style="color: #666; line-height: 1.6;">Voici le récapitulatif de votre abonnement <strong>{{planName}}</strong>:</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 10px 0; font-weight: bold;">Plan:</td>
          <td style="padding: 10px 0; text-align: right;">{{planName}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 10px 0; font-weight: bold;">Prix:</td>
          <td style="padding: 10px 0; text-align: right;">{{amount}}€/{{period}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dee2e6;">
          <td style="padding: 10px 0; font-weight: bold;">Date de début:</td>
          <td style="padding: 10px 0; text-align: right;">{{formatDate startDate}}</td>
        </tr>
        {{#if nextBillingDate}}
        <tr>
          <td style="padding: 10px 0; font-weight: bold;">Prochaine facturation:</td>
          <td style="padding: 10px 0; text-align: right;">{{formatDate nextBillingDate}}</td>
        </tr>
        {{/if}}
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription" style="background: #17a2b8; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Gérer mon abonnement →</a>
    </div>
  </div>
</div>`;

    return handlebars.compile(templateString);
  }

  createNewsletterTemplate() {
    const templateString = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #6f42c1; padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Newsletter WolofDict 📚</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{{subtitle}}</p>
  </div>
  <div style="padding: 30px; background: white;">
    <h2 style="color: #333;">{{title}}</h2>
    <div style="color: #666; line-height: 1.6;">
      {{{content}}}
    </div>
    {{#if featuredWord}}
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #6f42c1;">
      <h3 style="color: #6f42c1; margin-top: 0;">🌟 Mot de la semaine</h3>
      <p style="margin: 0;"><strong>{{featuredWord.wolof}}</strong> - {{featuredWord.french}}</p>
      <p style="margin: 5px 0 0 0; color: #888; font-style: italic;">{{featuredWord.definition}}</p>
    </div>
    {{/if}}
    <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
      <p style="color: #999; font-size: 14px; text-align: center;">
        Vous recevez cet email car vous êtes abonné à la newsletter WolofDict.<br>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email={{userEmail}}" style="color: #6f42c1;">Se désabonner</a>
      </p>
    </div>
  </div>
</div>`;

    return handlebars.compile(templateString);
  }

  createNotificationTemplate() {
    const templateString = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: {{#eq type 'success'}}#28a745{{else}}{{#eq type 'warning'}}#ffc107{{else}}{{#eq type 'error'}}#dc3545{{else}}#17a2b8{{/eq}}{{/eq}}{{/eq}}; padding: 30px; text-align: center;">
    <h1 style="color: {{#eq type 'warning'}}#212529{{else}}white{{/eq}}; margin: 0;">{{title}}</h1>
  </div>
  <div style="padding: 30px; background: white;">
    <p style="color: #666; line-height: 1.6;">Bonjour {{capitalize userName}},</p>
    <div style="color: #666; line-height: 1.6; margin: 20px 0;">
      {{message}}
    </div>
    {{#if actionUrl}}
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{actionUrl}}" style="background: {{#eq type 'success'}}#28a745{{else}}{{#eq type 'warning'}}#ffc107{{else}}{{#eq type 'error'}}#dc3545{{else}}#17a2b8{{/eq}}{{/eq}}{{/eq}}; color: {{#eq type 'warning'}}#212529{{else}}white{{/eq}}; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">{{actionText || 'Voir plus'}} →</a>
    </div>
    {{/if}}
  </div>
</div>`;

    return handlebars.compile(templateString);
  }

  // Utilitaires
  generateEmailId() {
    return 'email_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  }

  getEmailStats() {
    return {
      ...this.emailStats,
      queueLength: this.emailQueue.length,
      isProcessing: this.isProcessingQueue
    };
  }

  async getEmailHistory(limit = 100) {
    // TODO: Implémenter avec base de données si nécessaire
    return {
      message: 'Historique email non implémenté - à connecter avec la base de données',
      stats: this.getEmailStats()
    };
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasTransporter: !!this.transporter,
      templatesLoaded: Object.keys(this.templates).length,
      stats: this.getEmailStats(),
      isProcessingQueue: this.isProcessingQueue,
      queueLength: this.emailQueue.length,
      availableTemplates: Object.keys(this.templates),
      timestamp: new Date().toISOString()
    };
  }

  // Nettoyage périodique
  async cleanup() {
    try {
      // Nettoyer la queue des emails très anciens (plus de 24h)
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
      const originalLength = this.emailQueue.length;
      
      this.emailQueue = this.emailQueue.filter(email => {
        return email.scheduledFor.getTime() > cutoffTime;
      });
      
      const cleaned = originalLength - this.emailQueue.length;
      this.emailStats.queued = this.emailQueue.length;
      
      if (cleaned > 0) {
        logger.debug(`Nettoyage EmailService: ${cleaned} emails expirés supprimés de la queue`);
      }
    } catch (error) {
      logger.error('Erreur nettoyage EmailService:', error.message);
    }
  }

  // Méthodes de test et debug
  async testConnection() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Transporter non initialisé' };
      }

      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return { success: true, simulated: true, message: 'Mode simulation - pas de credentials' };
      }

      await this.transporter.verify();
      return { success: true, message: 'Connexion email OK' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendTestEmail(to = process.env.EMAIL_USER) {
    try {
      if (!to) {
        throw new Error('Adresse email de test requise');
      }

      return await this.sendEmail({
        to: to,
        subject: 'Test EmailService WolofDict',
        template: 'notification',
        data: {
          userName: 'Testeur',
          title: 'Test de fonctionnement',
          message: 'Cet email confirme que votre EmailService fonctionne correctement !',
          type: 'success',
          actionUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
          actionText: 'Aller sur WolofDict'
        },
        priority: 'high'
      });
    } catch (error) {
      logger.error('Erreur test email:', error.message);
      throw error;
    }
  }

  // Méthodes spécialisées pour WolofDict
  async sendWordApprovedEmail(userEmail, wordData) {
    return this.sendNotificationEmail(userEmail, {
      userName: wordData.contributorName,
      title: 'Votre contribution a été approuvée !',
      message: `Félicitations ! Votre mot "${wordData.wolof}" (${wordData.french}) vient d'être approuvé et publié dans le dictionnaire WolofDict. Merci pour votre contribution à la préservation de la langue wolof !`,
      type: 'success',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/words/${wordData.id}`,
      actionText: 'Voir le mot publié'
    });
  }

  async sendSubscriptionExpiringEmail(userEmail, userData, daysLeft) {
    return this.sendNotificationEmail(userEmail, {
      userName: userData.fullName,
      title: 'Votre abonnement expire bientôt',
      message: `Votre abonnement Premium expire dans ${daysLeft} jour(s). Renouvelez dès maintenant pour continuer à profiter de toutes les fonctionnalités premium de WolofDict.`,
      type: 'warning',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription/renew`,
      actionText: 'Renouveler mon abonnement'
    });
  }

  async sendEventReminderEmail(userEmail, eventData) {
    return this.sendNotificationEmail(userEmail, {
      userName: eventData.userName,
      title: `Rappel : ${eventData.title}`,
      message: `N'oubliez pas ! L'événement "${eventData.title}" commence ${eventData.startsIn}. Nous avons hâte de vous y voir !`,
      type: 'info',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${eventData.id}`,
      actionText: 'Voir les détails'
    });
  }

  async sendForumReplyEmail(userEmail, replyData) {
    return this.sendNotificationEmail(userEmail, {
      userName: replyData.originalPosterName,
      title: 'Nouvelle réponse à votre sujet',
      message: `${replyData.replierName} a répondu à votre sujet "${replyData.topicTitle}" dans le forum WolofDict.`,
      type: 'info',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/forum/topics/${replyData.topicId}#reply-${replyData.replyId}`,
      actionText: 'Voir la réponse'
    });
  }

  async sendBulkEmail(recipients, emailData) {
    try {
      if (!Array.isArray(recipients) || recipients.length === 0) {
        throw new Error('Liste de destinataires requise');
      }

      const results = [];
      const batchSize = 50; // Traiter par batches pour éviter la surcharge
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            const result = await this.sendEmail({
              ...emailData,
              to: recipient.email,
              data: {
                ...emailData.data,
                userName: recipient.name || recipient.email.split('@')[0],
                ...recipient.customData
              },
              priority: 'low' // Emails en masse en basse priorité
            });
            
            return { 
              email: recipient.email, 
              success: true, 
              messageId: result.messageId 
            };
          } catch (error) {
            return { 
              email: recipient.email, 
              success: false, 
              error: error.message 
            };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Pause entre les batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      logger.info(`Envoi en masse terminé: ${successful} succès, ${failed} échecs`);
      
      return {
        success: true,
        total: recipients.length,
        successful,
        failed,
        results
      };
      
    } catch (error) {
      logger.error('Erreur envoi en masse:', error.message);
      throw error;
    }
  }

  // Template dynamique pour cas spéciaux
  async sendCustomEmail(to, subject, templateString, data = {}) {
    try {
      const template = handlebars.compile(templateString);
      const htmlContent = template(data);
      
      return await this.sendEmail({
        to,
        subject,
        html: htmlContent,
        priority: 'normal'
      });
    } catch (error) {
      logger.error('Erreur template personnalisé:', error.message);
      throw error;
    }
  }

  // Validation d'adresse email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Prévisualisation template (pour debug)
  previewTemplate(templateName, data = {}) {
    try {
      if (!this.templates[templateName]) {
        throw new Error(`Template '${templateName}' non trouvé`);
      }
      
      return this.templates[templateName](data);
    } catch (error) {
      logger.error('Erreur prévisualisation template:', error.message);
      throw error;
    }
  }
}

module.exports = new EmailService();