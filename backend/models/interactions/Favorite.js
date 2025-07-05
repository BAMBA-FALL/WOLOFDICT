// models/interactions/Favorite.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  content_type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'event', 'project'),
    allowNull: false,
    comment: 'Type de contenu mis en favori'
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: 'ID du contenu favorisé'
  },
  collection_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nom de la collection personnelle (optionnel)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes personnelles de l\'utilisateur'
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Si le favori est visible publiquement'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Priorité pour l\'ordre d\'affichage'
  }
}, {
  tableName: 'favorites',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['content_type', 'content_id'] },
    { fields: ['content_type'] },
    { fields: ['collection_name'] },
    { fields: ['is_public'] },
    { fields: ['priority'] },
    { 
      fields: ['user_id', 'content_type', 'content_id'], 
      unique: true,
      name: 'unique_user_favorite'
    }
  ],
  hooks: {
    afterCreate: async (favorite) => {
      // Incrémenter le compteur de favoris du contenu
      await favorite.incrementContentFavoriteCount();
    },
    afterDestroy: async (favorite) => {
      // Décrémenter le compteur de favoris du contenu
      await favorite.decrementContentFavoriteCount();
    }
  }
});

// Méthodes d'instance
Favorite.prototype.incrementContentFavoriteCount = async function() {
  const { Word, Phrase, Proverb } = require('../index');
  
  let model;
  switch (this.content_type) {
    case 'word':
      model = Word;
      break;
    case 'phrase':
      model = Phrase;
      break;
    case 'proverb':
      model = Proverb;
      break;
    default:
      return;
  }
  
  const content = await model.findByPk(this.content_id);
  if (content && typeof content.incrementFavorite === 'function') {
    await content.incrementFavorite();
  }
};

Favorite.prototype.decrementContentFavoriteCount = async function() {
  const { Word, Phrase, Proverb } = require('../index');
  
  let model;
  switch (this.content_type) {
    case 'word':
      model = Word;
      break;
    case 'phrase':
      model = Phrase;
      break;
    case 'proverb':
      model = Proverb;
      break;
    default:
      return;
  }
  
  const content = await model.findByPk(this.content_id);
  if (content && content.favorite_count > 0) {
    await content.decrement('favorite_count');
    await content.decrement('popularity_score', { by: 10 });
  }
};

// Méthodes de classe
Favorite.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: { user_id: userId, ...options.where },
    order: [['priority', 'DESC'], ['created_at', 'DESC']],
    limit: options.limit,
    offset: options.offset
  });
};

Favorite.findByUserAndType = function(userId, contentType) {
  return this.findAll({
    where: { user_id: userId, content_type: contentType },
    order: [['priority', 'DESC'], ['created_at', 'DESC']]
  });
};

Favorite.getCollections = function(userId) {
  return this.findAll({
    where: { 
      user_id: userId,
      collection_name: { [require('sequelize').Op.ne]: null }
    },
    attributes: ['collection_name', [sequelize.fn('COUNT', '*'), 'count']],
    group: ['collection_name'],
    order: [['collection_name', 'ASC']]
  });
};

module.exports = Favorite;