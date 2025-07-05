  // models/Letter.js - Lettres de l'alphabet wolof
  module.exports = (sequelize, DataTypes) => {
    const Letter = sequelize.define('Letter', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      letter: {
        type: DataTypes.STRING(2),
        allowNull: false,
        unique: true
      },
      pronunciation: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      examples: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Exemples de mots commençant par cette lettre'
      },
      isSpecial: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indique s\'il s\'agit d\'une lettre spéciale'
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Ordre alphabétique'
      }
    }, {
      timestamps: true
    });
  
    return Letter;
  };

