  // models/Project.js - Projets communautaires
  module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('Project', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('en planification', 'en cours', 'complété', 'abandonné'),
        defaultValue: 'en planification'
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        }
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Catégorie de projet (éducation, technologie, culture, etc.)'
      },
      estimatedCompletion: {
        type: DataTypes.DATE,
        allowNull: true
      },
      isOpenForContribution: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      leadContributorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    Project.associate = (models) => {
      Project.belongsTo(models.User, { as: 'leadContributor', foreignKey: 'leadContributorId' });
      Project.belongsToMany(models.User, { through: 'ProjectContributors', as: 'contributors' });
    };
  
    return Project;
  };
  