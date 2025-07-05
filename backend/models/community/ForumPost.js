// models/community/ForumPost.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ForumPost = sequelize.define('ForumPost', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  topic_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'forum_topics',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  author_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parent_post_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'forum_posts',
      key: 'id'
    },
    comment: 'Pour les réponses à un post spécifique'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [5, 10000]
    }
  },
  content_type: {
    type: DataTypes.ENUM('text', 'markdown'),
    allowNull: false,
    defaultValue: 'text'
  },
  likes_count: {
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
  edit_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  last_edited_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_edited_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  is_best_answer: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Meilleure réponse pour les questions'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Pour la modération'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Pour la modération'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'forum_posts',
  indexes: [
    { fields: ['topic_id'] },
    { fields: ['author_id'] },
    { fields: ['parent_post_id'] },
    { fields: ['is_deleted'] },
    { fields: ['is_best_answer'] },
    { fields: ['likes_count'] },
    { fields: ['created_at'] },
    {
      name: 'post_search_index',
      type: 'FULLTEXT',
      fields: ['content']
    }
  ],
  hooks: {
    afterCreate: async (post) => {
      // Mettre à jour le topic
      const topic = await post.getTopic();
      if (topic) {
        await topic.incrementReplies();
        await topic.updateLastActivity(post.id, post.author_id);
      }
    },
    afterUpdate: async (post) => {
      if (post.changed('content')) {
        post.is_edited = true;
        post.edit_count += 1;
        post.last_edited_at = new Date();
      }
    }
  }
});

// Méthodes d'instance
ForumPost.prototype.incrementLike = async function() {
  this.likes_count += 1;
  await this.save(['likes_count']);
};

ForumPost.prototype.markAsBestAnswer = async function() {
  // D'abord, retirer le statut de meilleure réponse des autres posts du topic
  await ForumPost.update(
    { is_best_answer: false },
    { where: { topic_id: this.topic_id } }
  );
  
  // Marquer ce post comme meilleure réponse
  this.is_best_answer = true;
  await this.save(['is_best_answer']);
  
  // Marquer le topic comme résolu
  const topic = await this.getTopic();
  if (topic) {
    await topic.markAsSolved(this.author_id);
  }
};

ForumPost.prototype.softDelete = async function() {
  this.is_deleted = true;
  await this.save(['is_deleted']);
};

// Méthodes de classe
ForumPost.findByTopic = function(topicId, options = {}) {
  return this.findAll({
    where: { 
      topic_id: topicId, 
      is_deleted: false,
      ...options.where 
    },
    order: [['created_at', 'ASC']],
    limit: options.limit,
    offset: options.offset,
    include: ['author', 'parentPost']
  });
};

module.exports = ForumPost;
