// models/interactions/UserContribution.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const UserContribution = sequelize.define('UserContribution', {
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
  contribution_type: {
    type: DataTypes.ENUM(
      'word_creation', 'word_edit', 'word_example', 'word_synonym',
      'phrase_creation', 'phrase_edit', 'phrase_variation',
      'proverb_creation', 'proverb_edit',
      'audio_upload', 'image_upload',
      'translation', 'correction', 'verification',
      'forum_post', 'comment', 'moderation'
    ),
    allowNull: false,
    comment: 'Type de contribution'
  },
  content_type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'audio', 'image', 'forum_post', 'comment'),
    allowNull: true,
    comment: 'Type de contenu affecté'
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: 'ID du contenu affecté'
  },
  points_earned: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Points gagnés pour cette contribution'
  },
  quality_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Score de qualité de la contribution'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'needs_review'),
    allowNull: false,
    defaultValue: 'pending'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description de la contribution'
  },
  changes_made: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Détails des modifications apportées'
  },
  reviewer_feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Commentaires du réviseur'
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
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Contribution mise en vedette'
  }
}, {
  tableName: 'user_contributions',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['contribution_type'] },
    { fields: ['content_type', 'content_id'] },
    { fields: ['status'] },
    { fields: ['points_earned'] },
    { fields: ['quality_score'] },
    { fields: ['reviewed_by'] },
    { fields: ['is_featured'] },
    { fields: ['created_at'] }
  ]
});

// Méthodes d'instance
UserContribution.prototype.approve = async function(reviewerId, feedback = null) {
  this.status = 'approved';
  this.reviewed_by = reviewerId;
  this.reviewed_at = new Date();
  this.reviewer_feedback = feedback;
  
  await this.save();
  
  // Attribuer les points à l'utilisateur
  const user = await this.getUser();
  if (user) {
    await user.increment('points', { by: this.points_earned });
    await user.incrementContribution();
  }
};

UserContribution.prototype.reject = async function(reviewerId, feedback) {
  this.status = 'rejected';
  this.reviewed_by = reviewerId;
  this.reviewed_at = new Date();
  this.reviewer_feedback = feedback;
  
  await this.save();
};

// Méthodes de classe
UserContribution.getLeaderboard = function(period = 'month', limit = 10) {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'week':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case 'month':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
    case 'year':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getFullYear(), 0, 1)
        }
      };
      break;
  }
  
  return this.findAll({
    where: { 
      status: 'approved',
      ...dateFilter
    },
    attributes: [
      'user_id',
      [sequelize.fn('SUM', sequelize.col('points_earned')), 'total_points'],
      [sequelize.fn('COUNT', '*'), 'contribution_count']
    ],
    group: ['user_id'],
    order: [[sequelize.fn('SUM', sequelize.col('points_earned')), 'DESC']],
    limit,
    include: [
      {
        model: require('../user/User'),
        as: 'user',
        attributes: ['id', 'username', 'first_name', 'last_name', 'profile_picture']
      }
    ]
  });
};

UserContribution.getContributionStats = function(userId, period = 'month') {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'week':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case 'month':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
  }
  
  return this.findAll({
    where: { 
      user_id: userId,
      status: 'approved',
      ...dateFilter
    },
    attributes: [
      'contribution_type',
      [sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.fn('SUM', sequelize.col('points_earned')), 'total_points']
    ],
    group: ['contribution_type'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']]
  });
};

module.exports = UserContribution;