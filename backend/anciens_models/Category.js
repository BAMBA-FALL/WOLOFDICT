  // models/Category.js - Catégories de mots
  module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Ex: Religion, Politique, Culture, etc.'
      },
      icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Nom de l\'icône (Lucide React)'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      nameWolof: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Nom de la catégorie en wolof'
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        comment: 'Code couleur HEX pour l\'interface'
      }
    }, {
      timestamps: true
    });
  
    Category.associate = (models) => {
      Category.belongsToMany(models.Word, { through: 'WordCategories' });
    };
  
    return Category;
  };
  