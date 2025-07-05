// =============================================================================
// 📋 PLAN MODEL - Plans tarifaires
// File: backend/src/models/business/Plan.js
// =============================================================================

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // 📝 Informations de base
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Nom du plan (Free, Premium, Pro)'
  },
  
  slug: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Identifiant URL-friendly'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée du plan'
  },
  
  // 💰 Tarification
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Prix en devise principale'
  },
  
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'EUR',
    comment: 'Code devise ISO (EUR, USD, XOF)'
  },
  
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly', 'lifetime', 'one_time'),
    allowNull: false,
    defaultValue: 'monthly',
    comment: 'Cycle de facturation'
  },
  
  trial_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Jours d\'essai gratuit'
  },
  
  // 🎯 Limitations et fonctionnalités
  features: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Fonctionnalités incluses (JSON)'
  },
  
  limits: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Limites d\'usage (JSON)'
  },
  
  // 🛠️ Configuration
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Plan disponible à la souscription'
  },
  
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Plan mis en avant (Most Popular)'
  },
  
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Ordre d\'affichage'
  },
  
  // 🎨 Personnalisation
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    comment: 'Couleur hex pour l\'interface (#FF5733)'
  },
  
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Icône ou emoji pour le plan'
  },
  
  // 📊 Métadonnées
  stripe_price_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID prix Stripe pour intégration'
  },
  
  paypal_plan_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID plan PayPal pour intégration'
  }
  
}, {
  tableName: 'plans',
  timestamps: true,
  paranoid: false,
  
  indexes: [
    { fields: ['slug'], unique: true },
    { fields: ['is_active'] },
    { fields: ['sort_order'] }
  ],
  
  scopes: {
    active: {
      where: { is_active: true }
    },
    featured: {
      where: { is_featured: true }
    }
  }
});

module.exports = Plan;
