  // models/VocabularyListItem.js - Mots dans une liste de vocabulaire
  module.exports = (sequelize, DataTypes) => {
    const VocabularyListItem = sequelize.define('VocabularyListItem', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vocabularyListId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'VocabularyLists',
          key: 'id'
        }
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
          key: 'id'
        }
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      mastered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['vocabularyListId', 'wordId']
        }
      ]
    });
  
    VocabularyListItem.associate = (models) => {
      VocabularyListItem.belongsTo(models.VocabularyList, { foreignKey: 'vocabularyListId' });
      VocabularyListItem.belongsTo(models.Word, { foreignKey: 'wordId' });
    };
  
    return VocabularyListItem;
  };
  