  // models/Tag.js - Tags pour les discussions
  module.exports = (sequelize, DataTypes) => {
    const Tag = sequelize.define('Tag', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        comment: 'Code couleur HEX pour l\'affichage du tag'
      }
    }, {
      timestamps: true
    });
  
    Tag.associate = (models) => {
      Tag.belongsToMany(models.Discussion, { through: 'DiscussionTags' });
    };
  
    return Tag;
  };
  