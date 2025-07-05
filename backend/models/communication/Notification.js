// models/communication/Notification.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Notification = sequelize.define('Notification', {
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
  type: {
    type: DataTypes.ENUM(
      'new_word', 'word_verified', 'word_comment',
      'new_phrase', 'phrase_verified', 'phrase_comment',
      'new_follower', 'contribution_approved', 'contribution_rejected',
      'event_reminder', 'event_cancelled', 'event_updated',
      'forum_reply', 'forum_mention', 'forum_topic_locked',
      'project_invitation', 'project_update', 'project_completed',
      'system_update', 'maintenance', 'welcome',
      'like_received', 'favorite_added', 'rating_received',
      'newsletter', 'achievement', 'streak_milestone',
      'comment_reply', 'moderation_action', 'custom'
    ),
    allowNull: false,
    comment: 'Type de notification'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 2000]
    }
  },
  short_message: {
    type: DataTypes.STRING(150),
    allowNull: true,
    comment: 'Version courte pour push notifications'
  },
  action_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL vers laquelle rediriger quand on clique'
  },
  action_text: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Texte du bouton d\'action'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal'
  },
  channel: {
    type: DataTypes.ENUM('in_app', 'email', 'push', 'sms'),
    allowNull: false,
    defaultValue: 'in_app'
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_delivered: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Pour les notifications push/email'
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivery_attempts: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  last_delivery_attempt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivery_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Erreur de livraison si applicable'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date d\'expiration de la notification'
  },
  related_type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'event', 'project', 'forum_topic', 'forum_post', 'comment', 'user'),
    allowNull: true,
    comment: 'Type d\'entité liée'
  },
  related_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: 'ID de l\'entité liée'
  },
  sender_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Utilisateur à l\'origine de la notification'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Icône à afficher'
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    },
    comment: 'Couleur de la notification'
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'Image associée à la notification'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Données supplémentaires pour la notification'
  },
  batch_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID de lot pour notifications groupées'
  },
  is_grouped: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Fait partie d\'un groupe de notifications'
  },
  group_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Clé pour grouper les notifications similaires'
  },
  scheduled_for: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Programmée pour être envoyée à cette date'
  },
  is_scheduled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  template_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID du template utilisé'
  },
  personalization_data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Données pour personnaliser le template'
  }
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['type'] },
    { fields: ['is_read'] },
    { fields: ['is_delivered'] },
    { fields: ['priority'] },
    { fields: ['channel'] },
    { fields: ['expires_at'] },
    { fields: ['related_type', 'related_id'] },
    { fields: ['sender_id'] },
    { fields: ['batch_id'] },
    { fields: ['group_key'] },
    { fields: ['scheduled_for'] },
    { fields: ['is_scheduled'] },
    { fields: ['created_at'] },
    { fields: ['read_at'] },
    { fields: ['delivered_at'] },
    {
      name: 'notification_search_index',
      type: 'FULLTEXT',
      fields: ['title', 'message']
    }
  ]
});

// Méthodes d'instance
Notification.prototype.markAsRead = async function() {
  if (!this.is_read) {
    this.is_read = true;
    this.read_at = new Date();
    await this.save(['is_read', 'read_at']);
  }
};

Notification.prototype.markAsDelivered = async function() {
  this.is_delivered = true;
  this.delivered_at = new Date();
  await this.save(['is_delivered', 'delivered_at']);
};

Notification.prototype.incrementDeliveryAttempt = async function(error = null) {
  this.delivery_attempts += 1;
  this.last_delivery_attempt = new Date();
  if (error) {
    this.delivery_error = error.toString();
  }
  await this.save(['delivery_attempts', 'last_delivery_attempt', 'delivery_error']);
};

Notification.prototype.isExpired = function() {
  return this.expires_at && new Date() > this.expires_at;
};

Notification.prototype.shouldRetryDelivery = function() {
  return !this.is_delivered && 
         this.delivery_attempts < 3 && 
         !this.isExpired() &&
         (!this.last_delivery_attempt || 
          new Date() - this.last_delivery_attempt > 5 * 60 * 1000); // 5 minutes
};

Notification.prototype.getDisplayData = function() {
  return {
    id: this.id,
    type: this.type,
    title: this.title,
    message: this.message,
    short_message: this.short_message,
    action_url: this.action_url,
    action_text: this.action_text,
    priority: this.priority,
    is_read: this.is_read,
    icon: this.icon,
    color: this.color,
    image_url: this.image_url,
    created_at: this.created_at,
    read_at: this.read_at,
    data: this.data,
    sender: this.sender
  };
};

// Méthodes de classe
Notification.findUnreadByUser = function(userId, options = {}) {
  return this.findAll({
    where: { 
      user_id: userId, 
      is_read: false,
      [require('sequelize').Op.or]: [
        { expires_at: null },
        { expires_at: { [require('sequelize').Op.gt]: new Date() } }
      ],
      ...options.where
    },
    order: [['created_at', 'DESC']],
    limit: options.limit || 50,
    offset: options.offset || 0,
    include: options.include || ['sender']
  });
};

Notification.getUnreadCount = function(userId) {
  const { Op } = require('sequelize');
  return this.count({
    where: { 
      user_id: userId, 
      is_read: false,
      [Op.or]: [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ]
    }
  });
};

Notification.markAllAsReadByUser = async function(userId) {
  return await this.update(
    { is_read: true, read_at: new Date() },
    { 
      where: { 
        user_id: userId, 
        is_read: false 
      } 
    }
  );
};

Notification.cleanupExpired = async function() {
  const { Op } = require('sequelize');
  return await this.destroy({
    where: {
      expires_at: { [Op.lt]: new Date() }
    }
  });
};

Notification.getPendingDeliveries = function(channel = null) {
  const { Op } = require('sequelize');
  const where = {
    is_delivered: false,
    delivery_attempts: { [Op.lt]: 3 },
    [Op.or]: [
      { expires_at: null },
      { expires_at: { [Op.gt]: new Date() } }
    ],
    [Op.or]: [
      { scheduled_for: null },
      { scheduled_for: { [Op.lte]: new Date() } }
    ]
  };
  
  if (channel) {
    where.channel = channel;
  }
  
  return this.findAll({
    where,
    order: [['priority', 'DESC'], ['created_at', 'ASC']],
    include: ['user', 'sender']
  });
};

Notification.createBulk = async function(notifications) {
  const batchId = require('crypto').randomUUID();
  
  const notificationsWithBatch = notifications.map(notif => ({
    ...notif,
    batch_id: batchId,
    created_at: new Date(),
    updated_at: new Date()
  }));
  
  return await this.bulkCreate(notificationsWithBatch);
};

Notification.getStatsByUser = function(userId, period = 'month') {
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
      'type',
      [sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.fn('SUM', sequelize.cast(sequelize.col('is_read'), 'SIGNED')), 'read_count']
    ],
    group: ['type'],
    raw: true
  });
};

module.exports = Notification;