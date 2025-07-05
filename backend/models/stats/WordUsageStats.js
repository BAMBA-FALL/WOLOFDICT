// models/stats/WordUsageStats.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const WordUsageStats = sequelize.define('WordUsageStats', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  word_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'words',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date pour les statistiques journalières'
  },
  view_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  search_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de fois trouvé dans les recherches'
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
  share_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  pronunciation_plays: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de lectures audio'
  },
  unique_visitors: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Visiteurs uniques par jour'
  },
  avg_time_spent: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Temps moyen passé sur le mot en secondes'
  },
  bounce_rate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: 'Taux de rebond (0-1)'
  },
  conversion_rate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: 'Taux de conversion vue -> action (0-1)'
  },
  referrer_data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Sources de trafic'
  },
  device_breakdown: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Répartition par type d\'appareil'
  },
  geographic_data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Données géographiques des visiteurs'
  }
}, {
  tableName: 'word_usage_stats',
  timestamps: false, // Pas besoin de created_at/updated_at pour les stats
  indexes: [
    { fields: ['word_id'] },
    { fields: ['date'] },
    { fields: ['view_count'] },
    { fields: ['search_count'] },
    { fields: ['unique_visitors'] },
    { 
      fields: ['word_id', 'date'], 
      unique: true,
      name: 'unique_word_date_stats'
    }
  ]
});

// Méthodes de classe
WordUsageStats.getPopularWords = function(period = 'week', limit = 20) {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'day':
      dateFilter = {
        date: new Date().toISOString().split('T')[0]
      };
      break;
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = {
        date: {
          [Op.gte]: weekAgo.toISOString().split('T')[0]
        }
      };
      break;
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = {
        date: {
          [Op.gte]: monthAgo.toISOString().split('T')[0]
        }
      };
      break;
  }
  
  return this.findAll({
    where: dateFilter,
    attributes: [
      'word_id',
      [sequelize.fn('SUM', sequelize.col('view_count')), 'total_views'],
      [sequelize.fn('SUM', sequelize.col('unique_visitors')), 'total_visitors'],
      [sequelize.fn('AVG', sequelize.col('avg_time_spent')), 'avg_engagement']
    ],
    group: ['word_id'],
    order: [[sequelize.fn('SUM', sequelize.col('view_count')), 'DESC']],
    limit,
    include: [{
      model: require('../content/Word'),
      as: 'word',
      attributes: ['id', 'wolof', 'francais']
    }]
  });
};

WordUsageStats.getWordTrends = function(wordId, days = 30) {
  const { Op } = require('sequelize');
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.findAll({
    where: {
      word_id: wordId,
      date: {
        [Op.gte]: startDate.toISOString().split('T')[0]
      }
    },
    order: [['date', 'ASC']],
    raw: true
  });
};

WordUsageStats.updateStats = async function(wordId, statsData = {}) {
  const today = new Date().toISOString().split('T')[0];
  
  const [stats, created] = await this.findOrCreate({
    where: { word_id: wordId, date: today },
    defaults: {
      word_id: wordId,
      date: today,
      ...statsData
    }
  });
  
  if (!created) {
    // Mettre à jour les stats existantes
    await stats.increment(statsData);
  }
  
  return stats;
};

module.exports = WordUsageStats;