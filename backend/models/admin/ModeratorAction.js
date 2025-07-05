// models/admin/ModeratorAction.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ModeratorAction = sequelize.define('ModeratorAction', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  moderator_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Modérateur qui a effectué l\'action'
  },
  action_type: {
    type: DataTypes.ENUM(
      'approve_content', 'reject_content', 'edit_content', 'delete_content',
      'ban_user', 'unban_user', 'warn_user', 'suspend_user',
      'lock_topic', 'unlock_topic', 'pin_topic', 'unpin_topic',
      'move_topic', 'merge_topics', 'split_topic',
      'approve_comment', 'delete_comment', 'hide_comment',
      'verify_translation', 'reject_translation',
      'feature_content', 'unfeature_content',
      'bulk_action', 'system_maintenance',
      'permission_change', 'role_assignment',
      'content_restoration', 'data_export'
    ),
    allowNull: false,
    comment: 'Type d\'action de modération'
  },
  target_type: {
    type: DataTypes.ENUM(
      'user', 'word', 'phrase', 'proverb', 'comment', 
      'forum_topic', 'forum_post', 'event', 'project',
      'audio_recording', 'image', 'suggestion',
      'system', 'bulk'
    ),
    allowNull: true,
    comment: 'Type d\'entité ciblée par l\'action'
  },
  target_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: 'ID de l\'entité ciblée (null pour actions système)'
  },
  target_user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur ciblé par l\'action (si applicable)'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [5, 2000]
    },
    comment: 'Raison de l\'action de modération'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Détails supplémentaires sur l\'action'
  },
  previous_state: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'État précédent pour permettre l\'annulation'
  },
  new_state: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Nouvel état après l\'action'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Sévérité de l\'action'
  },
  is_automated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Action effectuée automatiquement par le système'
  },
  automation_rule_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'ID de la règle d\'automatisation si applicable'
  },
  is_reversible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'L\'action peut-elle être annulée'
  },
  is_reversed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'L\'action a-t-elle été annulée'
  },
  reversed_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Modérateur qui a annulé l\'action'
  },
  reversed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reversal_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Adresse IP du modérateur'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent du navigateur'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration pour actions temporaires'
  },
  notification_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Notification envoyée à l\'utilisateur ciblé'
  },
  requires_approval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Action nécessite approbation d\'un admin'
  },
  approved_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  batch_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'ID pour grouper les actions en lot'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'moderator_actions',
  indexes: [
    { fields: ['moderator_id'] },
    { fields: ['action_type'] },
    { fields: ['target_type', 'target_id'] },
    { fields: ['target_user_id'] },
    { fields: ['severity'] },
    { fields: ['is_automated'] },
    { fields: ['is_reversed'] },
    { fields: ['created_at'] },
    { fields: ['expires_at'] },
    { fields: ['batch_id'] },
    { fields: ['requires_approval'] },
    { fields: ['approved_by'] },
    {
      name: 'moderator_action_search',
      fields: ['action_type', 'target_type', 'severity', 'created_at']
    }
  ]
});

// Méthodes d'instance
ModeratorAction.prototype.reverse = async function(reversedBy, reason) {
  if (!this.is_reversible || this.is_reversed) {
    throw new Error('Cette action ne peut pas être annulée');
  }
  
  this.is_reversed = true;
  this.reversed_by = reversedBy;
  this.reversed_at = new Date();
  this.reversal_reason = reason;
  
  await this.save([
    'is_reversed', 'reversed_by', 'reversed_at', 'reversal_reason'
  ]);
  
  // Ici, on ajouterait la logique pour restaurer l'état précédent
  // selon le type d'action et les données dans previous_state
};

ModeratorAction.prototype.approve = async function(approvedBy) {
  if (!this.requires_approval) {
    throw new Error('Cette action ne nécessite pas d\'approbation');
  }
  
  this.approved_by = approvedBy;
  this.approved_at = new Date();
  
  await this.save(['approved_by', 'approved_at']);
  
  // Ici, on exécuterait effectivement l'action après approbation
};

ModeratorAction.prototype.isExpired = function() {
  return this.expires_at && new Date() > this.expires_at;
};

ModeratorAction.prototype.sendNotification = async function() {
  if (this.notification_sent || !this.target_user_id) return;
  
  // Logique d'envoi de notification
  // const notificationService = require('../../services/NotificationService');
  // await notificationService.sendModerationNotification(this);
  
  this.notification_sent = true;
  await this.save(['notification_sent']);
};

// Méthodes de classe
ModeratorAction.getActionLog = function(options = {}) {
  const { Op } = require('sequelize');
  
  let whereClause = {};
  
  if (options.moderatorId) {
    whereClause.moderator_id = options.moderatorId;
  }
  
  if (options.targetType) {
    whereClause.target_type = options.targetType;
  }
  
  if (options.actionType) {
    whereClause.action_type = options.actionType;
  }
  
  if (options.severity) {
    whereClause.severity = options.severity;
  }
  
  if (options.dateFrom) {
    whereClause.created_at = {
      [Op.gte]: options.dateFrom
    };
  }
  
  if (options.dateTo) {
    whereClause.created_at = {
      ...whereClause.created_at,
      [Op.lte]: options.dateTo
    };
  }
  
  return this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']],
    limit: options.limit || 50,
    offset: options.offset || 0,
    include: [
      {
        model: require('../user/User'),
        as: 'moderator',
        attributes: ['id', 'username', 'first_name', 'last_name']
      },
      {
        model: require('../user/User'),
        as: 'targetUser',
        attributes: ['id', 'username', 'first_name', 'last_name'],
        required: false
      }
    ]
  });
};

ModeratorAction.getActionStats = function(period = 'month') {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'day':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      };
      break;
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
    where: dateFilter,
    attributes: [
      'action_type',
      'severity',
      [sequelize.fn('COUNT', '*'), 'count']
    ],
    group: ['action_type', 'severity'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']]
  });
};

ModeratorAction.getModeratorStats = function(moderatorId, period = 'month') {
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
      moderator_id: moderatorId,
      ...dateFilter
    },
    attributes: [
      'action_type',
      [sequelize.fn('COUNT', '*'), 'count']
    ],
    group: ['action_type'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']]
  });
};

ModeratorAction.cleanupExpired = async function() {
  const { Op } = require('sequelize');
  
  const expiredActions = await this.findAll({
    where: {
      expires_at: {
        [Op.lt]: new Date()
      },
      is_reversed: false
    }
  });
  
  // Ici, on ajouterait la logique pour restaurer automatiquement
  // les éléments ayant des actions temporaires expirées
  
  return expiredActions.length;
};

module.exports = ModeratorAction;