// models/projects/Project.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [5, 255]
    }
  },
  slug: {
    type: DataTypes.STRING(300),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [20, 5000]
    }
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Description courte pour les listes'
  },
  objectives: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Liste des objectifs du projet'
  },
  deliverables: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Livrables attendus'
  },
  status: {
    type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'planning'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium'
  },
  category: {
    type: DataTypes.ENUM('education', 'technology', 'culture', 'research', 'translation', 'community', 'other'),
    allowNull: false
  },
  difficulty_level: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced', 'expert'),
    allowNull: false,
    defaultValue: 'intermediate'
  },
  progress_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimated_completion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_completion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimated_hours: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Estimation en heures'
  },
  actual_hours: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Heures réellement passées'
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Budget alloué en FCFA'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'XOF'
  },
  lead_contributor_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Chef de projet'
  },
  max_contributors: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Nombre max de contributeurs (null = illimité)'
  },
  current_contributors: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_open_for_contribution: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  requires_approval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Les contributions nécessitent une approbation'
  },
  skills_required: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Compétences requises'
  },
  tools_used: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Outils et technologies utilisés'
  },
  license: {
    type: DataTypes.ENUM('mit', 'gpl', 'apache', 'cc_by', 'cc_by_sa', 'proprietary', 'other'),
    allowNull: true,
    comment: 'Licence du projet'
  },
  repository_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'URL du dépôt de code'
  },
  documentation_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  demo_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  communication_channels: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Slack, Discord, email, etc.'
  },
  meeting_schedule: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Planning des réunions'
  },
  milestones: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Jalons du projet'
  },
  risks: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Risques identifiés'
  },
  success_criteria: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Critères de succès'
  },
  impact_metrics: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Métriques d\'impact'
  },
  target_audience: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expected_outcomes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
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
  star_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  fork_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  last_activity_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'projects',
  indexes: [
    { fields: ['slug'] },
    { fields: ['lead_contributor_id'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['category'] },
    { fields: ['difficulty_level'] },
    { fields: ['is_open_for_contribution'] },
    { fields: ['is_featured'] },
    { fields: ['is_public'] },
    { fields: ['progress_percentage'] },
    { fields: ['start_date'] },
    { fields: ['end_date'] },
    { fields: ['estimated_completion'] },
    { fields: ['view_count'] },
    { fields: ['like_count'] },
    { fields: ['last_activity_at'] },
    {
      name: 'project_search_index',
      type: 'FULLTEXT',
      fields: ['title', 'description', 'short_description']
    }
  ],
  hooks: {
    beforeSave: (project) => {
      if (project.changed('title') && !project.slug) {
        project.slug = project.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 250);
      }
      
      // Mettre à jour le statut basé sur la progression
      if (project.changed('progress_percentage')) {
        if (project.progress_percentage === 100 && project.status !== 'completed') {
          project.status = 'completed';
          project.actual_completion = new Date();
        }
      }
      
      // Mettre à jour la dernière activité
      if (project.changed() && !project.changed('last_activity_at')) {
        project.last_activity_at = new Date();
      }
    }
  }
});

// Méthodes d'instance
Project.prototype.incrementView = async function() {
  this.view_count += 1;
  await this.save(['view_count']);
};

Project.prototype.incrementLike = async function() {
  this.like_count += 1;
  await this.save(['like_count']);
};

Project.prototype.incrementStar = async function() {
  this.star_count += 1;
  await this.save(['star_count']);
};

Project.prototype.updateProgress = async function(percentage) {
  this.progress_percentage = Math.min(100, Math.max(0, percentage));
  this.last_activity_at = new Date();
  
  if (this.progress_percentage === 100) {
    this.status = 'completed';
    this.actual_completion = new Date();
  }
  
  await this.save(['progress_percentage', 'last_activity_at', 'status', 'actual_completion']);
};

Project.prototype.addContributor = async function(userId, role = 'contributor') {
  const { ProjectContributor } = require('../index');
  
  const existingContributor = await ProjectContributor.findOne({
    where: { project_id: this.id, user_id: userId }
  });
  
  if (!existingContributor) {
    await ProjectContributor.create({
      project_id: this.id,
      user_id: userId,
      role: role
    });
    
    await this.increment('current_contributors');
  }
};

Project.prototype.removeContributor = async function(userId) {
  const { ProjectContributor } = require('../index');
  
  const deleted = await ProjectContributor.destroy({
    where: { project_id: this.id, user_id: userId }
  });
  
  if (deleted > 0) {
    await this.decrement('current_contributors');
  }
};

Project.prototype.canAcceptContributors = function() {
  return this.is_open_for_contribution && 
         this.status === 'active' &&
         (!this.max_contributors || this.current_contributors < this.max_contributors);
};

Project.prototype.getCompletionEstimate = function() {
  if (!this.start_date || this.progress_percentage === 0) return null;
  
  const now = new Date();
  const elapsed = now - this.start_date;
  const totalEstimated = elapsed / (this.progress_percentage / 100);
  
  return new Date(this.start_date.getTime() + totalEstimated);
};

Project.prototype.isOverdue = function() {
  return this.estimated_completion && 
         new Date() > this.estimated_completion && 
         this.status !== 'completed';
};

Project.prototype.archive = async function() {
  this.archived_at = new Date();
  this.is_public = false;
  this.is_open_for_contribution = false;
  await this.save(['archived_at', 'is_public', 'is_open_for_contribution']);
};

// Méthodes de classe
Project.getActive = function(limit = 10) {
  return this.findAll({
    where: {
      status: 'active',
      is_public: true,
      archived_at: null
    },
    order: [['last_activity_at', 'DESC']],
    limit,
    include: ['leadContributor']
  });
};

Project.getFeatured = function(limit = 6) {
  return this.findAll({
    where: {
      is_featured: true,
      is_public: true,
      archived_at: null
    },
    order: [['star_count', 'DESC'], ['like_count', 'DESC']],
    limit,
    include: ['leadContributor']
  });
};

Project.getOpenForContribution = function(limit = 10) {
  return this.findAll({
    where: {
      is_open_for_contribution: true,
      status: 'active',
      is_public: true,
      archived_at: null
    },
    order: [['created_at', 'DESC']],
    limit,
    include: ['leadContributor']
  });
};

Project.searchProjects = function(query, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } }
      ],
      is_public: true,
      archived_at: null,
      ...options.where
    },
    order: [['last_activity_at', 'DESC']],
    limit: options.limit || 20,
    offset: options.offset || 0,
    include: ['leadContributor']
  });
};

module.exports = Project;
