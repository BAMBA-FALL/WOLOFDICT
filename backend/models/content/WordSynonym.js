// models/content/WordSynonym.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const WordSynonym = sequelize.define('WordSynonym', {
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
  synonym_wolof: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  synonym_francais: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  relationship_type: {
    type: DataTypes.ENUM('synonym', 'antonym', 'related', 'hyponym', 'hypernym'),
    allowNull: false,
    defaultValue: 'synonym'
  },
  similarity_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Score de similarité entre 0 et 1'
  },
  context_note: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'word_synonyms',
  indexes: [
    { fields: ['word_id'] },
    { fields: ['relationship_type'] },
    { fields: ['synonym_wolof'] },
    { fields: ['is_verified'] }
  ]
});

module.exports = WordSynonym;