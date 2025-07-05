// models/content/Alphabet.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Alphabet = sequelize.define('Alphabet', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  letter: {
    type: DataTypes.STRING(5),
    allowNull: false,
    unique: true
  },
  letter_lowercase: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  pronunciation_guide: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Guide de prononciation en notation IPA'
  },
  examples_words: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  phonetic_details: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Détails phonétiques et articulatoires'
  },
  order_position: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    unique: true
  },
  is_special_character: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Caractère spécial au wolof (ñ, ŋ, etc.)'
  },
  usage_frequency: {
    type: DataTypes.ENUM('très_courant', 'courant', 'peu_courant'),
    allowNull: false,
    defaultValue: 'courant'
  },
  audio_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  }
}, {
  tableName: 'alphabet',
  timestamps: false,
  indexes: [
    { fields: ['letter'] },
    { fields: ['order_position'] },
    { fields: ['is_special_character'] }
  ]
});

module.exports = Alphabet;