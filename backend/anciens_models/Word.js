  // models/Word.js - Modèle principal pour les mots
  module.exports = (sequelize, DataTypes) => {
    const Word = sequelize.define('Word', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      term: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Le mot en wolof'
      },
      pronunciation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Guide de prononciation'
      },
      initialLetter: {
        type: DataTypes.STRING(2),
        allowNull: false,
        comment: 'Lettre initiale pour le filtrage alphabétique'
      },
      etymology: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Origine du mot'
      },
      validationStatus: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      validationDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      popularity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Popularité basée sur les recherches'
      },
      dialect: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Variante dialectale'
      },
      isArchaic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si le mot est archaïque'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      audioUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL vers le fichier audio de prononciation'
      },
      difficulty: {
        type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé'),
        allowNull: true
      },
      wordTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'WordTypes',
          key: 'id'
        }
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
  
    Word.associate = (models) => {
      // Relations avec utilisateurs
      Word.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
      Word.belongsTo(models.User, { as: 'validator', foreignKey: 'validatedBy' });
      
      // Type de mot
      Word.belongsTo(models.WordType, { foreignKey: 'wordTypeId' });
      
      // Catégories et synonymes
      Word.belongsToMany(models.Category, { through: 'WordCategories' });
      Word.belongsToMany(models.Word, { 
        as: 'synonyms', 
        through: 'Synonyms',
        foreignKey: 'wordId',
        otherKey: 'synonymId'
      });
      
      // Traductions, exemples, conjugaisons
      Word.hasMany(models.Translation, { foreignKey: 'wordId' });
      Word.hasMany(models.Example, { foreignKey: 'wordId' });
      Word.hasMany(models.Conjugation, { foreignKey: 'wordId' });
      
      // Contributions
      Word.hasMany(models.Contribution, { foreignKey: 'wordId' });
    };
  
    // Hook pour définir automatiquement la lettre initiale
    Word.beforeCreate((word) => {
      if (word.term) {
        if (word.term.toUpperCase().startsWith('NG') && !word.term.startsWith('ŋ')) {
          word.initialLetter = 'NG';
        } else {
          word.initialLetter = word.term.charAt(0).toUpperCase();
        }
      }
    });
  
    return Word;
  };