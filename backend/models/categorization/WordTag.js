// models/categorization/WordTag.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const WordTag = sequelize.define('WordTag', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  word_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'words',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tag_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  tagged_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  relevance_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Score de pertinence du tag pour ce mot'
  }
}, {
  tableName: 'word_tags',
  indexes: [
    { fields: ['word_id'] },
    { fields: ['tag_id'] },
    { fields: ['tagged_by'] },
    { 
      fields: ['word_id', 'tag_id'], 
      unique: true,
      name: 'unique_word_tag'
    }
  ],
  hooks: {
    afterCreate: async (wordTag) => {
      const Tag = require('./Tag');
      const tag = await Tag.findByPk(wordTag.tag_id);
      if (tag) {
        await tag.incrementUsage();
      }
    }
  }
});

module.exports = WordTag;