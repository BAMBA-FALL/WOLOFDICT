// models/user/UserProfile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  native_language: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  learning_goals: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  notification_preferences: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email_notifications: true,
      push_notifications: true,
      weekly_digest: true,
      new_words: true,
      community_updates: true,
      events: true
    }
  },
  privacy_settings: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      show_profile: true,
      show_contributions: true,
      show_activity: false,
      show_favorites: false
    }
  },
  social_links: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  education_level: {
    type: DataTypes.ENUM('elementary', 'secondary', 'undergraduate', 'graduate', 'postgraduate'),
    allowNull: true
  },
  profession: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  interests: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  languages_spoken: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }
}, {
  tableName: 'user_profiles',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['native_language'] },
    { fields: ['education_level'] }
  ]
});

module.exports = UserProfile;