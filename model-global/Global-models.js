// models/User.js - Modèle Utilisateur
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('admin', 'expert', 'contributor', 'user'),
        defaultValue: 'user'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      speciality: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      timestamps: true,
      paranoid: true
    });
  
    User.associate = (models) => {
      // Mots créés/validés par l'utilisateur
      User.hasMany(models.Word, { as: 'addedWords', foreignKey: 'createdBy' });
      User.hasMany(models.Word, { as: 'validatedWords', foreignKey: 'validatedBy' });
      
      // Traductions et exemples
      User.hasMany(models.Translation, { as: 'addedTranslations', foreignKey: 'createdBy' });
      User.hasMany(models.Example, { as: 'addedExamples', foreignKey: 'createdBy' });
      User.hasMany(models.Conjugation, { as: 'addedConjugations', foreignKey: 'createdBy' });
      
      // Contributions et paramètres
      User.hasMany(models.Contribution, { foreignKey: 'userId' });
      User.hasOne(models.UserPreference, { foreignKey: 'userId' });
    };
  
    return User;
  };
  
  // models/UserPreference.js - Préférences utilisateur
  module.exports = (sequelize, DataTypes) => {
    const UserPreference = sequelize.define('UserPreference', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      interfaceLanguage: {
        type: DataTypes.STRING(10),
        defaultValue: 'fr' // fr, wo, en
      },
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      theme: {
        type: DataTypes.ENUM('light', 'dark', 'system'),
        defaultValue: 'system'
      }
    }, {
      timestamps: true
    });
  
    UserPreference.associate = (models) => {
      UserPreference.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return UserPreference;
  };
  
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
  
  // models/Translation.js - Traductions de mots
  module.exports = (sequelize, DataTypes) => {
    const Translation = sequelize.define('Translation', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Traduction en français'
      },
      context: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Contexte d\'utilisation'
      },
      isPrimary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si c\'est la traduction principale'
      },
      register: {
        type: DataTypes.ENUM('familier', 'standard', 'soutenu'),
        defaultValue: 'standard',
        comment: 'Niveau de langage'
      },
      validationStatus: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      validationDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
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
  
    Translation.associate = (models) => {
      Translation.belongsTo(models.Word, { foreignKey: 'wordId' });
      Translation.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
      Translation.belongsTo(models.User, { as: 'validator', foreignKey: 'validatedBy' });
      Translation.hasMany(models.Contribution, { foreignKey: 'translationId' });
    };
  
    return Translation;
  };
  
  // models/Example.js - Exemples d'utilisation
  module.exports = (sequelize, DataTypes) => {
    const Example = sequelize.define('Example', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      textWolof: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Phrase exemple en wolof'
      },
      textFrench: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Traduction de l\'exemple en français'
      },
      context: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Contexte de l\'exemple'
      },
      source: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Source de l\'exemple (littérature, proverbe, etc.)'
      },
      validationStatus: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      audioUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL vers l\'enregistrement audio de l\'exemple'
      },
      difficulty: {
        type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé'),
        allowNull: true
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
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
  
    Example.associate = (models) => {
      Example.belongsTo(models.Word, { foreignKey: 'wordId' });
      Example.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
      Example.belongsTo(models.User, { as: 'validator', foreignKey: 'validatedBy' });
    };
  
    return Example;
  };
  
  // models/Conjugation.js - Conjugaisons de verbes
  module.exports = (sequelize, DataTypes) => {
    const Conjugation = sequelize.define('Conjugation', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tense: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Temps verbal (présent, passé, futur, etc.)'
      },
      person: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Personne (1ère singulier, 2ème pluriel, etc.)'
      },
      form: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Forme conjuguée'
      },
      isRegular: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Indique si la conjugaison suit un modèle régulier'
      },
      aspect: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Aspect verbal (progressif, accompli, etc.)'
      },
      mood: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Mode (indicatif, impératif, etc.)'
      },
      validationStatus: {
        type: DataTypes.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      pronoun: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Pronom utilisé avec cette conjugaison'
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
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
  
    Conjugation.associate = (models) => {
      Conjugation.belongsTo(models.Word, { foreignKey: 'wordId' });
      Conjugation.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
      Conjugation.belongsTo(models.User, { as: 'validator', foreignKey: 'validatedBy' });
    };
  
    return Conjugation;
  };
  
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
  
  // models/Synonym.js - Relation de synonymie entre mots
  module.exports = (sequelize, DataTypes) => {
    const Synonym = sequelize.define('Synonym', {
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
        },
        comment: 'ID du mot principal'
      },
      synonymId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
          key: 'id'
        },
        comment: 'ID du mot qui est synonyme'
      },
      strength: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'Force de la relation synonymique (1-10)'
      },
      language: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'wolof',
        comment: 'Langue du synonyme (wolof ou français)'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notes ou contexte sur la relation de synonymie'
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
          fields: ['wordId', 'synonymId']
        }
      ]
    });
  
    Synonym.associate = (models) => {
      // Le mot principal de la relation
      Synonym.belongsTo(models.Word, { 
        foreignKey: 'wordId',
        as: 'mainWord'
      });
      
      // Le mot qui est synonyme
      Synonym.belongsTo(models.Word, { 
        foreignKey: 'synonymId',
        as: 'synonymWord'
      });
      
      // L'utilisateur qui a créé cette relation
      Synonym.belongsTo(models.User, { 
        foreignKey: 'createdBy',
        as: 'creator'
      });
    };
    
    return Synonym;
  };
  
  // models/Contribution.js - Suivi des contributions
  module.exports = (sequelize, DataTypes) => {
    const Contribution = sequelize.define('Contribution', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      action: {
        type: DataTypes.ENUM('create', 'update', 'delete', 'validate', 'reject'),
        allowNull: false
      },
      entityType: {
        type: DataTypes.ENUM('word', 'translation', 'example', 'conjugation'),
        allowNull: false,
        comment: 'Type d\'entité modifiée'
      },
      previousValue: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Valeur avant modification (JSON)'
      },
      newValue: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Nouvelle valeur (JSON)'
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Words',
          key: 'id'
        }
      },
      translationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Translations',
          key: 'id'
        }
      },
      exampleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Examples',
          key: 'id'
        }
      },
      conjugationId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Conjugations',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    Contribution.associate = (models) => {
      Contribution.belongsTo(models.User, { foreignKey: 'userId' });
      Contribution.belongsTo(models.Word, { foreignKey: 'wordId' });
      Contribution.belongsTo(models.Translation, { foreignKey: 'translationId' });
      Contribution.belongsTo(models.Example, { foreignKey: 'exampleId' });
      Contribution.belongsTo(models.Conjugation, { foreignKey: 'conjugationId' });
    };
  
    return Contribution;
  };
  
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
  
  // models/PhraseVariation.js - Variations d'une phrase
  module.exports = (sequelize, DataTypes) => {
    const PhraseVariation = sequelize.define('PhraseVariation', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      wolof: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Variation de la phrase en wolof'
      },
      francais: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Traduction française de la variation'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      phraseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Phrases',
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
      }
    }, {
      timestamps: true
    });
  
    PhraseVariation.associate = (models) => {
      PhraseVariation.belongsTo(models.Phrase, { foreignKey: 'phraseId' });
      PhraseVariation.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
    };
  
    return PhraseVariation;
  };
  
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


  // models/Discussion.js - Forums de discussion
module.exports = (sequelize, DataTypes) => {
    const Discussion = sequelize.define('Discussion', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      isClosed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isSticky: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      authorId: {
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
  
    Discussion.associate = (models) => {
      Discussion.belongsTo(models.User, { as: 'author', foreignKey: 'authorId' });
      Discussion.hasMany(models.Reply, { foreignKey: 'discussionId' });
      Discussion.belongsToMany(models.Tag, { through: 'DiscussionTags' });
    };
  
    return Discussion;
  };
  
  // models/Reply.js - Réponses aux discussions
  module.exports = (sequelize, DataTypes) => {
    const Reply = sequelize.define('Reply', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      isAccepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si cette réponse a été acceptée comme solution'
      },
      discussionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Discussions',
          key: 'id'
        }
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      parentReplyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Replies',
          key: 'id'
        }
      }
    }, {
      timestamps: true,
      paranoid: true
    });
  
    Reply.associate = (models) => {
      Reply.belongsTo(models.Discussion, { foreignKey: 'discussionId' });
      Reply.belongsTo(models.User, { as: 'author', foreignKey: 'authorId' });
      Reply.belongsTo(models.Reply, { as: 'parentReply', foreignKey: 'parentReplyId' });
      Reply.hasMany(models.Reply, { as: 'childReplies', foreignKey: 'parentReplyId' });
    };
  
    return Reply;
  };
  
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
  
  // models/Project.js - Projets communautaires
  module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('Project', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('en planification', 'en cours', 'complété', 'abandonné'),
        defaultValue: 'en planification'
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100
        }
      },
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Catégorie de projet (éducation, technologie, culture, etc.)'
      },
      estimatedCompletion: {
        type: DataTypes.DATE,
        allowNull: true
      },
      isOpenForContribution: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      leadContributorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    Project.associate = (models) => {
      Project.belongsTo(models.User, { as: 'leadContributor', foreignKey: 'leadContributorId' });
      Project.belongsToMany(models.User, { through: 'ProjectContributors', as: 'contributors' });
    };
  
    return Project;
  };
  
  // models/Event.js - Événements
  module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('Event', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      organizer: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      registrationLink: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Type d\'événement (atelier, conférence, etc.)'
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
      timestamps: true
    });
  
    Event.associate = (models) => {
      Event.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
    };
  
    return Event;
  };
  
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
  
  // models/VocabularyListItem.js - Mots dans une liste de vocabulaire
  module.exports = (sequelize, DataTypes) => {
    const VocabularyListItem = sequelize.define('VocabularyListItem', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      vocabularyListId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'VocabularyLists',
          key: 'id'
        }
      },
      wordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Words',
          key: 'id'
        }
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      mastered: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['vocabularyListId', 'wordId']
        }
      ]
    });
  
    VocabularyListItem.associate = (models) => {
      VocabularyListItem.belongsTo(models.VocabularyList, { foreignKey: 'vocabularyListId' });
      VocabularyListItem.belongsTo(models.Word, { foreignKey: 'wordId' });
    };
  
    return VocabularyListItem;
  };
  
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
  
  // models/Media.js - Fichiers médias (audio, images)
  module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('Media', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM('audio', 'image', 'video', 'document'),
        allowNull: false
      },
      url: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      filesize: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      entityType: {
        type: DataTypes.ENUM('word', 'phrase', 'example', 'letter'),
        allowNull: false,
        comment: 'Type d\'entité associée'
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de l\'entité associée'
      },
      uploaderId: {
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
        { fields: ['entityType', 'entityId'] }
      ]
    });
  
    Media.associate = (models) => {
      Media.belongsTo(models.User, { as: 'uploader', foreignKey: 'uploaderId' });
    };
  
    return Media;
  };
  
  // models/Notification.js - Notifications utilisateur
  module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM('contribution_validated', 'contribution_rejected', 'mention', 'reply', 'system'),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Lien associé à la notification'
      },
      entityType: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      entityId: {
        type: DataTypes.INTEGER,
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
      timestamps: true
    });
  
    Notification.associate = (models) => {
      Notification.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return Notification;
  };
  
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
  
  // models/SearchLog.js - Journal des recherches
  module.exports = (sequelize, DataTypes) => {
    const SearchLog = sequelize.define('SearchLog', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      term: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Terme recherché'
      },
      language: {
        type: DataTypes.ENUM('wolof', 'français'),
        allowNull: false,
        defaultValue: 'wolof'
      },
      hasResults: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        comment: 'Indique si la recherche a donné des résultats'
      },
      resultCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    SearchLog.associate = (models) => {
      SearchLog.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return SearchLog;
  };
  
  // models/Statistics.js - Statistiques d'utilisation 
  module.exports = (sequelize, DataTypes) => {
    const Statistics = sequelize.define('Statistics', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      period: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Période (jour, mois, année)'
      },
      periodValue: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Valeur de la période (ex: 2025-04)'
      },
      metricType: {
        type: DataTypes.ENUM(
          'words_added', 'words_validated', 'user_registrations', 
          'searches', 'visits', 'contributions'
        ),
        allowNull: false
      },
      metricValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['period', 'periodValue', 'metricType']
        }
      ]
    });
  
    return Statistics;
  };