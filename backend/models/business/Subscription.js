// =============================================================================
// 💳 SUBSCRIPTION MODEL - Abonnements utilisateurs  
// File: backend/src/models/business/Subscription.js
// =============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 🔗 Relations
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur abonné'
  },
  
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plans',
      key: 'id'
    },
    comment: 'Plan souscrit'
  },
  
  // 📅 Dates importantes
  starts_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Date de début d\'abonnement'
  },
  
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration (null = illimité)'
  },
  
  trial_ends_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fin de la période d\'essai'
  },
  
  canceled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'annulation'
  },
  
  // 📊 Statut et gestion
  status: {
    type: DataTypes.ENUM(
      'active',           // Actif et payé
      'trialing',         // En période d'essai
      'past_due',         // Paiement en retard
      'canceled',         // Annulé par l'utilisateur
      'unpaid',          // Non payé (suspension)
      'expired'          // Expiré
    ),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Statut de l\'abonnement'
  },
  
  auto_renew: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Renouvellement automatique'
  },
  
  // 💰 Informations financières
  current_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Prix payé (peut différer du plan actuel)'
  },
  
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    comment: 'Devise de facturation'
  },
  
  // 🔧 Intégrations paiement
  stripe_subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID abonnement Stripe'
  },
  
  paypal_subscription_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID abonnement PayPal'
  },
  
  payment_method: {
    type: DataTypes.ENUM('stripe', 'paypal', 'bank_transfer', 'mobile_money'),
    allowNull: true,
    comment: 'Méthode de paiement utilisée'
  },
  
  // 📝 Informations supplémentaires
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes administratives'
  },
  
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raison d\'annulation (feedback utilisateur)'
  },
  
  // 📊 Métriques
  usage_data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Données d\'usage pour analytics'
  }
  
}, {
  tableName: 'subscriptions',
  timestamps: true,
  paranoid: true, // Soft delete pour historique
  
  indexes: [
    { fields: ['user_id'] },
    { fields: ['plan_id'] },
    { fields: ['status'] },
    { fields: ['expires_at'] },
    { fields: ['stripe_subscription_id'] },
    { fields: ['paypal_subscription_id'] },
    // Index composés pour requêtes fréquentes
    { fields: ['user_id', 'status'] },
    { fields: ['status', 'expires_at'] }
  ],
  
  scopes: {
    active: {
      where: { status: ['active', 'trialing'] }
    },
    expired: {
      where: { status: 'expired' }
    },
    canceled: {
      where: { status: 'canceled' }
    }
  }
});

module.exports = Subscription;