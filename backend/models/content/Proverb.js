// models/content/Proverb.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Proverb = sequelize.define('Proverb', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  wolof_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  francais_translation: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  literal_translation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Traduction littérale mot à mot'
  },
  meaning: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Signification et enseignement du proverbe'
  },
  cultural_context: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Contexte culturel et historique'
  },
  origin: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Origine géographique ou historique'
  },
  usage_context: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Quand et comment utiliser ce proverbe'
  },
  related_proverbs: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  difficulty_level: {
    type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé'),
    allowNull: false,
    defaultValue: 'intermédiaire'
  },
  popularity_score: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_featured: {
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
  tableName: 'proverbs',
  indexes: [
    { fields: ['difficulty_level'] },
    { fields: ['is_verified'] },
    { fields: ['is_featured'] },
    { fields: ['popularity_score'] },
    { fields: ['created_by'] },
    {
      name: 'proverb_search_index',
      type: 'FULLTEXT',
      fields: ['wolof_text', 'francais_translation', 'meaning']
    }
  ]
});

module.exports = Proverb;