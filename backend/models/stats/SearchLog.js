// models/stats/SearchLog.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SearchLog = sequelize.define('SearchLog', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'NULL pour les utilisateurs anonymes'
  },
  session_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ID de session pour les utilisateurs anonymes'
  },
  query: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Terme de recherche'
  },
  normalized_query: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Requête normalisée (minuscule, sans accents)'
  },
  search_type: {
    type: DataTypes.ENUM('word', 'phrase', 'proverb', 'global', 'alphabet', 'user', 'event', 'project'),
    allowNull: false,
    defaultValue: 'global'
  },
  language: {
    type: DataTypes.ENUM('wolof', 'français', 'both'),
    allowNull: false,
    defaultValue: 'both'
  },
  filters_used: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Filtres appliqués lors de la recherche'
  },
  results_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  results_clicked: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'IDs des résultats cliqués'
  },
  search_duration_ms: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Durée de la recherche en millisecondes'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referer: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Page d\'origine'
  },
  device_type: {
    type: DataTypes.ENUM('desktop', 'tablet', 'mobile', 'unknown'),
    allowNull: false,
    defaultValue: 'unknown'
  },
  browser: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  operating_system: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  location_country: {
    type: DataTypes.STRING(2),
    allowNull: true,
    comment: 'Code pays ISO'
  },
  location_city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  was_successful: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si la recherche a retourné des résultats'
  },
  exit_page: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Page où l\'utilisateur a quitté après la recherche'
  },
  time_spent_on_results: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Temps passé sur les résultats en secondes'
  }
}, {
  tableName: 'search_logs',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['session_id'] },
    { fields: ['search_type'] },
    { fields: ['language'] },
    { fields: ['results_count'] },
    { fields: ['was_successful'] },
    { fields: ['device_type'] },
    { fields: ['location_country'] },
    { fields: ['created_at'] },
    {
      name: 'search_query_index',
      type: 'FULLTEXT',
      fields: ['query', 'normalized_query']
    },
    {
      name: 'search_analytics_index',
      fields: ['created_at', 'search_type', 'was_successful']
    }
  ],
  hooks: {
    beforeCreate: (searchLog) => {
      // Normaliser la requête
      if (searchLog.query && !searchLog.normalized_query) {
        searchLog.normalized_query = searchLog.query
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
          .trim();
      }
    }
  }
});

// Méthodes de classe
SearchLog.getPopularQueries = function(period = 'month', limit = 20) {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'day':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      };
      break;
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
      was_successful: true,
      ...dateFilter
    },
    attributes: [
      'normalized_query',
      [sequelize.fn('COUNT', '*'), 'search_count'],
      [sequelize.fn('AVG', sequelize.col('results_count')), 'avg_results']
    ],
    group: ['normalized_query'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']],
    limit,
    raw: true
  });
};

SearchLog.getSearchTrends = function(days = 30) {
  const { Op } = require('sequelize');
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.findAll({
    where: {
      created_at: { [Op.gte]: startDate }
    },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      [sequelize.fn('COUNT', '*'), 'search_count'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN was_successful = true THEN 1 END')), 'successful_searches']
    ],
    group: [sequelize.fn('DATE', sequelize.col('created_at'))],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    raw: true
  });
};

SearchLog.getFailedSearches = function(limit = 50) {
  return this.findAll({
    where: { was_successful: false },
    attributes: [
      'normalized_query',
      [sequelize.fn('COUNT', '*'), 'fail_count']
    ],
    group: ['normalized_query'],
    order: [[sequelize.fn('COUNT', '*'), 'DESC']],
    limit,
    raw: true
  });
};

module.exports = SearchLog;