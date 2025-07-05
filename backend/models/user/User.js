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
  password_hash: {
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
  profile_picture: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'expert', 'moderator', 'contributor', 'user'),
    allowNull: false,
    defaultValue: 'user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
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
  indexes: [
    { fields: ['email'] },
    { fields: ['username'] },
    { fields: ['role'] },
    { fields: ['is_active'] },
    { fields: ['contribution_count'] },
    { fields: ['points'] }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
      }
    }
  }
});

// Méthodes d'instance
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

User.prototype.getFullName = function() {
  return `${this.first_name || ''} ${this.last_name || ''}`.trim() || this.username;
};

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

// Méthodes de classe
User.findByRole = function(role) {
  return this.findAll({ where: { role, is_active: true } });
};

User.getTopContributors = function(limit = 10) {
  return this.findAll({
    where: { is_active: true },
    order: [['contribution_count', 'DESC']],
    limit,
    attributes: ['id', 'username', 'first_name', 'last_name', 'profile_picture', 'contribution_count', 'points']
  });
};

module.exports = User;