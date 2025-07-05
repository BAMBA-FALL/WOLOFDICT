// models/content/WordVariation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const WordVariation = sequelize.define('WordVariation', {
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
  variation_wolof: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Région où cette variation est utilisée'
  },
  dialect: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Dialecte spécifique'
  },
  usage_note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  frequency: {
    type: DataTypes.ENUM('très_courant', 'courant', 'peu_courant', 'rare'),
    allowNull: false,
    defaultValue: 'courant'
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
  tableName: 'word_variations',
  indexes: [
    { fields: ['word_id'] },
    { fields: ['variation_wolof'] },
    { fields: ['region'] },
    { fields: ['dialect'] },
    { fields: ['frequency'] }
  ]
});

module.exports = WordVariation;