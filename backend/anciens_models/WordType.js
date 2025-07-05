  // models/WordType.js - Types de mots (nom, verbe, adjectif...)
  module.exports = (sequelize, DataTypes) => {
    const WordType = sequelize.define('WordType', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Ex: Nom, Verbe, Adjectif, etc.'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      nameWolof: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Nom du type en wolof'
      }
    }, {
      timestamps: true
    });
  
    WordType.associate = (models) => {
      WordType.hasMany(models.Word, { foreignKey: 'wordTypeId' });
    };
  
    return WordType;
  };