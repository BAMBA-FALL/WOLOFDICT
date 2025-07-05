  // models/Statistics.js - Statistiques d'utilisation 
  module.exports = (sequelize, DataTypes) => {
    const Statistics = sequelize.define('Statistics', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      period: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Période (jour, mois, année)'
      },
      periodValue: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Valeur de la période (ex: 2025-04)'
      },
      metricType: {
        type: DataTypes.ENUM(
          'words_added', 'words_validated', 'user_registrations', 
          'searches', 'visits', 'contributions'
        ),
        allowNull: false
      },
      metricValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['period', 'periodValue', 'metricType']
        }
      ]
    });
  
    return Statistics;
  };