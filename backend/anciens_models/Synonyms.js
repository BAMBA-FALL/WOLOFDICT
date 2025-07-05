  // models/Synonym.js - Relation de synonymie entre mots
  module.exports = (sequelize, DataTypes) => {
    const Synonym = sequelize.define('Synonym', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
          key: 'id'
        },
        comment: 'ID du mot principal'
      },
      synonymId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
          key: 'id'
        },
        comment: 'ID du mot qui est synonyme'
      },
      strength: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Force de la relation synonymique (1-10)'
      },
      language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'wolof',
        comment: 'Langue du synonyme (wolof ou français)'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes ou contexte sur la relation de synonymie'
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['wordId', 'synonymId']
        }
      ]
    });
  
    Synonym.associate = (models) => {
      // Le mot principal de la relation
      Synonym.belongsTo(models.Word, { 
        foreignKey: 'wordId',
        as: 'mainWord'
      });
      
      // Le mot qui est synonyme
      Synonym.belongsTo(models.Word, { 
        foreignKey: 'synonymId',
        as: 'synonymWord'
      });
      
      // L'utilisateur qui a créé cette relation
      Synonym.belongsTo(models.User, { 
        foreignKey: 'createdBy',
        as: 'creator'
      });
    };
    
    return Synonym;
  };