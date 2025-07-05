// models/integration/APIKey.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const crypto = require('crypto');

const APIKey = sequelize.define('APIKey', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [3, 100]
    },
    comment: 'Nom descriptif de la clé API'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description de l\'usage prévu'
  },
  key_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Hash de la clé API (pour sécurité)'
  },
  key_prefix: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Préfixe visible de la clé (ex: wd_live_...)'
  },
  key_type: {
    type: DataTypes.ENUM('public', 'secret', 'restricted'),
    allowNull: false,
    defaultValue: 'secret',
    comment: 'Type de clé API'
  },
  environment: {
    type: DataTypes.ENUM('development', 'staging', 'production'),
    allowNull: false,
    defaultValue: 'development',
    comment: 'Environnement d\'utilisation'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Liste des permissions accordées'
  },
  scopes: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['read'],
    comment: 'Portées d\'accès (read, write, admin)'
  },
  allowed_origins: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Domaines autorisés pour CORS'
  },
  allowed_ips: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Adresses IP autorisées'
  },
  rate_limit: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1000,
    comment: 'Limite de requêtes par heure'
  },
  rate_limit_window: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 3600,
    comment: 'Fenêtre de limite en secondes'
  },
  usage_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre total d\'utilisations'
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière utilisation'
  },
  last_used_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Dernière adresse IP d\'utilisation'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration (null = pas d\'expiration)'
  },
  auto_regenerate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Régénération automatique avant expiration'
  },
  webhook_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'URL de webhook pour notifications'
  },
  webhook_events: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Événements déclenchant le webhook'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Métadonnées personnalisées'
  },
  revoked_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de révocation'
  },
  revoked_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur ayant révoqué la clé'
  },
  revocation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raison de la révocation'
  }
}, {
  tableName: 'api_keys',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['key_hash'] },
    { fields: ['key_prefix'] },
    { fields: ['key_type'] },
    { fields: ['environment'] },
    { fields: ['is_active'] },
    { fields: ['expires_at'] },
    { fields: ['last_used_at'] },
    { fields: ['revoked_at'] },
    {
      name: 'api_key_active_lookup',
      fields: ['key_hash', 'is_active', 'expires_at']
    }
  ],
  hooks: {
    beforeCreate: async (apiKey) => {
      if (!apiKey.key_hash) {
        const { key, hash, prefix } = APIKey.generateKey(apiKey.environment);
        apiKey.key_hash = hash;
        apiKey.key_prefix = prefix;
        
        // Stocker temporairement la clé en clair pour la retourner
        apiKey.temp_key = key;
      }
    }
  }
});

// Méthodes statiques pour la génération de clés
APIKey.generateKey = function(environment = 'development') {
  const envPrefix = {
    'development': 'wd_dev_',
    'staging': 'wd_test_',
    'production': 'wd_live_'
  }[environment] || 'wd_dev_';
  
  const randomPart = crypto.randomBytes(32).toString('hex');
  const key = envPrefix + randomPart;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 20) + '...';
  
  return { key, hash, prefix };
};

APIKey.hashKey = function(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
};

// Méthodes d'instance
APIKey.prototype.isExpired = function() {
  return this.expires_at && new Date() > this.expires_at;
};

APIKey.prototype.isRevoked = function() {
  return this.revoked_at !== null;
};

APIKey.prototype.isValid = function() {
  return this.is_active && !this.isExpired() && !this.isRevoked();
};

APIKey.prototype.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.permissions.includes('*');
};

APIKey.prototype.hasScope = function(scope) {
  return this.scopes.includes(scope) || this.scopes.includes('*');
};

APIKey.prototype.canAccess = function(origin = null, ip = null) {
  // Vérifier l'origine (CORS)
  if (this.allowed_origins && this.allowed_origins.length > 0 && origin) {
    if (!this.allowed_origins.includes(origin) && !this.allowed_origins.includes('*')) {
      return false;
    }
  }
  
  // Vérifier l'adresse IP
  if (this.allowed_ips && this.allowed_ips.length > 0 && ip) {
    if (!this.allowed_ips.includes(ip)) {
      return false;
    }
  }
  
  return true;
};

APIKey.prototype.recordUsage = async function(ip = null) {
  this.usage_count += 1;
  this.last_used_at = new Date();
  if (ip) {
    this.last_used_ip = ip;
  }
  
  await this.save(['usage_count', 'last_used_at', 'last_used_ip']);
};

APIKey.prototype.revoke = async function(revokedBy, reason) {
  this.revoked_at = new Date();
  this.revoked_by = revokedBy;
  this.revocation_reason = reason;
  this.is_active = false;
  
  await this.save(['revoked_at', 'revoked_by', 'revocation_reason', 'is_active']);
};

APIKey.prototype.regenerate = async function() {
  if (!this.auto_regenerate) {
    throw new Error('Cette clé n\'est pas configurée pour la régénération automatique');
  }
  
  const { key, hash, prefix } = APIKey.generateKey(this.environment);
  this.key_hash = hash;
  this.key_prefix = prefix;
  this.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 an
  
  await this.save(['key_hash', 'key_prefix', 'expires_at']);
  
  // Retourner la nouvelle clé (temporairement)
  return key;
};

APIKey.prototype.updatePermissions = async function(permissions, scopes = null) {
  this.permissions = Array.isArray(permissions) ? permissions : [permissions];
  if (scopes) {
    this.scopes = Array.isArray(scopes) ? scopes : [scopes];
  }
  
  await this.save(['permissions', 'scopes']);
};

APIKey.prototype.getUsageStats = async function(days = 30) {
  // Cette méthode nécessiterait une table de logs d'usage séparée
  // pour des statistiques détaillées
  const { Op } = require('sequelize');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  // Simulation - dans un vrai projet, il y aurait une table api_usage_logs
  return {
    total_requests: this.usage_count,
    period_start: since,
    period_end: new Date(),
    last_used: this.last_used_at,
    is_active: this.is_active
  };
};

// Méthodes de classe
APIKey.findByKey = async function(key) {
  const hash = this.hashKey(key);
  return await this.findOne({
    where: {
      key_hash: hash,
      is_active: true
    },
    include: [{
      model: require('../user/User'),
      as: 'user',
      attributes: ['id', 'username', 'email', 'role']
    }]
  });
};

APIKey.validateKey = async function(key, requiredScope = null, requiredPermission = null) {
  const apiKey = await this.findByKey(key);
  
  if (!apiKey) {
    return { valid: false, error: 'Clé API non trouvée' };
  }
  
  if (!apiKey.isValid()) {
    return { valid: false, error: 'Clé API expirée ou révoquée' };
  }
  
  if (requiredScope && !apiKey.hasScope(requiredScope)) {
    return { valid: false, error: 'Scope insuffisant' };
  }
  
  if (requiredPermission && !apiKey.hasPermission(requiredPermission)) {
    return { valid: false, error: 'Permission insuffisante' };
  }
  
  return { valid: true, apiKey };
};

APIKey.getExpiringSoon = function(days = 7) {
  const { Op } = require('sequelize');
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  return this.findAll({
    where: {
      expires_at: {
        [Op.between]: [new Date(), futureDate]
      },
      is_active: true,
      revoked_at: null
    },
    include: [{
      model: require('../user/User'),
      as: 'user',
      attributes: ['id', 'username', 'email']
    }]
  });
};

APIKey.cleanupExpired = async function() {
  const { Op } = require('sequelize');
  
  const expired = await this.update(
    { is_active: false },
    {
      where: {
        expires_at: {
          [Op.lt]: new Date()
        },
        is_active: true
      }
    }
  );
  
  return expired[0]; // Nombre de clés désactivées
};

APIKey.getUsageStatistics = function(period = 'month') {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'week':
      dateFilter = {
        last_used_at: {
          [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case 'month':
      dateFilter = {
        last_used_at: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
  }
  
  return this.findAll({
    where: {
      is_active: true,
      ...dateFilter
    },
    attributes: [
      'environment',
      'key_type',
      [sequelize.fn('COUNT', '*'), 'active_keys'],
      [sequelize.fn('SUM', sequelize.col('usage_count')), 'total_usage']
    ],
    group: ['environment', 'key_type']
  });
};

module.exports = APIKey;