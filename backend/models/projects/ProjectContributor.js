// models/projects/ProjectContributor.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ProjectContributor = sequelize.define('ProjectContributor', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  project_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'projects',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  role: {
    type: DataTypes.ENUM('lead', 'maintainer', 'contributor', 'reviewer', 'tester', 'translator', 'designer'),
    allowNull: false,
    defaultValue: 'contributor'
  },
  contribution_type: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Types de contributions (code, documentation, design, etc.)'
  },
  permissions: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      can_edit: false,
      can_delete: false,
      can_manage_contributors: false,
      can_approve_changes: false
    }
  },
  joined_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  last_contribution_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  hours_contributed: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Heures de contribution'
  },
  contributions_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended', 'left'),
    allowNull: false,
    defaultValue: 'active'
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Bio spécifique au projet'
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Compétences apportées au projet'
  },
  availability: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Disponibilité (heures par semaine, créneaux, etc.)'
  },
  contact_preferences: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      email: true,
      slack: false,
      discord: false
    }
  },
  achievements: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Réalisations dans le projet'
  },
  feedback_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    },
    comment: 'Score de feedback des autres contributeurs'
  },
  feedback_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_mentor: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Peut mentorer d\'autres contributeurs'
  },
  mentees: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'IDs des utilisateurs mentorés'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes du chef de projet sur le contributeur'
  },
  left_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  left_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'project_contributors',
  indexes: [
    { fields: ['project_id'] },
    { fields: ['user_id'] },
    { fields: ['role'] },
    { fields: ['status'] },
    { fields: ['joined_date'] },
    { fields: ['last_contribution_at'] },
    { fields: ['hours_contributed'] },
    { fields: ['contributions_count'] },
    { fields: ['feedback_score'] },
    { fields: ['is_mentor'] },
    { 
      fields: ['project_id', 'user_id'], 
      unique: true,
      name: 'unique_project_contributor'
    }
  ]
});

// Méthodes d'instance
ProjectContributor.prototype.logContribution = async function(hours = 0) {
  this.contributions_count += 1;
  this.hours_contributed += hours;
  this.last_contribution_at = new Date();
  await this.save(['contributions_count', 'hours_contributed', 'last_contribution_at']);
};

ProjectContributor.prototype.updatePermissions = async function(permissions) {
  this.permissions = { ...this.permissions, ...permissions };
  await this.save(['permissions']);
};

ProjectContributor.prototype.leave = async function(reason = null) {
  this.status = 'left';
  this.left_at = new Date();
  this.left_reason = reason;
  await this.save(['status', 'left_at', 'left_reason']);
};

ProjectContributor.prototype.addFeedback = async function(score) {
  const totalScore = (this.feedback_score || 0) * this.feedback_count + score;
  this.feedback_count += 1;
  this.feedback_score = totalScore / this.feedback_count;
  await this.save(['feedback_score', 'feedback_count']);
};

// Méthodes de classe
ProjectContributor.getTopContributors = function(projectId, limit = 10) {
  return this.findAll({
    where: { 
      project_id: projectId,
      status: 'active'
    },
    order: [
      ['contributions_count', 'DESC'],
      ['hours_contributed', 'DESC']
    ],
    limit,
    include: ['user']
  });
};

ProjectContributor.getActiveContributors = function(projectId) {
  const { Op } = require('sequelize');
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return this.findAll({
    where: { 
      project_id: projectId,
      status: 'active',
      last_contribution_at: {
        [Op.gte]: oneMonthAgo
      }
    },
    include: ['user']
  });
};

module.exports = ProjectContributor;
