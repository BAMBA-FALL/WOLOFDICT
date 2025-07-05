  // models/WordCategory.js - Association entre mots et catégories
  module.exports = (sequelize, DataTypes) => {
    const WordCategory = sequelize.define('WordCategory', {
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
        }
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'id'
        }
      },
      isMainCategory: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indique si c\'est la catégorie principale pour ce mot'
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
          fields: ['wordId', 'categoryId']
        }
      ]
    });
  
    WordCategory.associate = (models) => {
      WordCategory.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    };
  
    return WordCategory;
  };
  