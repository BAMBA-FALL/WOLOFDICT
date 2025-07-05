// models/projects/Suggestion.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Suggestion = sequelize.define('Suggestion', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'correction', 'feature', 'improvement', 'bug_report', 'other'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [5, 255]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 5000]
    }
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Explication détaillée de la suggestion'
  },
  suggested_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Données structurées de la suggestion'
  },
  references: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Références et sources'
  },
  related_content_type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'project', 'event'),
    allowNull: true,
    comment: 'Type de contenu lié'
  },
  related_content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: 'ID du contenu lié'
  },
  submitter_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'implemented', 'duplicate'),
    allowNull: false,
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Catégorie de la suggestion'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  impact_level: {
    type: DataTypes.ENUM('minor', 'moderate', 'major', 'critical'),
    allowNull: false,
    defaultValue: 'moderate'
  },
  effort_estimate: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'very_high'),
    allowNull: true,
    comment: 'Estimation de l\'effort requis'
  },
  votes_up: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  votes_down: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Score calculé (votes_up - votes_down)'
  },
  view_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  comment_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  reviewed_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  reviewed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewer_feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  implementation_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes d\'implémentation'
  },
  implemented_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  implemented_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  duplicate_of: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'suggestions',
      key: 'id'
    },
    comment: 'ID de la suggestion originale si doublon'
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Fichiers joints'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'suggestions',
  indexes: [
    { fields: ['submitter_id'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['impact_level'] },
    { fields: ['score'] },
    { fields: ['votes_up'] },
    { fields: ['reviewed_by'] },
    { fields: ['reviewed_at'] },
    { fields: ['implemented_by'] },
    { fields: ['duplicate_of'] },
    { fields: ['related_content_type', 'related_content_id'] },
    {
      name: 'suggestion_search_index',
      type: 'FULLTEXT',
      fields: ['title', 'content', 'explanation']
    }
  ],
  hooks: {
    beforeSave: (suggestion) => {
      // Calculer le score
      suggestion.score = suggestion.votes_up - suggestion.votes_down;
    }
  }
});

// Méthodes d'instance
Suggestion.prototype.incrementView = async function() {
  this.view_count += 1;
  await this.save(['view_count']);
};

Suggestion.prototype.vote = async function(userId, voteType) {
  const { SuggestionVote } = require('../index'); // Modèle à créer si nécessaire
  
  // Logique de vote (à implémenter avec un modèle SuggestionVote)
  if (voteType === 'up') {
    this.votes_up += 1;
  } else if (voteType === 'down') {
    this.votes_down += 1;
  }
  
  this.score = this.votes_up - this.votes_down;
  await this.save(['votes_up', 'votes_down', 'score']);
};

Suggestion.prototype.approve = async function(reviewerId, feedback = null) {
  this.status = 'approved';
  this.reviewed_by = reviewerId;
  this.reviewed_at = new Date();
  this.reviewer_feedback = feedback;
  await this.save(['status', 'reviewed_by', 'reviewed_at', 'reviewer_feedback']);
};

Suggestion.prototype.reject = async function(reviewerId, feedback) {
  this.status = 'rejected';
  this.reviewed_by = reviewerId;
  this.reviewed_at = new Date();
  this.reviewer_feedback = feedback;
  await this.save(['status', 'reviewed_by', 'reviewed_at', 'reviewer_feedback']);
};

Suggestion.prototype.implement = async function(implementerId, notes = null) {
  this.status = 'implemented';
  this.implemented_by = implementerId;
  this.implemented_at = new Date();
  this.implementation_notes = notes;
  await this.save(['status', 'implemented_by', 'implemented_at', 'implementation_notes']);
};

Suggestion.prototype.markAsDuplicate = async function(originalId, reviewerId) {
  this.status = 'duplicate';
  this.duplicate_of = originalId;
  this.reviewed_by = reviewerId;
  this.reviewed_at = new Date();
  await this.save(['status', 'duplicate_of', 'reviewed_by', 'reviewed_at']);
};

// Méthodes de classe
Suggestion.getPending = function(limit = 20) {
  return this.findAll({
    where: { status: 'pending' },
    order: [['score', 'DESC'], ['created_at', 'ASC']],
    limit,
    include: ['submitter']
  });
};

Suggestion.getPopular = function(limit = 10) {
  return this.findAll({
    where: { status: ['pending', 'under_review', 'approved'] },
    order: [['score', 'DESC']],
    limit,
    include: ['submitter']
  });
};

Suggestion.getByType = function(type, options = {}) {
  return this.findAll({
    where: { type, ...options.where },
    order: [['score', 'DESC'], ['created_at', 'DESC']],
    limit: options.limit || 20,
    include: ['submitter']
  });
};

Suggestion.searchSuggestions = function(query, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { content: { [Op.like]: `%${query}%` } }
      ],
      ...options.where
    },
    order: [['score', 'DESC']],
    limit: options.limit || 20,
    include: ['submitter']
  });
};

module.exports = Suggestion;