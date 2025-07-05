// models/interactions/Rating.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Rating = sequelize.define('Rating', {
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
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'audio_recording', 'event'),
    allowNull: false,
    comment: 'Type de contenu évalué'
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: 'ID du contenu évalué'
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Note de 1 à 5 étoiles'
  },
  review: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Commentaire détaillé (optionnel)'
  },
  criteria: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Notes par critères spécifiques'
  },
  is_verified_purchase: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Pour les futurs contenus payants'
  },
  helpfulness_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Score d\'utilité voté par d\'autres utilisateurs'
  }
}, {
  tableName: 'ratings',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['content_type', 'content_id'] },
    { fields: ['content_type'] },
    { fields: ['rating'] },
    { fields: ['helpfulness_score'] },
    { 
      fields: ['user_id', 'content_type', 'content_id'], 
      unique: true,
      name: 'unique_user_rating'
    }
  ]
});

// Méthodes de classe
Rating.getAverageRating = async function(contentType, contentId) {
  const result = await this.findOne({
    where: { content_type: contentType, content_id: contentId },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
      [sequelize.fn('COUNT', '*'), 'count']
    ],
    raw: true
  });
  
  return {
    average: result.average ? parseFloat(result.average).toFixed(1) : 0,
    count: parseInt(result.count) || 0
  };
};

Rating.getRatingDistribution = function(contentType, contentId) {
  return this.findAll({
    where: { content_type: contentType, content_id: contentId },
    attributes: [
      'rating',
      [sequelize.fn('COUNT', '*'), 'count']
    ],
    group: ['rating'],
    order: [['rating', 'DESC']],
    raw: true
  });
};

module.exports = Rating;
