// models/user/UserSession.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const UserSession = sequelize.define('UserSession', {
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
  
  // =============================================================================
  // 🎫 TOKENS (GÉRÉS PAR AUTHSERVICE)
  // =============================================================================
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'ID unique de session (pas le JWT token)'
  },
  refresh_token_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'Hash du refresh token pour vérification'
  },
  
  // =============================================================================
  // ⏰ GESTION DU TEMPS
  // =============================================================================
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Date d\'expiration de la session'
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Dernière activité utilisateur'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // =============================================================================
  // 🖥️ INFORMATIONS DEVICE/CLIENT
  // =============================================================================
  device_info: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Informations sur l\'appareil'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Adresse IP (IPv4/IPv6)'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User-Agent du navigateur'
  },
  
  // =============================================================================
  // 🔐 SÉCURITÉ ET STATUT
  // =============================================================================
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Session active'
  },
  login_method: {
    type: DataTypes.ENUM('password', 'google', 'facebook', 'apple', 'magic_link'),
    allowNull: false,
    defaultValue: 'password',
    comment: 'Méthode de connexion utilisée'
  },
  security_flags: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      is_suspicious: false,
      unusual_location: false,
      new_device: false,
      forced_logout: false
    },
    comment: 'Indicateurs de sécurité'
  },
  
  // =============================================================================
  // 🌍 GÉOLOCALISATION (OPTIONNELLE)
  // =============================================================================
  country: {
    type: DataTypes.STRING(2),
    allowNull: true,
    comment: 'Code pays ISO (FR, SN, etc.)'
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Ville approximative'
  },
  
  // =============================================================================
  // 📊 STATISTIQUES SESSION
  // =============================================================================
  page_views: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de pages vues dans cette session'
  },
  actions_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre d\'actions effectuées'
  }
}, {
  tableName: 'user_sessions',
  timestamps: false, // Géré manuellement
  indexes: [
    { fields: ['user_id'] },
    { fields: ['session_id'] },
    { fields: ['refresh_token_hash'] },
    { fields: ['expires_at'] },
    { fields: ['is_active'] },
    { fields: ['ip_address'] },
    { fields: ['last_activity'] },
    { fields: ['login_method'] },
    // Index composés pour les requêtes de sécurité
    { fields: ['user_id', 'is_active'] },
    { fields: ['user_id', 'expires_at'] },
    { fields: ['ip_address', 'is_active'] }
  ],
  hooks: {
    beforeCreate: async (session) => {
      // Générer session_id avec AuthService si disponible
      if (!session.session_id) {
        try {
          const AuthService = require('../../services/AuthService');
          if (AuthService && AuthService.isInitialized) {
            session.session_id = AuthService.encryptionService.generateSecureKey(32);
          } else {
            // Fallback
            const crypto = require('crypto');
            session.session_id = crypto.randomBytes(32).toString('hex');
          }
        } catch (error) {
          const crypto = require('crypto');
          session.session_id = crypto.randomBytes(32).toString('hex');
        }
      }
      
      // Définir expiration par défaut si pas définie
      if (!session.expires_at) {
        session.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
      }
      
      // Analyser device_info depuis user_agent
      if (session.user_agent && !session.device_info.parsed) {
        session.device_info = {
          ...session.device_info,
          parsed: UserSession.parseUserAgent(session.user_agent),
          fingerprint: UserSession.generateDeviceFingerprint(session)
        };
      }
    }
  }
});

// =============================================================================
// 🔐 MÉTHODES D'INSTANCE
// =============================================================================

/**
 * Vérifier si la session est expirée
 */
UserSession.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

/**
 * Vérifier si la session est valide
 */
UserSession.prototype.isValid = function() {
  return this.is_active && !this.isExpired() && !this.security_flags?.forced_logout;
};

/**
 * Rafraîchir la session
 */
UserSession.prototype.refresh = async function(extendBy = 24 * 60 * 60 * 1000) {
  this.expires_at = new Date(Date.now() + extendBy);
  this.last_activity = new Date();
  await this.save();
  return this;
};

/**
 * Marquer une activité
 */
UserSession.prototype.recordActivity = async function(activityType = 'page_view') {
  this.last_activity = new Date();
  
  if (activityType === 'page_view') {
    this.page_views += 1;
  } else {
    this.actions_count += 1;
  }
  
  await this.save();
};

/**
 * Terminer la session de manière sécurisée
 */
UserSession.prototype.terminate = async function(reason = 'user_logout') {
  this.is_active = false;
  this.security_flags = {
    ...this.security_flags,
    forced_logout: reason !== 'user_logout',
    logout_reason: reason,
    logged_out_at: new Date()
  };
  
  await this.save();
};

/**
 * Marquer comme suspecte
 */
UserSession.prototype.markSuspicious = async function(reason) {
  this.security_flags = {
    ...this.security_flags,
    is_suspicious: true,
    suspicious_reason: reason,
    flagged_at: new Date()
  };
  
  await this.save();
};

// =============================================================================
// 📊 MÉTHODES DE CLASSE
// =============================================================================

/**
 * Rechercher par session_id (équivalent findByToken)
 */
UserSession.findBySessionId = function(sessionId) {
  return this.findOne({
    where: { 
      session_id: sessionId,
      is_active: true,
      expires_at: {
        [sequelize.Op.gt]: new Date()
      }
    },
    include: [
      {
        model: sequelize.models.User,
        as: 'user',
        attributes: { exclude: ['password'] }
      }
    ]
  });
};

/**
 * Rechercher par hash de refresh token
 */
UserSession.findByRefreshTokenHash = function(tokenHash) {
  return this.findOne({
    where: { 
      refresh_token_hash: tokenHash,
      is_active: true,
      expires_at: {
        [sequelize.Op.gt]: new Date()
      }
    },
    include: ['user']
  });
};

/**
 * Obtenir toutes les sessions actives d'un utilisateur
 */
UserSession.findActiveByUserId = function(userId) {
  return this.findAll({
    where: {
      user_id: userId,
      is_active: true,
      expires_at: {
        [sequelize.Op.gt]: new Date()
      }
    },
    order: [['last_activity', 'DESC']]
  });
};

/**
 * Nettoyer les sessions expirées
 */
UserSession.cleanupExpired = async function() {
  const deletedCount = await this.destroy({
    where: {
      [sequelize.Op.or]: [
        {
          expires_at: {
            [sequelize.Op.lt]: new Date()
          }
        },
        {
          is_active: false,
          created_at: {
            [sequelize.Op.lt]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
          }
        }
      ]
    }
  });
  
  return deletedCount;
};

/**
 * Déconnecter toutes les autres sessions d'un utilisateur
 */
UserSession.logoutOtherSessions = async function(userId, currentSessionId) {
  return await this.update(
    { 
      is_active: false,
      security_flags: sequelize.literal(`JSON_SET(security_flags, '$.forced_logout', true, '$.logout_reason', 'security_logout')`)
    },
    {
      where: {
        user_id: userId,
        session_id: { [sequelize.Op.ne]: currentSessionId },
        is_active: true
      }
    }
  );
};

/**
 * Détecter les sessions suspectes
 */
UserSession.findSuspiciousSessions = function(options = {}) {
  const timeWindow = options.timeWindow || 24; // heures
  const maxSessionsPerIP = options.maxSessionsPerIP || 10;
  
  return this.findAll({
    where: {
      created_at: {
        [sequelize.Op.gte]: new Date(Date.now() - timeWindow * 60 * 60 * 1000)
      },
      [sequelize.Op.or]: [
        sequelize.literal(`JSON_EXTRACT(security_flags, '$.is_suspicious') = true`),
        sequelize.literal(`
          (SELECT COUNT(*) FROM user_sessions s2 
           WHERE s2.ip_address = user_sessions.ip_address 
           AND s2.created_at >= DATE_SUB(NOW(), INTERVAL ${timeWindow} HOUR)) > ${maxSessionsPerIP}
        `)
      ]
    },
    include: ['user']
  });
};

/**
 * Statistiques des sessions
 */
UserSession.getSessionStats = async function(days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const stats = await this.findAll({
    where: {
      created_at: {
        [sequelize.Op.gte]: startDate
      }
    },
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_sessions'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN is_active = true THEN 1 END')), 'active_sessions'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN login_method = "password" THEN 1 END')), 'password_logins'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN JSON_EXTRACT(security_flags, "$.is_suspicious") = true THEN 1 END')), 'suspicious_sessions'],
      [sequelize.fn('AVG', sequelize.col('page_views')), 'avg_page_views'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('ip_address'))), 'unique_ips']
    ],
    raw: true
  });
  
  return stats[0];
};

// =============================================================================
// 🛠️ UTILITAIRES
// =============================================================================

/**
 * Parser basique du User-Agent
 */
UserSession.parseUserAgent = function(userAgent) {
  if (!userAgent) return {};
  
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Tablet/.test(userAgent);
  
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';
  
  return {
    browser,
    os,
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  };
};

/**
 * Générer une empreinte d'appareil
 */
UserSession.generateDeviceFingerprint = function(session) {
  const crypto = require('crypto');
  
  const components = [
    session.user_agent || '',
    session.ip_address || '',
    session.device_info?.screen_resolution || '',
    session.device_info?.timezone || ''
  ];
  
  return crypto.createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 16);
};

module.exports = UserSession;