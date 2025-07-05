// models/community/ForumCategory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ForumCategory = sequelize.define('ForumCategory', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [3, 100]
    }
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  parent_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'forum_categories',
      key: 'id'
    },
    comment: 'Catégorie parent pour hiérarchie'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Icône de la catégorie'
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    },
    defaultValue: '#3B82F6'
  },
  display_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Visible par tous ou membres seulement'
  },
  is_locked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Verrouillée pour nouveaux sujets'
  },
  topic_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  post_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  last_topic_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'forum_topics',
      key: 'id'
    }
  },
  last_post_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  moderator_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Modérateur principal de la catégorie'
  },
  posting_rules: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Règles spécifiques à cette catégorie'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'forum_categories',
  indexes: [
    { fields: ['slug'] },
    { fields: ['parent_id'] },
    { fields: ['is_public'] },
    { fields: ['is_locked'] },
    { fields: ['display_order'] },
    { fields: ['topic_count'] },
    { fields: ['post_count'] },
    { fields: ['moderator_id'] },
    { fields: ['last_post_at'] }
  ],
  hooks: {
    beforeSave: (category) => {
      if (category.changed('name') && !category.slug) {
        category.slug = category.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
    }
  }
});

// Méthodes d'instance
ForumCategory.prototype.updateStats = async function() {
  const { ForumTopic, ForumPost } = require('../index');
  
  const topicCount = await ForumTopic.count({ where: { category_id: this.id } });
  const postCount = await ForumPost.count({
    include: [{
      model: ForumTopic,
      as: 'topic',
      where: { category_id: this.id }
    }]
  });
  
  const lastTopic = await ForumTopic.findOne({
    where: { category_id: this.id },
    order: [['last_activity_at', 'DESC']]
  });
  
  await this.update({
    topic_count: topicCount,
    post_count: postCount,
    last_topic_id: lastTopic ? lastTopic.id : null,
    last_post_at: lastTopic ? lastTopic.last_activity_at : null
  });
};

// Méthodes de classe
ForumCategory.getHierarchy = async function() {
  const categories = await this.findAll({
    where: { is_public: true },
    order: [['display_order', 'ASC'], ['name', 'ASC']],
    include: ['moderator']
  });
  
  const buildTree = (parentId = null) => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat.toJSON(),
        children: buildTree(cat.id)
      }));
  };
  
  return buildTree();
};

module.exports = ForumCategory;