// models/user/UserSession.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const crypto = require('crypto');

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
  session_token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  refresh_token: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  device_info: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  login_method: {
    type: DataTypes.ENUM('password', 'google', 'facebook', 'apple'),
    allowNull: false,
    defaultValue: 'password'
  }
}, {
  tableName: 'user_sessions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['session_token'] },
    { fields: ['expires_at'] },
    { fields: ['is_active'] },
    { fields: ['ip_address'] }
  ],
  hooks: {
    beforeCreate: (session) => {
      if (!session.session_token) {
        session.session_token = crypto.randomBytes(32).toString('hex');
      }
      if (!session.refresh_token) {
        session.refresh_token = crypto.randomBytes(32).toString('hex');
      }
      if (!session.expires_at) {
        session.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }
    }
  }
});

// Méthodes d'instance
UserSession.prototype.isExpired = function() {
  return new Date() > this.expires_at;
};

UserSession.prototype.refresh = async function() {
  this.expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000);
  this.last_activity = new Date();
  await this.save();
};

// Méthodes de classe
UserSession.cleanupExpired = async function() {
  return await this.destroy({
    where: {
      expires_at: {
        [require('sequelize').Op.lt]: new Date()
      }
    }
  });
};

UserSession.findByToken = function(token) {
  return this.findOne({
    where: { 
      session_token: token,
      is_active: true,
      expires_at: {
        [require('sequelize').Op.gt]: new Date()
      }
    },
    include: ['user']
  });
};

module.exports = UserSession;