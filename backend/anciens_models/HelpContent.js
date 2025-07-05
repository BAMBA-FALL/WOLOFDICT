  // models/HelpContent.js - Contenu d'aide
  module.exports = (sequelize, DataTypes) => {
    const HelpContent = sequelize.define('HelpContent', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Catégorie d\'aide (ex: words, conjugation, users)'
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    }, {
      timestamps: true
    });
  
    return HelpContent;
  };
  