// models/content/Word.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Word = sequelize.define('Word', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  wolof: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255],
      notEmpty: true
    }
  },
  francais: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255],
      notEmpty: true
    }
  },
  pronunciation: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Notation phonétique IPA'
  },
  part_of_speech: {
    type: DataTypes.ENUM('nom', 'verbe', 'adjectif', 'adverbe', 'préposition', 'conjonction', 'interjection', 'pronom', 'déterminant'),
    allowNull: false
  },
  difficulty_level: {
    type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé'),
    allowNull: false,
    defaultValue: 'débutant'
  },
  definition: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 2000]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée et contexte culturel'
  },
  etymology: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Origine et évolution du mot'
  },
  usage_frequency: {
    type: DataTypes.ENUM('très_courant', 'courant', 'peu_courant', 'rare'),
    allowNull: false,
    defaultValue: 'courant'
  },
  popularity_score: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Score basé sur les vues, likes, etc.'
  },
  view_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  like_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  favorite_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Vérifié par un expert linguistique'
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
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Région géographique d\'usage principal'
  },
  dialect: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Variante dialectale'
  },
  cultural_note: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Note sur l\'usage culturel'
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verified_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'words',
  indexes: [
    { fields: ['wolof'] },
    { fields: ['francais'] },
    { fields: ['part_of_speech'] },
    { fields: ['difficulty_level'] },
    { fields: ['usage_frequency'] },
    { fields: ['is_verified'] },
    { fields: ['is_featured'] },
    { fields: ['is_public'] },
    { fields: ['popularity_score'] },
    { fields: ['view_count'] },
    { fields: ['created_by'] },
    { 
      fields: ['wolof', 'francais'], 
      unique: true,
      name: 'unique_translation'
    },
    {
      name: 'search_index',
      type: 'FULLTEXT',
      fields: ['wolof', 'francais', 'definition']
    }
  ]
});

// Méthodes d'instance
Word.prototype.incrementView = async function() {
  this.view_count += 1;
  this.popularity_score += 1;
  await this.save(['view_count', 'popularity_score']);
};

Word.prototype.incrementLike = async function() {
  this.like_count += 1;
  this.popularity_score += 5;
  await this.save(['like_count', 'popularity_score']);
};

Word.prototype.incrementFavorite = async function() {
  this.favorite_count += 1;
  this.popularity_score += 10;
  await this.save(['favorite_count', 'popularity_score']);
};

// Méthodes de classe
Word.searchByText = function(query, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { wolof: { [Op.like]: `%${query}%` } },
        { francais: { [Op.like]: `%${query}%` } },
        { definition: { [Op.like]: `%${query}%` } }
      ],
      is_public: true,
      ...options.where
    },
    order: [['popularity_score', 'DESC']],
    limit: options.limit || 20,
    offset: options.offset || 0
  });
};

Word.getFeatured = function(limit = 6) {
  return this.findAll({
    where: { is_featured: true, is_public: true },
    order: [['popularity_score', 'DESC']],
    limit,
    include: ['creator', 'categories', 'examples']
  });
};

Word.getTrending = function(limit = 10) {
  return this.findAll({
    where: { is_public: true },
    order: [
      ['view_count', 'DESC'],
      ['like_count', 'DESC']
    ],
    limit
  });
};

module.exports = Word;