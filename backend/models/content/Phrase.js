// models/content/Phrase.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Phrase = sequelize.define('Phrase', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  wolof: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [5, 1000]
    }
  },
  francais: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [5, 1000]
    }
  },
  transliteration: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Translittération pour aider à la prononciation'
  },
  category: {
    type: DataTypes.ENUM('salutations', 'quotidien', 'voyage', 'proverbes', 'business', 'urgences', 'famille', 'nourriture', 'éducation'),
    allowNull: false
  },
  difficulty_level: {
    type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé'),
    allowNull: false,
    defaultValue: 'débutant'
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Explication détaillée de la phrase'
  },
  context_usage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Contexte d\'utilisation approprié'
  },
  cultural_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Note culturelle importante'
  },
  formality_level: {
    type: DataTypes.ENUM('très_formel', 'formel', 'neutre', 'informel', 'très_informel'),
    allowNull: false,
    defaultValue: 'neutre'
  },
  likes_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  usage_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  view_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  favorite_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
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
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  audio_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
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
  tableName: 'phrases',
  indexes: [
    { fields: ['category'] },
    { fields: ['difficulty_level'] },
    { fields: ['formality_level'] },
    { fields: ['is_verified'] },
    { fields: ['is_featured'] },
    { fields: ['is_public'] },
    { fields: ['popularity_score'] },
    { fields: ['created_by'] },
    {
      name: 'phrase_search_index',
      type: 'FULLTEXT',
      fields: ['wolof', 'francais', 'explanation']
    }
  ]
});

// Méthodes similaires à Word
Phrase.prototype.incrementView = async function() {
  this.view_count += 1;
  this.popularity_score += 1;
  await this.save(['view_count', 'popularity_score']);
};

Phrase.prototype.incrementLike = async function() {
  this.likes_count += 1;
  this.popularity_score += 5;
  await this.save(['likes_count', 'popularity_score']);
};

Phrase.searchByCategory = function(category, options = {}) {
  return this.findAll({
    where: { 
      category, 
      is_public: true,
      ...options.where 
    },
    order: [['popularity_score', 'DESC']],
    limit: options.limit || 20
  });
};

module.exports = Phrase;
