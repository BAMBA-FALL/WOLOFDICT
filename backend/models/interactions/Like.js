// models/interactions/Like.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Like = sequelize.define('Like', {
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
  content_type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'comment', 'forum_post', 'event'),
    allowNull: false,
    comment: 'Type de contenu liké'
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: 'ID du contenu liké'
  },
  reaction_type: {
    type: DataTypes.ENUM('like', 'love', 'helpful', 'funny', 'insightful'),
    allowNull: false,
    defaultValue: 'like',
    comment: 'Type de réaction'
  }
}, {
  tableName: 'likes',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['content_type', 'content_id'] },
    { fields: ['content_type'] },
    { fields: ['reaction_type'] },
    { 
      fields: ['user_id', 'content_type', 'content_id'], 
      unique: true,
      name: 'unique_user_like'
    }
  ],
  hooks: {
    afterCreate: async (like) => {
      await like.incrementContentLikeCount();
    },
    afterDestroy: async (like) => {
      await like.decrementContentLikeCount();
    },
    afterUpdate: async (like) => {
      // Si le type de réaction change, on peut ajuster les scores différemment
      if (like.changed('reaction_type')) {
        // Logique pour gérer les changements de type de réaction
      }
    }
  }
});

// Méthodes d'instance
Like.prototype.incrementContentLikeCount = async function() {
  const { Word, Phrase, Proverb, Comment, ForumPost } = require('../index');
  
  let model;
  switch (this.content_type) {
    case 'word':
      model = Word;
      break;
    case 'phrase':
      model = Phrase;
      break;
    case 'proverb':
      model = Proverb;
      break;
    case 'comment':
      model = Comment;
      break;
    case 'forum_post':
      model = ForumPost;
      break;
    default:
      return;
  }
  
  const content = await model.findByPk(this.content_id);
  if (content && typeof content.incrementLike === 'function') {
    await content.incrementLike();
  } else if (content && content.like_count !== undefined) {
    await content.increment('like_count');
    if (content.popularity_score !== undefined) {
      await content.increment('popularity_score', { by: 5 });
    }
  }
};

Like.prototype.decrementContentLikeCount = async function() {
  const { Word, Phrase, Proverb, Comment, ForumPost } = require('../index');
  
  let model;
  switch (this.content_type) {
    case 'word':
      model = Word;
      break;
    case 'phrase':
      model = Phrase;
      break;
    case 'proverb':
      model = Proverb;
      break;
    case 'comment':
      model = Comment;
      break;
    case 'forum_post':
      model = ForumPost;
      break;
    default:
      return;
  }
  
  const content = await model.findByPk(this.content_id);
  if (content && content.like_count > 0) {
    await content.decrement('like_count');
    if (content.popularity_score !== undefined && content.popularity_score > 0) {
      await content.decrement('popularity_score', { by: 5 });
    }
  }
};

// Méthodes de classe
Like.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: { user_id: userId, ...options.where },
    order: [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.offset
  });
};

Like.getReactionStats = function(contentType, contentId) {
  return this.findAll({
    where: { content_type: contentType, content_id: contentId },
    attributes: ['reaction_type', [sequelize.fn('COUNT', '*'), 'count']],
    group: ['reaction_type'],
    raw: true
  });
};

module.exports = Like;