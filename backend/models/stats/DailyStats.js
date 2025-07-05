// models/stats/DailyStats.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const DailyStats = sequelize.define('DailyStats', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true
  },
  // Statistiques utilisateurs
  new_users: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  active_users: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Utilisateurs ayant une activité ce jour'
  },
  returning_users: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  total_users: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  // Statistiques de contenu
  words_added: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  phrases_added: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  proverbs_added: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  comments_added: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  forum_posts_added: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  // Statistiques d'engagement
  searches_performed: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  successful_searches: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  page_views: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  unique_page_views: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  audio_plays: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  downloads: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  shares: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  // Statistiques de qualité
  likes_given: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  favorites_added: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  contributions_made: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  contributions_approved: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  // Statistiques événements et projets
  events_created: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  event_registrations: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  projects_created: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  project_contributions: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  // Métriques de performance
  avg_session_duration: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Durée moyenne de session en minutes'
  },
  bounce_rate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: 'Taux de rebond global'
  },
  conversion_rate: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: 'Taux de conversion visiteur -> utilisateur'
  },
  // Données géographiques et techniques
  top_countries: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Top 10 des pays par trafic'
  },
  device_breakdown: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Répartition desktop/mobile/tablet'
  },
  browser_breakdown: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Répartition par navigateur'
  },
  traffic_sources: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Sources de trafic'
  },
  // Métriques de qualité du service
  error_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  avg_response_time: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Temps de réponse moyen en ms'
  },
  uptime_percentage: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    comment: 'Pourcentage d\'uptime'
  }
}, {
  tableName: 'daily_stats',
  timestamps: false,
  indexes: [
    { fields: ['date'] },
    { fields: ['new_users'] },
    { fields: ['active_users'] },
    { fields: ['page_views'] },
    { fields: ['searches_performed'] }
  ]
});

// Méthodes de classe
DailyStats.getRecentStats = function(days = 30) {
  const { Op } = require('sequelize');
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.findAll({
    where: {
      date: {
        [Op.gte]: startDate.toISOString().split('T')[0]
      }
    },
    order: [['date', 'ASC']],
    raw: true
  });
};

DailyStats.getGrowthMetrics = function(days = 30) {
  const { Op } = require('sequelize');
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.findAll({
    where: {
      date: {
        [Op.gte]: startDate.toISOString().split('T')[0]
      }
    },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('new_users')), 'total_new_users'],
      [sequelize.fn('AVG', sequelize.col('active_users')), 'avg_daily_active_users'],
      [sequelize.fn('SUM', sequelize.col('words_added')), 'total_words_added'],
      [sequelize.fn('SUM', sequelize.col('phrases_added')), 'total_phrases_added'],
      [sequelize.fn('SUM', sequelize.col('searches_performed')), 'total_searches'],
      [sequelize.fn('AVG', sequelize.col('bounce_rate')), 'avg_bounce_rate']
    ],
    raw: true
  });
};

DailyStats.updateTodayStats = async function(statsData = {}) {
  const today = new Date().toISOString().split('T')[0];
  
  const [stats, created] = await this.findOrCreate({
    where: { date: today },
    defaults: {
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

DailyStats.generateReport = async function(startDate, endDate) {
  const { Op } = require('sequelize');
  
  const stats = await this.findAll({
    where: {
      date: {
        [Op.between]: [startDate, endDate]
      }
    },
    order: [['date', 'ASC']],
    raw: true
  });
  
  if (stats.length === 0) return null;
  
  // Calculer les métriques agrégées
  const report = {
    period: { start: startDate, end: endDate },
    summary: {
      total_new_users: stats.reduce((sum, day) => sum + day.new_users, 0),
      avg_daily_active_users: Math.round(stats.reduce((sum, day) => sum + day.active_users, 0) / stats.length),
      total_content_added: {
        words: stats.reduce((sum, day) => sum + day.words_added, 0),
        phrases: stats.reduce((sum, day) => sum + day.phrases_added, 0),
        proverbs: stats.reduce((sum, day) => sum + day.proverbs_added, 0)
      },
      total_engagement: {
        searches: stats.reduce((sum, day) => sum + day.searches_performed, 0),
        page_views: stats.reduce((sum, day) => sum + day.page_views, 0),
        audio_plays: stats.reduce((sum, day) => sum + day.audio_plays, 0)
      },
      quality_metrics: {
        avg_bounce_rate: (stats.reduce((sum, day) => sum + (day.bounce_rate || 0), 0) / stats.length).toFixed(4),
        avg_conversion_rate: (stats.reduce((sum, day) => sum + (day.conversion_rate || 0), 0) / stats.length).toFixed(4)
      }
    },
    daily_data: stats
  };
  
  return report;
};

module.exports = DailyStats;