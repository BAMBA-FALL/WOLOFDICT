  // models/Phrase.js - Phrases complètes (pour l'apprentissage)
  module.exports = (sequelize, DataTypes) => {
    const Phrase = sequelize.define('Phrase', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      wolof: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Phrase en wolof'
      },
      francais: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Traduction française'
      },
      transliteration: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Translittération phonétique'
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Catégorie (salutations, quotidien, voyage, etc.)'
      },
      difficulty: {
        type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé'),
        allowNull: false,
        defaultValue: 'débutant'
      },
      explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Explication contextuelle ou culturelle'
      },
      context: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Contexte d\'utilisation'
      },
      likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      audioUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      validationStatus: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      validatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true,
      paranoid: true
    });
  
    Phrase.associate = (models) => {
      Phrase.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
      Phrase.belongsTo(models.User, { as: 'validator', foreignKey: 'validatedBy' });
      Phrase.hasMany(models.PhraseVariation, { foreignKey: 'phraseId' });
    };
  
    return Phrase;
  };
  