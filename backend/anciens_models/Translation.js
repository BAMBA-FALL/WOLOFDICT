  // models/Translation.js - Traductions de mots
  module.exports = (sequelize, DataTypes) => {
    const Translation = sequelize.define('Translation', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Traduction en français'
      },
      context: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Contexte d\'utilisation'
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si c\'est la traduction principale'
      },
      register: {
        type: DataTypes.ENUM('familier', 'standard', 'soutenu'),
        defaultValue: 'standard',
        comment: 'Niveau de langage'
      },
      validationStatus: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      validationDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
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
  
    Translation.associate = (models) => {
      Translation.belongsTo(models.Word, { foreignKey: 'wordId' });
      Translation.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
      Translation.belongsTo(models.User, { as: 'validator', foreignKey: 'validatedBy' });
      Translation.hasMany(models.Contribution, { foreignKey: 'translationId' });
    };
  
    return Translation;
  };