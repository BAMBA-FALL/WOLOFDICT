// models/user/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  // Renommé pour correspondre à AuthService
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [1, 100]
    }
  },
  // Nouveau champ pour téléphone (chiffré par EncryptionService)
  phone_number: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Numéro de téléphone chiffré par EncryptionService'
  },
  profile_picture: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  // Statut utilisateur étendu
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'deleted', 'pending'),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Statut du compte utilisateur'
  },
  // Rôle étendu
  role: {
    type: DataTypes.ENUM('admin', 'expert', 'moderator', 'contributor', 'user'),
    allowNull: false,
    defaultValue: 'user'
  },
  // Champs de vérification email
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Email vérifié'
  },
  email_verification_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Token de vérification email (JWT chiffré)'
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de vérification de l\'email'
  },
  // Champs de réinitialisation mot de passe
  password_reset_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Token de réinitialisation mot de passe (JWT)'
  },
  password_reset_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration du token de reset'
  },
  password_changed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière modification du mot de passe'
  },
  // Champs de connexion et sécurité
  registration_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP d\'inscription (IPv4/IPv6)'
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière connexion'
  },
  last_login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP de dernière connexion (IPv4/IPv6)'
  },
  // Champs existants conservés
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Compte actif (différent de status)'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    }
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  expertise_areas: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  preferred_language: {
    type: DataTypes.ENUM('wolof', 'français', 'both'),
    allowNull: false,
    defaultValue: 'both'
  },
  contribution_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  streak_days: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  points: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'UTC'
  }
}, {
  tableName: 'users',
  timestamps: true, // Ajoute created_at et updated_at automatiquement
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['email'] },
    { fields: ['username'] },
    { fields: ['role'] },
    { fields: ['status'] },
    { fields: ['is_active'] },
    { fields: ['is_verified'] },
    { fields: ['contribution_count'] },
    { fields: ['points'] },
    { fields: ['last_login_at'] },
    { fields: ['created_at'] },
    // Index composé pour les requêtes de sécurité
    { fields: ['email', 'status'] },
    { fields: ['status', 'is_active'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      // Hash du mot de passe avec bcrypt pour compatibilité
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
      
      // Définir la date de création si pas définie
      if (!user.created_at) {
        user.created_at = new Date();
      }
    },
    beforeUpdate: async (user) => {
      // Hash du mot de passe si modifié
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
        user.password_changed_at = new Date();
      }
    }
  }
});

// =============================================================================
// 🔐 MÉTHODES D'AUTHENTIFICATION
// =============================================================================

/**
 * Valider le mot de passe (délégation via AuthService)
 */
User.prototype.validatePassword = async function(password) {
  try {
    // Méthode principale : utiliser bcrypt (hook Sequelize)
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Erreur validation mot de passe:', error);
    return false;
  }
};

/**
 * Valider le mot de passe via AuthService (méthode avancée)
 */
User.prototype.validatePasswordViaAuthService = async function(password) {
  try {
    // Déléguer à AuthService qui gère EncryptionService
    const AuthService = require('../../services/AuthService');
    if (AuthService && AuthService.isInitialized) {
      return await AuthService.encryptionService.verifyPassword(password, this.password);
    }
    
    // Fallback vers bcrypt
    return await this.validatePassword(password);
  } catch (error) {
    console.error('Erreur validation via AuthService:', error);
    return await this.validatePassword(password);
  }
};

/**
 * Obtenir le nom complet
 */
User.prototype.getFullName = function() {
  return `${this.first_name || ''} ${this.last_name || ''}`.trim() || this.username;
};

/**
 * Vérifier si l'utilisateur est actif et valide
 */
User.prototype.isAccountValid = function() {
  return this.status === 'active' && this.is_active === true;
};

/**
 * Vérifier si l'utilisateur peut se connecter
 */
User.prototype.canLogin = function() {
  return this.isAccountValid() && this.status !== 'suspended';
};

/**
 * Obtenir le téléphone déchiffré (délégation via AuthService)
 */
User.prototype.getDecryptedPhone = function() {
  if (!this.phone_number) return null;
  
  try {
    // Déléguer à AuthService qui gère EncryptionService
    const AuthService = require('../../services/AuthService');
    if (AuthService && AuthService.isInitialized && AuthService.encryptionService) {
      return AuthService.encryptionService.decryptField(this.phone_number);
    }
  } catch (error) {
    console.warn('Impossible de déchiffrer le téléphone via AuthService:', error.message);
  }
  
  return this.phone_number; // Retourner tel quel si déchiffrement impossible
};

// =============================================================================
// 🎯 MÉTHODES DE GAMIFICATION (CONSERVÉES)
// =============================================================================

User.prototype.incrementContribution = async function() {
  this.contribution_count += 1;
  this.points += 10; // 10 points par contribution
  await this.save();
};

User.prototype.updateStreak = async function() {
  const today = new Date();
  const lastActivity = this.updated_at;
  const diffTime = Math.abs(today - lastActivity);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    this.streak_days += 1;
  } else if (diffDays > 1) {
    this.streak_days = 1;
  }
  
  await this.save();
};

// =============================================================================
// 📊 MÉTHODES DE CLASSE
// =============================================================================

/**
 * Rechercher par rôle (utilisateurs actifs uniquement)
 */
User.findByRole = function(role) {
  return this.findAll({ 
    where: { 
      role, 
      status: 'active',
      is_active: true 
    } 
  });
};

/**
 * Rechercher par email (compatible AuthService)
 */
User.findByEmail = function(email) {
  return this.findOne({ 
    where: { email },
    include: [
      // Inclure les relations pour AuthService si elles existent
      // { model: Subscription, as: 'subscription', required: false }
    ]
  });
};

/**
 * Rechercher utilisateurs vérifiés
 */
User.findVerified = function(options = {}) {
  return this.findAll({
    where: {
      is_verified: true,
      status: 'active',
      is_active: true,
      ...options.where
    },
    ...options
  });
};

/**
 * Top contributeurs (méthode conservée et améliorée)
 */
User.getTopContributors = function(limit = 10) {
  return this.findAll({
    where: { 
      status: 'active',
      is_active: true 
    },
    order: [['contribution_count', 'DESC']],
    limit,
    attributes: [
      'id', 'username', 'first_name', 'last_name', 
      'profile_picture', 'contribution_count', 'points',
      'streak_days', 'last_login_at'
    ]
  });
};

/**
 * Statistiques des utilisateurs
 */
User.getStats = function() {
  return this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_users'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status = "active" THEN 1 END')), 'active_users'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_verified = true THEN 1 END')), 'verified_users'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN last_login_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END')), 'monthly_active_users'],
      [sequelize.fn('AVG', sequelize.col('contribution_count')), 'avg_contributions'],
      [sequelize.fn('SUM', sequelize.col('points')), 'total_points']
    ],
    raw: true
  });
};

/**
 * Utilisateurs récemment inscrits
 */
User.getRecentRegistrations = function(days = 7, limit = 10) {
  return this.findAll({
    where: {
      created_at: {
        [sequelize.Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    order: [['created_at', 'DESC']],
    limit,
    attributes: [
      'id', 'username', 'email', 'first_name', 'last_name',
      'status', 'is_verified', 'created_at', 'registration_ip'
    ]
  });
};

module.exports = User;