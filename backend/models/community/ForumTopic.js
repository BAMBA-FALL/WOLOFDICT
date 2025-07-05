// models/community/ForumTopic.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ForumTopic = sequelize.define('ForumTopic', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [5, 255]
    }
  },
  slug: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'forum_categories',
      key: 'id'
    }
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 10000]
    }
  },
  content_type: {
    type: DataTypes.ENUM('text', 'markdown'),
    allowNull: false,
    defaultValue: 'text'
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_locked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_solved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Pour les sujets de type question'
  },
  topic_type: {
    type: DataTypes.ENUM('discussion', 'question', 'announcement', 'poll'),
    allowNull: false,
    defaultValue: 'discussion'
  },
  views_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  replies_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  likes_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  last_post_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'forum_posts',
      key: 'id'
    }
  },
  last_post_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  last_activity_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  poll_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Données du sondage si topic_type = poll'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'forum_topics',
  indexes: [
    { fields: ['slug'] },
    { fields: ['category_id'] },
    { fields: ['created_by'] },
    { fields: ['is_pinned'] },
    { fields: ['is_locked'] },
    { fields: ['is_solved'] },
    { fields: ['topic_type'] },
    { fields: ['views_count'] },
    { fields: ['replies_count'] },
    { fields: ['last_activity_at'] },
    { fields: ['last_post_by'] },
    {
      name: 'topic_search_index',
      type: 'FULLTEXT',
      fields: ['title', 'content']
    },
    {
      fields: ['category_id', 'slug'],
      unique: true,
      name: 'unique_category_slug'
    }
  ],
  hooks: {
    beforeSave: (topic) => {
      if (topic.changed('title') && !topic.slug) {
        topic.slug = topic.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 250);
      }
    },
    afterCreate: async (topic) => {
      // Mettre à jour les stats de la catégorie
      const category = await topic.getCategory();
      if (category) {
        await category.updateStats();
      }
    }
  }
});

// Méthodes d'instance
ForumTopic.prototype.incrementView = async function() {
  this.views_count += 1;
  await this.save(['views_count']);
};

ForumTopic.prototype.updateLastActivity = async function(postId, userId) {
  this.last_post_id = postId;
  this.last_post_by = userId;
  this.last_activity_at = new Date();
  await this.save(['last_post_id', 'last_post_by', 'last_activity_at']);
  
  // Mettre à jour les stats de la catégorie
  const category = await this.getCategory();
  if (category) {
    await category.updateStats();
  }
};

ForumTopic.prototype.incrementReplies = async function() {
  this.replies_count += 1;
  await this.save(['replies_count']);
};

ForumTopic.prototype.markAsSolved = async function(solvedBy) {
  this.is_solved = true;
  this.metadata = {
    ...this.metadata,
    solved_by: solvedBy,
    solved_at: new Date()
  };
  await this.save(['is_solved', 'metadata']);
};

// Méthodes de classe
ForumTopic.getPopular = function(limit = 10, days = 7) {
  const { Op } = require('sequelize');
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.findAll({
    where: {
      created_at: { [Op.gte]: since },
      is_locked: false
    },
    order: [
      ['views_count', 'DESC'],
      ['replies_count', 'DESC'],
      ['likes_count', 'DESC']
    ],
    limit,
    include: ['creator', 'category']
  });
};

ForumTopic.searchTopics = function(query, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { content: { [Op.like]: `%${query}%` } }
      ],
      ...options.where
    },
    order: [['last_activity_at', 'DESC']],
    limit: options.limit || 20,
    offset: options.offset || 0,
    include: ['creator', 'category']
  });
};

module.exports = ForumTopic;