// =============================================================================
// 💸 PAYMENT MODEL - Historique des paiements
// File: backend/src/models/business/Payment.js
// =============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Payment = sequelize.define('Payment', {
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
    comment: 'Utilisateur ayant effectué le paiement'
  },
  
  subscription_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'subscriptions',
      key: 'id'
    },
    comment: 'Abonnement concerné (null pour paiements one-shot)'
  },
  
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'plans',
      key: 'id'
    },
    comment: 'Plan payé au moment du paiement'
  },
  
  // 💰 Informations financières
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Montant payé'
  },
  
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    comment: 'Devise du paiement'
  },
  
  exchange_rate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true,
    comment: 'Taux de change si conversion'
  },
  
  amount_local: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Montant en devise locale'
  },
  
  fees: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Frais de transaction'
  },
  
  net_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Montant net reçu'
  },
  
  // 🏦 Informations de paiement
  payment_method: {
    type: DataTypes.ENUM(
      'stripe',
      'paypal', 
      'bank_transfer',
      'mobile_money',
      'orange_money',
      'wave',
      'free_money'
    ),
    allowNull: false,
    comment: 'Méthode de paiement'
  },
  
  payment_type: {
    type: DataTypes.ENUM('subscription', 'one_time', 'refund', 'chargeback'),
    allowNull: false,
    defaultValue: 'subscription',
    comment: 'Type de transaction'
  },
  
  // 📊 Statut et suivi
  status: {
    type: DataTypes.ENUM(
      'pending',          // En attente
      'processing',       // En traitement
      'completed',        // Terminé avec succès
      'failed',           // Échec
      'canceled',         // Annulé
      'refunded',         // Remboursé
      'chargeback'        // Litige/rétrofacturation
    ),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Statut du paiement'
  },
  
  // 🔧 Intégrations tierces
  provider_transaction_id: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'ID transaction chez le prestataire'
  },
  
  provider_payment_id: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'ID paiement chez le prestataire'
  },
  
  provider_response: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Réponse complète du prestataire'
  },
  
  // 📅 Dates importantes
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de traitement effectif'
  },
  
  failed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'échec'
  },
  
  refunded_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de remboursement'
  },
  
  // 📝 Informations supplémentaires
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Description du paiement'
  },
  
  failure_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raison de l\'échec'
  },
  
  receipt_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL du reçu'
  },
  
  // 🌍 Géolocalisation
  country_code: {
    type: DataTypes.STRING(2),
    allowNull: true,
    comment: 'Code pays du paiement'
  },
  
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Adresse IP de la transaction'
  },
  
  // 📊 Métadonnées
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Données supplémentaires pour analytics'
  }
  
}, {
  tableName: 'payments',
  timestamps: true,
  paranoid: false,
  
  indexes: [
    { fields: ['user_id'] },
    { fields: ['subscription_id'] },
    { fields: ['plan_id'] },
    { fields: ['status'] },
    { fields: ['payment_method'] },
    { fields: ['provider_transaction_id'] },
    { fields: ['processed_at'] },
    // Index pour analytics
    { fields: ['status', 'processed_at'] },
    { fields: ['payment_method', 'status'] },
    { fields: ['currency', 'processed_at'] }
  ],
  
  scopes: {
    completed: {
      where: { status: 'completed' }
    },
    failed: {
      where: { status: 'failed' }
    },
    pending: {
      where: { status: 'pending' }
    }
  }
});

module.exports = Payment;