// models/admin/ReportedContent.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ReportedContent = sequelize.define('ReportedContent', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  reporter_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur qui a signalé le contenu'
  },
  content_type: {
    type: DataTypes.ENUM(
      'word', 'phrase', 'proverb', 'comment', 
      'forum_topic', 'forum_post', 'event', 
      'user_profile', 'audio_recording', 'image'
    ),
    allowNull: false,
    comment: 'Type de contenu signalé'
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: 'ID du contenu signalé'
  },
  content_author_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Auteur du contenu signalé'
  },
  reason: {
    type: DataTypes.ENUM(
      'spam', 'inappropriate_content', 'hate_speech', 'harassment',
      'misinformation', 'copyright_violation', 'privacy_violation',
      'violent_content', 'sexual_content', 'self_harm',
      'fake_profile', 'scam', 'off_topic', 'low_quality',
      'duplicate_content', 'other'
    ),
    allowNull: false,
    comment: 'Raison du signalement'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000]
    },
    comment: 'Description détaillée du problème'
  },
  evidence: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Preuves (URLs, screenshots, etc.)'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Sévérité estimée du problème'
  },
  status: {
    type: DataTypes.ENUM(
      'pending', 'under_review', 'investigating',
      'resolved', 'dismissed', 'escalated',
      'requires_action', 'duplicate'
    ),
    allowNull: false,
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal',
    comment: 'Priorité de traitement'
  },
  category: {
    type: DataTypes.ENUM(
      'content_quality', 'community_guidelines', 'legal_issue',
      'technical_issue', 'user_behavior', 'platform_abuse'
    ),
    allowNull: true,
    comment: 'Catégorie du signalement'
  },
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Signalement anonyme'
  },
  is_false_positive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Marqué comme faux positif'
  },
  is_duplicate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  duplicate_of: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'reported_content',
      key: 'id'
    },
    comment: 'Référence vers le signalement original si doublon'
  },
  assigned_to: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Modérateur assigné au traitement'
  },
  assigned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolution_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Note de résolution'
  },
  action_taken: {
    type: DataTypes.ENUM(
      'no_action', 'content_removed', 'content_edited', 'content_hidden',
      'user_warned', 'user_suspended', 'user_banned',
      'content_approved', 'escalated_to_admin'
    ),
    allowNull: true,
    comment: 'Action prise suite au signalement'
  },
  moderator_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes internes des modérateurs'
  },
  escalation_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raison de l\'escalade vers un niveau supérieur'
  },
  escalated_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  escalated_to: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  follow_up_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  follow_up_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reporter_notified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  author_notified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'reported_content',
  indexes: [
    { fields: ['reporter_id'] },
    { fields: ['content_type', 'content_id'] },
    { fields: ['content_author_id'] },
    { fields: ['reason'] },
    { fields: ['status'] },
    { fields: ['severity'] },
    { fields: ['priority'] },
    { fields: ['assigned_to'] },
    { fields: ['resolved_by'] },
    { fields: ['is_duplicate'] },
    { fields: ['duplicate_of'] },
    { fields: ['created_at'] },
    { fields: ['resolved_at'] },
    {
      name: 'report_status_priority',
      fields: ['status', 'priority', 'created_at']
    },
    {
      name: 'content_reports',
      fields: ['content_type', 'content_id', 'status']
    }
  ]
});

// Méthodes d'instance
ReportedContent.prototype.assign = async function(moderatorId) {
  this.assigned_to = moderatorId;
  this.assigned_at = new Date();
  this.status = 'under_review';
  
  await this.save(['assigned_to', 'assigned_at', 'status']);
};

ReportedContent.prototype.resolve = async function(resolvedBy, actionTaken, note) {
  this.resolved_by = resolvedBy;
  this.resolved_at = new Date();
  this.status = 'resolved';
  this.action_taken = actionTaken;
  this.resolution_note = note;
  
  await this.save([
    'resolved_by', 'resolved_at', 'status', 
    'action_taken', 'resolution_note'
  ]);
  
  // Envoyer des notifications
  await this.notifyReporter();
  if (this.content_author_id && actionTaken !== 'no_action') {
    await this.notifyAuthor();
  }
};

ReportedContent.prototype.dismiss = async function(dismissedBy, reason) {
  this.resolved_by = dismissedBy;
  this.resolved_at = new Date();
  this.status = 'dismissed';
  this.resolution_note = reason;
  this.is_false_positive = true;
  
  await this.save([
    'resolved_by', 'resolved_at', 'status', 
    'resolution_note', 'is_false_positive'
  ]);
  
  await this.notifyReporter();
};

ReportedContent.prototype.escalate = async function(escalatedBy, escalatedTo, reason) {
  this.status = 'escalated';
  this.escalated_at = new Date();
  this.escalated_to = escalatedTo;
  this.escalation_reason = reason;
  this.assigned_to = escalatedTo;
  
  await this.save([
    'status', 'escalated_at', 'escalated_to', 
    'escalation_reason', 'assigned_to'
  ]);
};

ReportedContent.prototype.markAsDuplicate = async function(originalReportId) {
  this.is_duplicate = true;
  this.duplicate_of = originalReportId;
  this.status = 'duplicate';
  
  await this.save(['is_duplicate', 'duplicate_of', 'status']);
};

ReportedContent.prototype.notifyReporter = async function() {
  if (this.reporter_notified) return;
  
  // Logique de notification du rapporteur
  // const notificationService = require('../../services/NotificationService');
  // await notificationService.sendReportStatusUpdate(this);
  
  this.reporter_notified = true;
  await this.save(['reporter_notified']);
};

ReportedContent.prototype.notifyAuthor = async function() {
  if (this.author_notified || !this.content_author_id) return;
  
  // Logique de notification de l'auteur du contenu
  // const notificationService = require('../../services/NotificationService');
  // await notificationService.sendContentActionNotification(this);
  
  this.author_notified = true;
  await this.save(['author_notified']);
};

// Méthodes de classe
ReportedContent.getPendingReports = function(options = {}) {
  return this.findAll({
    where: {
      status: ['pending', 'under_review'],
      ...options.where
    },
    order: [
      ['priority', 'DESC'],
      ['severity', 'DESC'],
      ['created_at', 'ASC']
    ],
    limit: options.limit || 50,
    include: [
      {
        model: require('../user/User'),
        as: 'reporter',
        attributes: ['id', 'username']
      },
      {
        model: require('../user/User'),
        as: 'assignedTo',
        attributes: ['id', 'username'],
        required: false
      }
    ]
  });
};

ReportedContent.getReportStats = function(period = 'month') {
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
    where: dateFilter,
    attributes: [
      'reason',
      'status',
      [sequelize.fn('COUNT', '*'), 'count']
    ],
    group: ['reason', 'status'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']]
  });
};

ReportedContent.getContentReports = function(contentType, contentId) {
  return this.findAll({
    where: {
      content_type: contentType,
      content_id: contentId
    },
    order: [['created_at', 'DESC']],
    include: [
      {
        model: require('../user/User'),
        as: 'reporter',
        attributes: ['id', 'username']
      },
      {
        model: require('../user/User'),
        as: 'resolvedBy',
        attributes: ['id', 'username'],
        required: false
      }
    ]
  });
};

module.exports = ReportedContent;
