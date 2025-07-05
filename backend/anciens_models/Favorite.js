  // models/Favorite.js - Favoris des utilisateurs
  module.exports = (sequelize, DataTypes) => {
    const Favorite = sequelize.define('Favorite', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      entityType: {
        type: DataTypes.ENUM('word', 'phrase', 'example', 'conjugation'),
        allowNull: false,
        comment: 'Type d\'entité mise en favori'
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de l\'entité mise en favori'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
          fields: ['userId', 'entityType', 'entityId']
        }
      ]
    });
  
    Favorite.associate = (models) => {
      Favorite.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return Favorite;
  };
  