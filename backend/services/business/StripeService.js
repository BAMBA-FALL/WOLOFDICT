// =============================================================================
// 🌍 WOLOFDICT - STRIPE SERVICE
// Service de paiements + abonnements + webhooks complets
// =============================================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../LoggerService');

class StripeService {
  constructor() {
    this.isInitialized = false;
    this.name = 'StripeService';
    this.stripe = null;
  }

  async initialize() {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY manquant');
      }

      this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Test de connexion
      await this.stripe.balance.retrieve();
      
      this.isInitialized = true;
      logger.info('StripeService initialisé avec webhooks');
      
    } catch (error) {
      logger.error('Erreur initialisation StripeService:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 👤 GESTION CLIENTS
  // =============================================================================

  async createCustomer(userData) {
    try {
      const customer = await this.stripe.customers.create({
        email: userData.email,
        name: userData.name,
        metadata: {
          userId: userData.id.toString(),
          source: 'wolofdict'
        }
      });

      logger.info('Client Stripe créé: ' + customer.id);
      return customer;
      
    } catch (error) {
      logger.error('Erreur création client:', error.message);
      throw error;
    }
  }

  async getOrCreateCustomer(user) {
    if (user.stripeCustomerId) {
      try {
        return await this.stripe.customers.retrieve(user.stripeCustomerId);
      } catch (error) {
        logger.warn('Client Stripe introuvable, création nouveau');
      }
    }
    return this.createCustomer(user);
  }

  // =============================================================================
  // 💳 GESTION ABONNEMENTS
  // =============================================================================

  async createSubscription({ customer, priceId, paymentMethod, trialDays = 0 }) {
    try {
      const subscriptionData = {
        customer,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      };

      if (trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      if (paymentMethod) {
        subscriptionData.default_payment_method = paymentMethod;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);
      
      logger.info('Abonnement Stripe créé: ' + subscription.id);
      return subscription;
      
    } catch (error) {
      logger.error('Erreur création abonnement:', error.message);
      throw error;
    }
  }

  async updateSubscription(subscriptionId, updates) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, updates);
      logger.info('Abonnement mis à jour: ' + subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Erreur mise à jour abonnement:', error.message);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.del(subscriptionId);
      logger.info('Abonnement annulé: ' + subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Erreur annulation abonnement:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 💰 GESTION PAIEMENTS
  // =============================================================================

  async createPaymentIntent({ amount, currency = 'eur', customer, metadata = {} }) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir en centimes
        currency,
        customer,
        metadata,
        automatic_payment_methods: {
          enabled: true
        }
      });

      logger.info('PaymentIntent créé: ' + paymentIntent.id);
      return paymentIntent;
      
    } catch (error) {
      logger.error('Erreur PaymentIntent:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🔔 WEBHOOKS
  // =============================================================================

  async handleWebhook(body, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      logger.info('Webhook Stripe reçu: ' + event.type);

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          logger.info('Webhook non géré: ' + event.type);
      }

      return { received: true };
      
    } catch (error) {
      logger.error('Erreur webhook:', error.message);
      throw error;
    }
  }

  async handleSubscriptionCreated(subscription) {
    logger.info('Abonnement créé webhook: ' + subscription.id);
    // TODO: Logique business après création abonnement
  }

  async handleSubscriptionUpdated(subscription) {
    logger.info('Abonnement mis à jour webhook: ' + subscription.id);
    // TODO: Logique business après mise à jour abonnement
  }

  async handleSubscriptionDeleted(subscription) {
    logger.info('Abonnement supprimé webhook: ' + subscription.id);
    // TODO: Logique business après suppression abonnement
  }

  async handlePaymentSucceeded(invoice) {
    logger.info('Paiement réussi: ' + invoice.id);
    // TODO: Logique business après paiement réussi
  }

  async handlePaymentFailed(invoice) {
    logger.info('Paiement échoué: ' + invoice.id);
    // TODO: Logique business après échec paiement
  }
}

module.exports = new StripeService();
