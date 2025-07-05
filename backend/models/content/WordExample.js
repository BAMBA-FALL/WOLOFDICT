// models/content/WordExample.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const WordExample = sequelize.define('WordExample', {
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
  wolof_example: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [5, 1000]
    }
  },
  francais_example: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [5, 1000]
    }
  },
  context: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Contexte d\'usage (formel, informel, etc.)'
  },
  usage_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Note sur l\'usage particulier'
  },
  difficulty_level: {
    type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé'),
    allowNull: false,
    defaultValue: 'débutant'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'word_examples',
  indexes: [
    { fields: ['word_id'] },
    { fields: ['difficulty_level'] },
    { fields: ['is_verified'] },
    { fields: ['created_by'] }
  ]
});

module.exports = WordExample;