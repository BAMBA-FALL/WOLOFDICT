// models/content/PhraseVariation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const PhraseVariation = sequelize.define('PhraseVariation', {
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
  variation_wolof: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variation_francais: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  context_note: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'phrase_variations',
  indexes: [
    { fields: ['phrase_id'] },
    { fields: ['region'] }
  ]
});

module.exports = PhraseVariation;