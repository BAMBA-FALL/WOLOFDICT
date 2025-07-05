  
  // models/Example.js - Exemples d'utilisation
  module.exports = (sequelize, DataTypes) => {
    const Example = sequelize.define('Example', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      textWolof: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Phrase exemple en wolof'
      },
      textFrench: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Traduction de l\'exemple en français'
      },
      context: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Contexte de l\'exemple'
      },
      source: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Source de l\'exemple (littérature, proverbe, etc.)'
      },
      validationStatus: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      audioUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL vers l\'enregistrement audio de l\'exemple'
      },
      difficulty: {
        type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé'),
        allowNull: true
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
          key: 'id'
        }
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      validatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true,
      paranoid: true
    });
  
    Example.associate = (models) => {
      Example.belongsTo(models.Word, { foreignKey: 'wordId' });
      Example.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
      Example.belongsTo(models.User, { as: 'validator', foreignKey: 'validatedBy' });
    };
  
    return Example;
  };
  