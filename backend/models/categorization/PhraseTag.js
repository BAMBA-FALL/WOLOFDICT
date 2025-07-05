// models/categorization/PhraseTag.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const PhraseTag = sequelize.define('PhraseTag', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  phrase_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'phrases',
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
    }
  }
}, {
  tableName: 'phrase_tags',
  indexes: [
    { fields: ['phrase_id'] },
    { fields: ['tag_id'] },
    { fields: ['tagged_by'] },
    { 
      fields: ['phrase_id', 'tag_id'], 
      unique: true,
      name: 'unique_phrase_tag'
    }
  ],
  hooks: {
    afterCreate: async (phraseTag) => {
      const Tag = require('./Tag');
      const tag = await Tag.findByPk(phraseTag.tag_id);
      if (tag) {
        await tag.incrementUsage();
      }
    }
  }
});

module.exports = PhraseTag;