  // models/Conjugation.js - Conjugaisons de verbes
  module.exports = (sequelize, DataTypes) => {
    const Conjugation = sequelize.define('Conjugation', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tense: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Temps verbal (présent, passé, futur, etc.)'
      },
      person: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Personne (1ère singulier, 2ème pluriel, etc.)'
      },
      form: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Forme conjuguée'
      },
      isRegular: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Indique si la conjugaison suit un modèle régulier'
      },
      aspect: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Aspect verbal (progressif, accompli, etc.)'
      },
      mood: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Mode (indicatif, impératif, etc.)'
      },
      validationStatus: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      pronoun: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Pronom utilisé avec cette conjugaison'
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
  
    Conjugation.associate = (models) => {
      Conjugation.belongsTo(models.Word, { foreignKey: 'wordId' });
      Conjugation.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
      Conjugation.belongsTo(models.User, { as: 'validator', foreignKey: 'validatedBy' });
    };
  
    return Conjugation;
  };
  