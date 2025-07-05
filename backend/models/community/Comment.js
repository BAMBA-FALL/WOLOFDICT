// models/community/Comment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [3, 2000]
    }
  },
  author_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  content_type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'event', 'project'),
    allowNull: false,
    comment: 'Type de contenu commenté'
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: 'ID du contenu commenté'
  },
  parent_comment_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    },
    comment: 'Pour les réponses à un commentaire'
  },
  likes_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  replies_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_edited: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  last_edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_flagged: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Signalé par la communauté'
  },
  flag_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Vérifié par un modérateur'
  },
  sentiment_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: -1,
      max: 1
    },
    comment: 'Score de sentiment automatique (-1 à 1)'
  },
  language_detected: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: 'Langue détectée automatiquement'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'comments',
  indexes: [
    { fields: ['author_id'] },
    { fields: ['content_type', 'content_id'] },
    { fields: ['parent_comment_id'] },
    { fields: ['is_deleted'] },
    { fields: ['is_flagged'] },
    { fields: ['is_verified'] },
    { fields: ['likes_count'] },
    { fields: ['created_at'] },
    {
      name: 'comment_search_index',
      type: 'FULLTEXT',
      fields: ['content']
    }
  ],
  hooks: {
    afterCreate: async (comment) => {
      // Incrémenter le compteur de réponses du commentaire parent
      if (comment.parent_comment_id) {
        await Comment.increment('replies_count', {
          where: { id: comment.parent_comment_id }
        });
      }
    },
    afterUpdate: async (comment) => {
      if (comment.changed('content')) {
        comment.is_edited = true;
        comment.last_edited_at = new Date();
      }
    }
  }
});

// Méthodes d'instance
Comment.prototype.incrementLike = async function() {
  this.likes_count += 1;
  await this.save(['likes_count']);
};

Comment.prototype.flag = async function() {
  this.flag_count += 1;
  if (this.flag_count >= 3) {
    this.is_flagged = true;
  }
  await this.save(['flag_count', 'is_flagged']);
};

Comment.prototype.verify = async function(moderatorId) {
  this.is_verified = true;
  this.is_flagged = false;
  this.metadata = {
    ...this.metadata,
    verified_by: moderatorId,
    verified_at: new Date()
  };
  await this.save(['is_verified', 'is_flagged', 'metadata']);
};

Comment.prototype.softDelete = async function() {
  this.is_deleted = true;
  await this.save(['is_deleted']);
};

// Méthodes de classe
Comment.findByContent = function(contentType, contentId, options = {}) {
  return this.findAll({
    where: { 
      content_type: contentType, 
      content_id: contentId,
      is_deleted: false,
      parent_comment_id: null, // Commentaires principaux seulement
      ...options.where
    },
    order: [['created_at', options.order || 'ASC']],
    limit: options.limit,
    offset: options.offset,
    include: [
      {
        model: require('../user/User'),
        as: 'author',
        attributes: ['id', 'username', 'first_name', 'last_name', 'profile_picture']
      },
      {
        model: Comment,
        as: 'replies',
        where: { is_deleted: false },
        required: false,
        include: [{
          model: require('../user/User'),
          as: 'author',
          attributes: ['id', 'username', 'first_name', 'last_name', 'profile_picture']
        }]
      }
    ]
  });
};

Comment.getRecent = function(limit = 20) {
  return this.findAll({
    where: { is_deleted: false, is_flagged: false },
    order: [['created_at', 'DESC']],
    limit,
    include: ['author']
  });
};

Comment.getFlagged = function() {
  return this.findAll({
    where: { is_flagged: true, is_deleted: false },
    order: [['flag_count', 'DESC'], ['created_at', 'DESC']],
    include: ['author']
  });
};

module.exports = Comment;