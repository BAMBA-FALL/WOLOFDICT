  // models/Contribution.js - Suivi des contributions
  module.exports = (sequelize, DataTypes) => {
    const Contribution = sequelize.define('Contribution', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      action: {
        type: DataTypes.ENUM('create', 'update', 'delete', 'validate', 'reject'),
        allowNull: false
      },
      entityType: {
        type: DataTypes.ENUM('word', 'translation', 'example', 'conjugation'),
        allowNull: false,
        comment: 'Type d\'entité modifiée'
      },
      previousValue: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Valeur avant modification (JSON)'
      },
      newValue: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Nouvelle valeur (JSON)'
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Words',
          key: 'id'
        }
      },
      translationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Translations',
          key: 'id'
        }
      },
      exampleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Examples',
          key: 'id'
        }
      },
      conjugationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Conjugations',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    Contribution.associate = (models) => {
      Contribution.belongsTo(models.User, { foreignKey: 'userId' });
      Contribution.belongsTo(models.Word, { foreignKey: 'wordId' });
      Contribution.belongsTo(models.Translation, { foreignKey: 'translationId' });
      Contribution.belongsTo(models.Example, { foreignKey: 'exampleId' });
      Contribution.belongsTo(models.Conjugation, { foreignKey: 'conjugationId' });
    };
  
    return Contribution;
  };