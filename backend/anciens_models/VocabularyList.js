  // models/VocabularyList.js - Listes de vocabulaire pour l'apprentissage
  module.exports = (sequelize, DataTypes) => {
    const VocabularyList = sequelize.define('VocabularyList', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      difficulty: {
        type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé', 'mixte'),
        defaultValue: 'mixte'
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    VocabularyList.associate = (models) => {
      VocabularyList.belongsTo(models.User, { as: 'creator', foreignKey: 'creatorId' });
      VocabularyList.belongsToMany(models.Word, { through: 'VocabularyListItems', as: 'words' });
    };
  
    return VocabularyList;
  };
  