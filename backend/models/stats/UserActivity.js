// models/stats/UserActivity.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const UserActivity = sequelize.define('UserActivity', {
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
  activity_type: {
    type: DataTypes.ENUM(
      'login', 'logout', 'register',
      'word_view', 'word_create', 'word_edit', 'word_like', 'word_favorite',
      'phrase_view', 'phrase_create', 'phrase_edit', 'phrase_like', 'phrase_favorite',
      'search', 'comment_create', 'comment_like',
      'forum_post_create', 'forum_topic_create',
      'event_view', 'event_register', 'event_attend',
      'project_view', 'project_join', 'project_contribute',
      'profile_update', 'settings_change',
      'audio_play', 'image_view', 'download',
      'suggestion_create', 'suggestion_vote',
      'other'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée de l\'activité'
  },
  entity_type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'user', 'event', 'project', 'comment', 'forum_post', 'forum_topic'),
    allowNull: true,
    comment: 'Type d\'entité concernée'
  },
  entity_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: 'ID de l\'entité concernée'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Métadonnées additionnelles'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  device_type: {
    type: DataTypes.ENUM('desktop', 'tablet', 'mobile', 'unknown'),
    allowNull: false,
    defaultValue: 'unknown'
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  duration_seconds: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Durée de l\'activité en secondes'
  },
  points_earned: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Points gagnés pour cette activité'
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si l\'activité est visible publiquement'
  }
}, {
  tableName: 'user_activities',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['activity_type'] },
    { fields: ['entity_type', 'entity_id'] },
    { fields: ['created_at'] },
    { fields: ['device_type'] },
    { fields: ['session_id'] },
    { fields: ['is_public'] },
    {
      name: 'user_activity_timeline',
      fields: ['user_id', 'created_at']
    }
  ]
});

// Méthodes de classe
UserActivity.getUserTimeline = function(userId, limit = 50, offset = 0) {
  return this.findAll({
    where: { 
      user_id: userId,
      is_public: true
    },
    order: [['created_at', 'DESC']],
    limit,
    offset
  });
};

UserActivity.getRecentActivity = function(limit = 20) {
  return this.findAll({
    where: { is_public: true },
    order: [['created_at', 'DESC']],
    limit,
    include: [{
      model: require('../user/User'),
      as: 'user',
      attributes: ['id', 'username', 'first_name', 'last_name', 'profile_picture']
    }]
  });
};

UserActivity.getActivityStats = function(userId, period = 'month') {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'week':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case 'month':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
  }
  
  return this.findAll({
    where: { 
      user_id: userId,
      ...dateFilter
    },
    attributes: [
      'activity_type',
      [sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.fn('SUM', sequelize.col('points_earned')), 'total_points']
    ],
    group: ['activity_type'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']],
    raw: true
  });
};

UserActivity.logActivity = async function(userId, activityType, options = {}) {
  return await this.create({
    user_id: userId,
    activity_type: activityType,
    description: options.description,
    entity_type: options.entityType,
    entity_id: options.entityId,
    metadata: options.metadata || {},
    ip_address: options.ipAddress,
    user_agent: options.userAgent,
    device_type: options.deviceType || 'unknown',
    session_id: options.sessionId,
    duration_seconds: options.duration,
    points_earned: options.pointsEarned || 0,
    is_public: options.isPublic !== false
  });
};

module.exports = UserActivity;