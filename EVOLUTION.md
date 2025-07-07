### **🗄️ Nouveau Modèle Requis (1 modèle)**

**Migration Sequelize :**
```javascript
// migrations/005-create-backup-system.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('backups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      backup_type: {
        type: Sequelize.ENUM('full', 'incremental', 'user_data', 'media'),
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false,
        comment: 'Taille en bytes'
      },
      checksum: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'SHA-256'
      },
      compression_ratio: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      backup_status: {
        type: Sequelize.ENUM('in_progress', 'completed', 'failed', 'corrupted'),
        allowNull: false,# 🚀 WOLOFDICT - GUIDE D'IMPLÉMENTATION DES EXTENSIONS FUTURES
*Roadmap détaillée Phases 2, 3 & 4 post-MVP*

**Document complémentaire au rapport principal d'architecture**

---

## 📋 **VUE D'ENSEMBLE DES EXTENSIONS**

### **Architecture Actuelle (Phase 1 - MVP)**
- ✅ **45 Controllers** opérationnels avec services intégrés
- ✅ **45 Modèles** Sequelize complets  
- ✅ **29 Services** (4 complets + 25 templates)
- ✅ **Système freemium** natif dans chaque endpoint
- ✅ **350+ endpoints API** fonctionnels

### **Extensions Planifiées**
- **Phase 2** : Services Wolof Spécifiques (4 services, 0 nouveau modèle)
- **Phase 3** : Services Éducation Premium (4 services, 9 nouveaux modèles)  
- **Phase 4** : Services Intégration Avancée (5 services, 1 nouveau modèle)

---

## 🌍 **PHASE 2 : SERVICES WOLOF SPÉCIFIQUES**
*Timeline : Mois 3-4 post-MVP | Priorité : HAUTE*

### **📊 Résumé Phase 2**
- **Objectif** : Différenciation unique sur le marché
- **Impact** : Features exclusives wolof, valeur premium
- **Complexité** : Moyenne (services de logique pure)
- **Nouveaux modèles** : 0 (utilise modèles existants)
- **ROI attendu** : +400% utilisateurs, +500% revenus

### **Services à Développer (4 services)**

#### **1. WolofTransliterationService**
```javascript
// services/wolof/WolofTransliterationService.js
class WolofTransliterationService {
  /**
   * Convertit le texte wolof de l'alphabet latin vers arabe
   */
  static latinToArabic(text) {
    const mapping = {
      'a': 'ا', 'b': 'ب', 'c': 'چ', 'd': 'د', 'e': 'ه',
      'f': 'ف', 'g': 'گ', 'h': 'ھ', 'i': 'ی', 'j': 'ج',
      'k': 'ک', 'l': 'ل', 'm': 'م', 'n': 'ن', 'ñ': 'ں',
      'o': 'و', 'p': 'پ', 'q': 'ق', 'r': 'ر', 's': 'س',
      't': 'ت', 'u': 'ۇ', 'w': 'و', 'x': 'خ', 'y': 'ی', 'z': 'ز'
    };
    
    return text.toLowerCase().split('').map(char => mapping[char] || char).join('');
  }

  /**
   * Convertit le texte wolof de l'alphabet arabe vers latin
   */
  static arabicToLatin(text) {
    const reverseMapping = {
      'ا': 'a', 'ب': 'b', 'چ': 'c', 'د': 'd', 'ه': 'e',
      'ف': 'f', 'گ': 'g', 'ھ': 'h', 'ی': 'i', 'ج': 'j',
      'ک': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ں': 'ñ',
      'و': 'o', 'پ': 'p', 'ق': 'q', 'ر': 'r', 'س': 's',
      'ت': 't', 'ۇ': 'u', 'خ': 'x', 'ز': 'z'
    };
    
    return text.split('').map(char => reverseMapping[char] || char).join('');
  }

  /**
   * Détecte automatiquement le script utilisé
   */
  static detectScript(text) {
    const arabicChars = /[\u0600-\u06FF]/;
    const latinChars = /[a-zA-Z]/;
    
    if (arabicChars.test(text)) return 'arabic';
    if (latinChars.test(text)) return 'latin';
    return 'unknown';
  }

  /**
   * Normalise le texte selon les standards wolof
   */
  static normalizeText(text) {
    return text
      .replace(/ë/g, 'e')  // Normalisation des accents
      .replace(/ö/g, 'o')
      .toLowerCase()
      .trim();
  }
}

// Intégration dans WordController et PhraseController
// Usage: const arabic = WolofTransliterationService.latinToArabic(word.wolof);
```

#### **2. WolofPronunciationService**
```javascript
// services/wolof/WolofPronunciationService.js
class WolofPronunciationService {
  /**
   * Génère la transcription IPA pour un mot wolof
   */
  static generateIPA(wolofText) {
    const phonemeMap = {
      'a': 'a', 'á': 'aː', 'e': 'ɛ', 'é': 'e', 'ë': 'ə',
      'i': 'i', 'í': 'iː', 'o': 'ɔ', 'ó': 'o', 'ö': 'ø',
      'u': 'u', 'ú': 'uː',
      'b': 'b', 'c': 'tʃ', 'd': 'd', 'f': 'f', 'g': 'g',
      'h': 'h', 'j': 'ɟ', 'k': 'k', 'l': 'l', 'm': 'm',
      'n': 'n', 'ñ': 'ɲ', 'p': 'p', 'q': 'q', 'r': 'r',
      's': 's', 't': 't', 'w': 'w', 'x': 'x', 'y': 'j', 'z': 'z'
    };
    
    return wolofText.toLowerCase()
      .split('')
      .map(char => phonemeMap[char] || char)
      .join('');
  }

  /**
   * Trouve des sons similaires pour l'apprentissage
   */
  static getSimilarSounds(phoneme) {
    const similarityGroups = {
      'a': ['ɛ', 'ɔ'],
      'i': ['e', 'ɛ'],
      'u': ['o', 'ɔ'],
      'b': ['p', 'm'],
      'd': ['t', 'n'],
      'g': ['k', 'ŋ']
    };
    
    return similarityGroups[phoneme] || [];
  }

  /**
   * Valide la prononciation avec analyse audio (IA future)
   */
  static async validatePronunciation(audioFile, expectedText) {
    // TODO: Intégration avec SpeechService pour reconnaissance vocale
    return {
      accuracy: 0.85,
      feedback: "Bonne prononciation du 'ñ'",
      incorrectPhonemes: ['x'],
      suggestions: "Prononcez le 'x' plus gutturalement"
    };
  }

  /**
   * Génère des exercices de prononciation
   */
  static generatePronunciationExercise(difficulty = 'beginner') {
    const exercises = {
      beginner: ['ba', 'ma', 'na', 'sa', 'ta'],
      intermediate: ['ñoom', 'xaalis', 'góor', 'jigéen'],
      advanced: ['xëcc', 'mbëgg', 'nguur', 'ñaareel']
    };
    
    return exercises[difficulty] || exercises.beginner;
  }
}

// Intégration dans AudioController et WordController
// Usage: const ipa = WolofPronunciationService.generateIPA(word.wolof);
```

#### **3. WolofDialectService**
```javascript
// services/wolof/WolofDialectService.js
class WolofDialectService {
  /**
   * Obtient les variations régionales d'un mot
   */
  static getRegionalVariants(word) {
    // Utilise le modèle WordVariation existant
    const dialectRegions = {
      'senegal_dakar': 'Dakar',
      'senegal_kaolack': 'Kaolack', 
      'senegal_saint_louis': 'Saint-Louis',
      'gambia': 'Gambie',
      'mauritania': 'Mauritanie'
    };
    
    return {
      standard: word,
      variants: [
        { region: 'senegal_dakar', form: word, notes: 'Forme standard' },
        { region: 'gambia', form: this.applyGambianVariation(word), notes: 'Variation gambienne' }
      ]
    };
  }

  /**
   * Détecte la région d'origine d'un texte
   */
  static detectDialect(text) {
    const dialectMarkers = {
      'senegal_dakar': ['def', 'amul', 'nekk'],
      'gambia': ['ben', 'amula', 'neka'],
      'senegal_kaolack': ['daf', 'amul', 'nek']
    };
    
    let scores = {};
    
    for (const [region, markers] of Object.entries(dialectMarkers)) {
      scores[region] = markers.filter(marker => text.includes(marker)).length;
    }
    
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  /**
   * Standardise l'orthographe selon les conventions officielles
   */
  static standardizeSpelling(word) {
    const standardizations = {
      'kër': 'kër',     // maison (standard)
      'ker': 'kër',     // variation sans accent
      'góor': 'góor',   // homme (standard)
      'goor': 'góor',   // sans accent tonal
      'gòor': 'góor'    // accent différent
    };
    
    return standardizations[word.toLowerCase()] || word;
  }

  /**
   * Applique les variations dialectales gambiennes
   */
  static applyGambianVariation(word) {
    const gambianRules = {
      'def': 'ben',     // être
      'amul': 'amula',  // ne pas avoir
      'nekk': 'neka'    // être/se trouver
    };
    
    return gambianRules[word] || word;
  }

  /**
   * Obtient les informations culturelles d'une région
   */
  static getRegionalContext(region) {
    const contexts = {
      'senegal_dakar': {
        population: '3M+',
        features: ['urbain', 'cosmopolite', 'français_influence'],
        cultural_notes: 'Influence française forte, vocabulaire moderne'
      },
      'gambia': {
        population: '400K+',
        features: ['anglais_influence', 'rural', 'traditionnel'],
        cultural_notes: 'Influence anglaise, préservation traditionnelle'
      }
    };
    
    return contexts[region] || {};
  }
}

// Intégration dans WordController et WordVariationController
// Usage: const variants = WolofDialectService.getRegionalVariants(word.wolof);
```

#### **4. WolofGrammarService**
```javascript
// services/wolof/WolofGrammarService.js
class WolofGrammarService {
  /**
   * Analyse grammaticale d'une phrase wolof
   */
  static analyzeGrammar(sentence) {
    const words = sentence.split(' ');
    let analysis = [];
    
    words.forEach((word, index) => {
      analysis.push({
        word: word,
        position: index,
        wordClass: this.identifyWordClass(word),
        grammaticalRole: this.getGrammaticalRole(word, words, index),
        conjugation: this.analyzeConjugation(word)
      });
    });
    
    return {
      sentence: sentence,
      wordCount: words.length,
      structure: this.identifyStructure(words),
      analysis: analysis,
      isValidWolof: this.validateWolofGrammar(words)
    };
  }

  /**
   * Identifie la classe grammaticale d'un mot
   */
  static identifyWordClass(word) {
    const pronouns = ['man', 'yow', 'moom', 'nu', 'yéen', 'ñoom'];
    const verbs = ['def', 'am', 'nekk', 'jóge', 'dem', 'dellu'];
    const nouns = ['kër', 'góor', 'jigéen', 'xale', 'yaay', 'baay'];
    
    if (pronouns.includes(word.toLowerCase())) return 'pronom';
    if (verbs.includes(word.toLowerCase())) return 'verbe';
    if (nouns.includes(word.toLowerCase())) return 'nom';
    
    return 'inconnu';
  }

  /**
   * Détermine le rôle grammatical dans la phrase
   */
  static getGrammaticalRole(word, words, position) {
    if (position === 0) return 'sujet';
    if (position === words.length - 1) return 'objet_ou_prédicat';
    if (this.identifyWordClass(word) === 'verbe') return 'verbe_principal';
    
    return 'complément';
  }

  /**
   * Analyse la conjugaison d'un verbe
   */
  static analyzeConjugation(word) {
    const conjugationPatterns = {
      'def': {
        present: ['def na', 'def nga', 'def na'],
        past: ['def naa', 'def ngeen', 'def nañu'],
        future: ['dinaa def', 'dinga def', 'dina def']
      }
    };
    
    return conjugationPatterns[word] || null;
  }

  /**
   * Identifie la structure de phrase
   */
  static identifyStructure(words) {
    if (words.length <= 2) return 'phrase_simple';
    if (words.includes('te') || words.includes('ak')) return 'phrase_coordonnée';
    if (words.includes('bu') || words.includes('su')) return 'phrase_subordonnée';
    
    return 'phrase_complexe';
  }

  /**
   * Valide la grammaire wolof
   */
  static validateWolofGrammar(words) {
    // Règles de base du wolof
    const hasSubject = words.some(w => this.identifyWordClass(w) === 'pronom');
    const hasVerb = words.some(w => this.identifyWordClass(w) === 'verbe');
    
    return hasSubject && hasVerb;
  }

  /**
   * Suggère des corrections grammaticales
   */
  static suggestCorrections(sentence) {
    const analysis = this.analyzeGrammar(sentence);
    let suggestions = [];
    
    if (!analysis.isValidWolof) {
      suggestions.push("Vérifiez la présence d'un sujet et d'un verbe");
    }
    
    return suggestions;
  }

  /**
   * Obtient la conjugaison complète d'un verbe
   */
  static getConjugation(verb) {
    const conjugations = {
      'def': {
        infinitive: 'def',
        meaning: 'faire/être',
        present: {
          '1sg': 'def naa',
          '2sg': 'def nga', 
          '3sg': 'def na',
          '1pl': 'def nañu',
          '2pl': 'def ngeen',
          '3pl': 'def nañu'
        },
        past: {
          '1sg': 'def naa',
          '2sg': 'def nga',
          '3sg': 'def na'
        },
        future: {
          '1sg': 'dinaa def',
          '2sg': 'dinga def',
          '3sg': 'dina def'
        }
      }
    };
    
    return conjugations[verb] || null;
  }
}

// Intégration dans PhraseController et nouveaux controllers éducation
// Usage: const grammar = WolofGrammarService.analyzeGrammar(phrase.wolof);
```

### **🔗 Intégration dans Controllers Existants**

```javascript
// Mise à jour WordController avec services wolof
class WordController {
  async createWord(req, res) {
    // ... validation existante
    
    // Ajout des services wolof
    const transliteration = WolofTransliterationService.latinToArabic(req.body.wolof);
    const ipa = WolofPronunciationService.generateIPA(req.body.wolof);
    const standardForm = WolofDialectService.standardizeSpelling(req.body.wolof);
    
    const word = await Word.create({
      ...req.body,
      wolof_standard: standardForm,
      arabic_script: transliteration,
      ipa_pronunciation: ipa
    });
    
    // ... reste du code
  }
}
```

### **📋 Plan d'Implémentation Phase 2**

#### **Semaine 1-2 : WolofTransliterationService**
- [ ] Création du service avec mappings latin ↔ arabe
- [ ] Tests unitaires des conversions
- [ ] Intégration dans WordController et PhraseController
- [ ] Frontend : Boutons de conversion dans interfaces

#### **Semaine 3-4 : WolofPronunciationService**
- [ ] Implémentation génération IPA
- [ ] Algorithmes détection phonèmes similaires
- [ ] Intégration avec AudioController existant
- [ ] Frontend : Affichage IPA dans détails mots

#### **Semaine 5-6 : WolofDialectService**
- [ ] Base de données variations dialectales
- [ ] Algorithmes détection région
- [ ] Intégration avec WordVariationController
- [ ] Frontend : Sélecteur de dialecte

#### **Semaine 7-8 : WolofGrammarService**
- [ ] Analyseur grammatical de base
- [ ] Règles de validation wolof
- [ ] Suggestions de corrections
- [ ] Frontend : Correcteur grammatical

#### **Semaine 9 : Tests et Intégration**
- [ ] Tests d'intégration inter-services
- [ ] Documentation API mise à jour
- [ ] Formation équipe sur services wolof
- [ ] Déploiement en production

---

## 📚 **PHASE 3 : SERVICES ÉDUCATION PREMIUM**
*Timeline : Mois 6-8 post-MVP | Priorité : CRITIQUE*

### **📊 Résumé Phase 3**
- **Objectif** : Monétisation freemium → premium
- **Impact** : Justification abonnements 9.99€/mois
- **Complexité** : Haute (9 nouveaux modèles + 4 services)
- **ROI attendu** : +200% conversion premium, +500% revenus

### **🗄️ Nouveaux Modèles Requis (9 modèles)**

#### **1. Modèles Parcours d'Apprentissage**

**Migration Sequelize :**
```javascript
// migrations/001-create-learning-paths.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table learning_paths
    await queryInterface.createTable('learning_paths', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      difficulty_level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
        defaultValue: 'beginner'
      },
      estimated_duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Durée estimée en heures'
      },
      completion_percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour learning_paths
    await queryInterface.addIndex('learning_paths', ['user_id'], {
      name: 'idx_user_learning_paths'
    });
    await queryInterface.addIndex('learning_paths', ['difficulty_level'], {
      name: 'idx_difficulty_level'
    });

    // Table learning_steps
    await queryInterface.createTable('learning_steps', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      learning_path_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'learning_paths',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      step_order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      step_type: {
        type: Sequelize.ENUM('lesson', 'quiz', 'practice', 'review'),
        allowNull: false
      },
      content_type: {
        type: Sequelize.ENUM('word', 'phrase', 'grammar', 'pronunciation'),
        allowNull: false
      },
      content_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Référence polymorphe'
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      time_spent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Temps passé en secondes'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour learning_steps
    await queryInterface.addIndex('learning_steps', ['learning_path_id', 'step_order'], {
      name: 'idx_learning_path_steps'
    });
    await queryInterface.addIndex('learning_steps', ['content_type', 'content_id'], {
      name: 'idx_content_reference'
    });
    
    // Contrainte unique
    await queryInterface.addConstraint('learning_steps', {
      fields: ['learning_path_id', 'step_order'],
      type: 'unique',
      name: 'unique_path_step'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('learning_steps');
    await queryInterface.dropTable('learning_paths');
  }
};
```

**Modèles Sequelize :**
```javascript
// models/education/LearningPath.js
module.exports = (sequelize, DataTypes) => {
  const LearningPath = sequelize.define('LearningPath', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    difficulty_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    estimated_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 1000
      }
    },
    completion_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'learning_paths',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['difficulty_level']
      }
    ]
  });

  LearningPath.associate = function(models) {
    // Associations
    LearningPath.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
    
    LearningPath.hasMany(models.LearningStep, {
      foreignKey: 'learning_path_id',
      as: 'steps',
      onDelete: 'CASCADE'
    });
  };

  return LearningPath;
};

// models/education/LearningStep.js
module.exports = (sequelize, DataTypes) => {
  const LearningStep = sequelize.define('LearningStep', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    learning_path_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'learning_paths',
        key: 'id'
      }
    },
    step_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    step_type: {
      type: DataTypes.ENUM('lesson', 'quiz', 'practice', 'review'),
      allowNull: false
    },
    content_type: {
      type: DataTypes.ENUM('word', 'phrase', 'grammar', 'pronunciation'),
      allowNull: false
    },
    content_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    time_spent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'learning_steps',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['learning_path_id', 'step_order']
      },
      {
        fields: ['content_type', 'content_id']
      },
      {
        fields: ['learning_path_id', 'step_order'],
        unique: true,
        name: 'unique_path_step'
      }
    ]
  });

  LearningStep.associate = function(models) {
    // Associations
    LearningStep.belongsTo(models.LearningPath, {
      foreignKey: 'learning_path_id',
      as: 'learning_path',
      onDelete: 'CASCADE'
    });
    
    // Relations polymorphes (à implémenter selon le content_type)
    // LearningStep.belongsTo(models.Word, { ... }) - conditionnel
    // LearningStep.belongsTo(models.Phrase, { ... }) - conditionnel
  };

  return LearningStep;
};
```

#### **2. Modèles Quiz Système**

**Migration Sequelize :**
```javascript
// migrations/002-create-quiz-system.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table quizzes
    await queryInterface.createTable('quizzes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      topic: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      difficulty_level: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
        defaultValue: 'beginner'
      },
      time_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Limite de temps en minutes'
      },
      passing_score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 60.00
      },
      is_adaptive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour quizzes
    await queryInterface.addIndex('quizzes', ['topic', 'difficulty_level'], {
      name: 'idx_topic_difficulty'
    });
    await queryInterface.addIndex('quizzes', ['created_by'], {
      name: 'idx_created_by'
    });

    // Table quiz_questions
    await queryInterface.createTable('quiz_questions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      quiz_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'quizzes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      question_type: {
        type: Sequelize.ENUM('multiple_choice', 'true_false', 'fill_blank', 'audio_recognition', 'pronunciation'),
        allowNull: false
      },
      question_text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      audio_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      difficulty_weight: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 1.00
      },
      explanation: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      order_position: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour quiz_questions
    await queryInterface.addIndex('quiz_questions', ['quiz_id', 'order_position'], {
      name: 'idx_quiz_questions'
    });
    await queryInterface.addIndex('quiz_questions', ['question_type'], {
      name: 'idx_question_type'
    });

    // Table quiz_answers
    await queryInterface.createTable('quiz_answers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      question_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'quiz_questions',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      answer_text: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      is_correct: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      order_position: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour quiz_answers
    await queryInterface.addIndex('quiz_answers', ['question_id', 'order_position'], {
      name: 'idx_question_answers'
    });

    // Table user_quiz_attempts
    await queryInterface.createTable('user_quiz_attempts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      quiz_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'quizzes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      total_questions: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      correct_answers: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      time_taken: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Temps pris en secondes'
      },
      answers_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Stockage des réponses détaillées'
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour user_quiz_attempts
    await queryInterface.addIndex('user_quiz_attempts', ['user_id', 'quiz_id'], {
      name: 'idx_user_attempts'
    });
    await queryInterface.addIndex('user_quiz_attempts', ['completed_at'], {
      name: 'idx_completion_date'
    });
    await queryInterface.addIndex('user_quiz_attempts', ['score'], {
      name: 'idx_score'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_quiz_attempts');
    await queryInterface.dropTable('quiz_answers');
    await queryInterface.dropTable('quiz_questions');
    await queryInterface.dropTable('quizzes');
  }
};
```

**Modèles Sequelize :**
```javascript
// models/education/Quiz.js
module.exports = (sequelize, DataTypes) => {
  const Quiz = sequelize.define('Quiz', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    topic: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    difficulty_level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    time_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 300
      }
    },
    passing_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 60.00,
      validate: {
        min: 0,
        max: 100
      }
    },
    is_adaptive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'quizzes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['topic', 'difficulty_level']
      },
      {
        fields: ['created_by']
      }
    ]
  });

  Quiz.associate = function(models) {
    Quiz.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL'
    });
    
    Quiz.hasMany(models.QuizQuestion, {
      foreignKey: 'quiz_id',
      as: 'questions',
      onDelete: 'CASCADE'
    });
    
    Quiz.hasMany(models.UserQuizAttempt, {
      foreignKey: 'quiz_id',
      as: 'attempts',
      onDelete: 'CASCADE'
    });
  };

  return Quiz;
};

// models/education/QuizQuestion.js
module.exports = (sequelize, DataTypes) => {
  const QuizQuestion = sequelize.define('QuizQuestion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quizzes',
        key: 'id'
      }
    },
    question_type: {
      type: DataTypes.ENUM('multiple_choice', 'true_false', 'fill_blank', 'audio_recognition', 'pronunciation'),
      allowNull: false
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    audio_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 10
      }
    },
    difficulty_weight: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 1.00,
      validate: {
        min: 0.1,
        max: 5.0
      }
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    order_position: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    }
  }, {
    tableName: 'quiz_questions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['quiz_id', 'order_position']
      },
      {
        fields: ['question_type']
      }
    ]
  });

  QuizQuestion.associate = function(models) {
    QuizQuestion.belongsTo(models.Quiz, {
      foreignKey: 'quiz_id',
      as: 'quiz',
      onDelete: 'CASCADE'
    });
    
    QuizQuestion.hasMany(models.QuizAnswer, {
      foreignKey: 'question_id',
      as: 'answers',
      onDelete: 'CASCADE'
    });
  };

  return QuizQuestion;
};

// models/education/QuizAnswer.js
module.exports = (sequelize, DataTypes) => {
  const QuizAnswer = sequelize.define('QuizAnswer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quiz_questions',
        key: 'id'
      }
    },
    answer_text: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 500]
      }
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    order_position: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    }
  }, {
    tableName: 'quiz_answers',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['question_id', 'order_position']
      }
    ]
  });

  QuizAnswer.associate = function(models) {
    QuizAnswer.belongsTo(models.QuizQuestion, {
      foreignKey: 'question_id',
      as: 'question',
      onDelete: 'CASCADE'
    });
  };

  return QuizAnswer;
};

// models/education/UserQuizAttempt.js
module.exports = (sequelize, DataTypes) => {
  const UserQuizAttempt = sequelize.define('UserQuizAttempt', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quizzes',
        key: 'id'
      }
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    total_questions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    correct_answers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    time_taken: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0
      }
    },
    answers_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_quiz_attempts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'quiz_id']
      },
      {
        fields: ['completed_at']
      },
      {
        fields: ['score']
      }
    ]
  });

  UserQuizAttempt.associate = function(models) {
    UserQuizAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
    
    UserQuizAttempt.belongsTo(models.Quiz, {
      foreignKey: 'quiz_id',
      as: 'quiz',
      onDelete: 'CASCADE'
    });
  };

  return UserQuizAttempt;
};
```
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_topic_difficulty (topic, difficulty_level),
  INDEX idx_created_by (created_by)
);

CREATE TABLE quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_type ENUM('multiple_choice', 'true_false', 'fill_blank', 'audio_recognition', 'pronunciation') NOT NULL,
  question_text TEXT NOT NULL,
  audio_url VARCHAR(500) NULL,
  image_url VARCHAR(500) NULL,
  points INTEGER DEFAULT 1,
  difficulty_weight DECIMAL(3,2) DEFAULT 1.00,
  explanation TEXT,
  order_position INTEGER,
  
  INDEX idx_quiz_questions (quiz_id, order_position),
  INDEX idx_question_type (question_type)
);

CREATE TABLE quiz_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer_text VARCHAR(500) NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_position INTEGER,
  
  INDEX idx_question_answers (question_id, order_position)
);

CREATE TABLE user_quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
  score DECIMAL(5,2) NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER, -- en secondes
  answers_data JSON, -- Stockage des réponses détaillées
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  INDEX idx_user_attempts (user_id, quiz_id),
  INDEX idx_completion_date (completed_at),
  INDEX idx_score (score)
);
```

#### **3. Modèles Progression et Achievements**

**Migration Sequelize :**
```javascript
// migrations/003-create-progress-tracking.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table user_progress
    await queryInterface.createTable('user_progress', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      content_type: {
        type: Sequelize.ENUM('word', 'phrase', 'grammar', 'pronunciation', 'quiz'),
        allowNull: false
      },
      content_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      progress_type: {
        type: Sequelize.ENUM('discovered', 'learning', 'practicing', 'mastered'),
        allowNull: false,
        defaultValue: 'discovered'
      },
      mastery_level: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      attempts_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      correct_attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      last_practice_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      streak_days: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      total_time_spent: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Temps total en secondes'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour user_progress
    await queryInterface.addIndex('user_progress', ['user_id', 'content_type'], {
      name: 'idx_user_progress'
    });
    await queryInterface.addIndex('user_progress', ['content_type', 'content_id'], {
      name: 'idx_content_reference'
    });
    await queryInterface.addIndex('user_progress', ['mastery_level'], {
      name: 'idx_mastery_level'
    });
    
    // Contrainte unique
    await queryInterface.addConstraint('user_progress', {
      fields: ['user_id', 'content_type', 'content_id'],
      type: 'unique',
      name: 'unique_user_content'
    });

    // Table achievements
    await queryInterface.createTable('achievements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      icon_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      badge_type: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold', 'platinum'),
        allowNull: false,
        defaultValue: 'bronze'
      },
      criteria_type: {
        type: Sequelize.ENUM('words_learned', 'streak_days', 'quiz_score', 'contribution', 'time_spent'),
        allowNull: false
      },
      criteria_value: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      criteria_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Critères additionnels'
      },
      points_reward: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour achievements
    await queryInterface.addIndex('achievements', ['criteria_type', 'criteria_value'], {
      name: 'idx_criteria'
    });
    await queryInterface.addIndex('achievements', ['badge_type'], {
      name: 'idx_badge_type'
    });

    // Table user_achievements
    await queryInterface.createTable('user_achievements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      achievement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'achievements',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      progress_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Pour achievements progressifs'
      },
      earned_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      notified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour user_achievements
    await queryInterface.addIndex('user_achievements', ['user_id', 'earned_at'], {
      name: 'idx_user_achievements'
    });
    await queryInterface.addIndex('user_achievements', ['achievement_id'], {
      name: 'idx_achievement_users'
    });
    
    // Contrainte unique
    await queryInterface.addConstraint('user_achievements', {
      fields: ['user_id', 'achievement_id'],
      type: 'unique',
      name: 'unique_user_achievement'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_achievements');
    await queryInterface.dropTable('achievements');
    await queryInterface.dropTable('user_progress');
  }
};
```

**Modèles Sequelize :**
```javascript
// models/education/UserProgress.js
module.exports = (sequelize, DataTypes) => {
  const UserProgress = sequelize.define('UserProgress', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    content_type: {
      type: DataTypes.ENUM('word', 'phrase', 'grammar', 'pronunciation', 'quiz'),
      allowNull: false
    },
    content_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    progress_type: {
      type: DataTypes.ENUM('discovered', 'learning', 'practicing', 'mastered'),
      allowNull: false,
      defaultValue: 'discovered'
    },
    mastery_level: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100
      }
    },
    attempts_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    correct_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    last_practice_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    streak_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total_time_spent: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'user_progress',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'content_type']
      },
      {
        fields: ['content_type', 'content_id']
      },
      {
        fields: ['mastery_level']
      },
      {
        fields: ['user_id', 'content_type', 'content_id'],
        unique: true,
        name: 'unique_user_content'
      }
    ]
  });

  UserProgress.associate = function(models) {
    UserProgress.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
    
    // Relations polymorphes conditionnelles
    // UserProgress.belongsTo(models.Word, { foreignKey: 'content_id', constraints: false });
    // UserProgress.belongsTo(models.Phrase, { foreignKey: 'content_id', constraints: false });
  };

  return UserProgress;
};

// models/education/Achievement.js
module.exports = (sequelize, DataTypes) => {
  const Achievement = sequelize.define('Achievement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    icon_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    badge_type: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
      allowNull: false,
      defaultValue: 'bronze'
    },
    criteria_type: {
      type: DataTypes.ENUM('words_learned', 'streak_days', 'quiz_score', 'contribution', 'time_spent'),
      allowNull: false
    },
    criteria_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    criteria_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    points_reward: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'achievements',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['criteria_type', 'criteria_value']
      },
      {
        fields: ['badge_type']
      }
    ]
  });

  Achievement.associate = function(models) {
    Achievement.hasMany(models.UserAchievement, {
      foreignKey: 'achievement_id',
      as: 'user_achievements',
      onDelete: 'CASCADE'
    });
  };

  return Achievement;
};

// models/education/UserAchievement.js
module.exports = (sequelize, DataTypes) => {
  const UserAchievement = sequelize.define('UserAchievement', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    achievement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'achievements',
        key: 'id'
      }
    },
    progress_value: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    earned_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notified_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_achievements',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'earned_at']
      },
      {
        fields: ['achievement_id']
      },
      {
        fields: ['user_id', 'achievement_id'],
        unique: true,
        name: 'unique_user_achievement'
      }
    ]
  });

  UserAchievement.associate = function(models) {
    UserAchievement.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
    
    UserAchievement.belongsTo(models.Achievement, {
      foreignKey: 'achievement_id',
      as: 'achievement',
      onDelete: 'CASCADE'
    });
  };

  return UserAchievement;
};
```

#### **4. Modèles Certification**

**Migration Sequelize :**
```javascript
// migrations/004-create-certification-system.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Table certifications
    await queryInterface.createTable('certifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      level: {
        type: Sequelize.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
        allowNull: false,
        comment: 'Niveaux CECR'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      requirements: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Critères requis'
      },
      certificate_template: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'Template PDF'
      },
      validity_months: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 12
      },
      price_cents: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Prix en centimes'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour certifications
    await queryInterface.addIndex('certifications', ['level'], {
      name: 'idx_level'
    });
    await queryInterface.addIndex('certifications', ['is_active', 'level'], {
      name: 'idx_active_certifications'
    });

    // Table user_certifications
    await queryInterface.createTable('user_certifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      certification_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'certifications',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      score: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false
      },
      requirements_met: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Détail des critères validés'
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      certificate_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'PDF généré et stocké'
      },
      verification_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Code de vérification unique'
      },
      is_revoked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      revoked_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      revoked_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index pour user_certifications
    await queryInterface.addIndex('user_certifications', ['user_id', 'issued_at'], {
      name: 'idx_user_certifications'
    });
    await queryInterface.addIndex('user_certifications', ['verification_code'], {
      name: 'idx_verification_code'
    });
    await queryInterface.addIndex('user_certifications', ['expires_at', 'is_revoked'], {
      name: 'idx_expiration'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_certifications');
    await queryInterface.dropTable('certifications');
  }
};
```

**Modèles Sequelize :**
```javascript
// models/education/Certification.js
module.exports = (sequelize, DataTypes) => {
  const Certification = sequelize.define('Certification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255]
      }
    },
    level: {
      type: DataTypes.ENUM('A1', 'A2', 'B1', 'B2', 'C1', 'C2'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    requirements: {
      type: DataTypes.JSON,
      allowNull: false
    },
    certificate_template: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    validity_months: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
      validate: {
        min: 1,
        max: 120
      }
    },
    price_cents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'certifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['level']
      },
      {
        fields: ['is_active', 'level']
      }
    ]
  });

  Certification.associate = function(models) {
    Certification.hasMany(models.UserCertification, {
      foreignKey: 'certification_id',
      as: 'user_certifications',
      onDelete: 'CASCADE'
    });
  };

  return Certification;
};

// models/education/UserCertification.js
module.exports = (sequelize, DataTypes) => {
  const UserCertification = sequelize.define('UserCertification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    certification_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'certifications',
        key: 'id'
      }
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    requirements_met: {
      type: DataTypes.JSON,
      allowNull: true
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    certificate_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    verification_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    is_revoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revoked_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'user_certifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id', 'issued_at']
      },
      {
        fields: ['verification_code']
      },
      {
        fields: ['expires_at', 'is_revoked']
      }
    ]
  });

  UserCertification.associate = function(models) {
    UserCertification.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
    
    UserCertification.belongsTo(models.Certification, {
      foreignKey: 'certification_id',
      as: 'certification',
      onDelete: 'CASCADE'
    });
  };

  return UserCertification;
};
```

### **📋 Plan d'Implémentation Phase 3**

#### **Mois 6 : Migrations + Services Core**
- [ ] **Semaine 1-2** : Migrations BDD (4 migrations, 9 modèles)
- [ ] **Semaine 3-4** : LearningPathService + ProgressTrackingService

#### **Mois 7 : Services Éducation**
- [ ] **Semaine 1-2** : QuizService complet
- [ ] **Semaine 3-4** : CertificationService + templates PDF

#### **Mois 8 : Controllers + Frontend**
- [ ] **Semaine 1-2** : Nouveaux controllers éducation
- [ ] **Semaine 3-4** : Frontend composants premium

---

## 🔄 **PHASE 4 : SERVICES INTÉGRATION AVANCÉE**
*Timeline : Mois 10-12 post-MVP | Priorité : MOYENNE*

### **📊 Résumé Phase 4**
- **Objectif** : Robustesse enterprise + expansion africaine
- **Impact** : Rétention clients + mobile money
- **Complexité** : Haute (intégrations externes)
- **ROI attendu** : +50% rétention, marché africain

### **🗄️ Nouveau Modèle Requis (1 modèle)**

```sql
-- Migration: 005_create_backup_system.sql
CREATE TABLE backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  backup_type ENUM('full', 'incremental', 'user_data', 'media') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL, -- en bytes
  checksum VARCHAR(64) NOT NULL, -- SHA-256
  compression_ratio DECIMAL(5,2),
  backup_status ENUM('in_progress', 'completed', 'failed', 'corrupted') DEFAULT 'in_progress',
  error_message TEXT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  retention_until TIMESTAMP NOT NULL,
  created_by INTEGER REFERENCES users(id),
  
  INDEX idx_backup_status (backup_status),
  INDEX idx_backup_type (backup_type),
  INDEX idx_retention (retention_until),
  INDEX idx_completion (completed_at)
);
```

### **⚙️ Services Intégration (5 services)**

#### **1. MobileMoneyService**
```javascript
// services/integration/MobileMoneyService.js
class MobileMoneyService {
  /**
   * Traitement paiement Orange Money
   */
  static async orangeMoneyPayment(amount, phoneNumber, currency = 'XOF') {
    try {
      const orangeAPI = {
        url: process.env.ORANGE_MONEY_API_URL,
        clientId: process.env.ORANGE_MONEY_CLIENT_ID,
        clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET
      };
      
      // Obtenir le token d'accès
      const accessToken = await this.getOrangeAccessToken(orangeAPI);
      
      // Initier le paiement
      const paymentRequest = {
        amount: amount,
        currency: currency,
        order_id: this.generateOrderId(),
        customer_msisdn: phoneNumber,
        merchant_msisdn: process.env.ORANGE_MONEY_MERCHANT_NUMBER,
        description: 'Abonnement WolofDict',
        callback_url: `${process.env.API_URL}/webhooks/orange-money`
      };
      
      const response = await fetch(`${orangeAPI.url}/payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentRequest)
      });
      
      const result = await response.json();
      
      LoggerService.info('Orange Money payment initiated', {
        order_id: paymentRequest.order_id,
        amount: amount,
        phone: phoneNumber
      });
      
      return {
        success: true,
        transaction_id: result.transaction_id,
        order_id: paymentRequest.order_id,
        status: 'pending',
        payment_url: result.payment_url
      };
      
    } catch (error) {
      LoggerService.error('Orange Money payment failed', error);
      throw new Error('Erreur lors du paiement Orange Money');
    }
  }

  /**
   * Traitement paiement Wave
   */
  static async wavePayment(amount, phoneNumber) {
    try {
      const waveAPI = {
        url: process.env.WAVE_API_URL,
        apiKey: process.env.WAVE_API_KEY,
        merchantId: process.env.WAVE_MERCHANT_ID
      };
      
      const paymentRequest = {
        amount: amount,
        currency: 'XOF',
        customer_phone: phoneNumber,
        merchant_id: waveAPI.merchantId,
        reference: this.generateOrderId(),
        description: 'Paiement WolofDict',
        webhook_url: `${process.env.API_URL}/webhooks/wave`
      };
      
      const response = await fetch(`${waveAPI.url}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${waveAPI.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentRequest)
      });
      
      const result = await response.json();
      
      return {
        success: true,
        transaction_id: result.id,
        order_id: paymentRequest.reference,
        status: 'pending',
        ussd_code: result.ussd_code
      };
      
    } catch (error) {
      LoggerService.error('Wave payment failed', error);
      throw new Error('Erreur lors du paiement Wave');
    }
  }

  /**
   * Traitement paiement Moov Money
   */
  static async moovMoneyPayment(amount, phoneNumber) {
    try {
      const moovAPI = {
        url: process.env.MOOV_MONEY_API_URL,
        merchantCode: process.env.MOOV_MERCHANT_CODE,
        secretKey: process.env.MOOV_SECRET_KEY
      };
      
      const transactionRef = this.generateOrderId();
      const signature = this.generateMoovSignature(transactionRef, amount, moovAPI.secretKey);
      
      const paymentRequest = {
        amount: amount,
        currency: 'XOF',
        customer_phone: phoneNumber,
        merchant_code: moovAPI.merchantCode,
        transaction_ref: transactionRef,
        signature: signature,
        callback_url: `${process.env.API_URL}/webhooks/moov-money`
      };
      
      const response = await fetch(`${moovAPI.url}/payment/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentRequest)
      });
      
      const result = await response.json();
      
      return {
        success: true,
        transaction_id: result.transaction_id,
        order_id: transactionRef,
        status: 'pending',
        ussd_code: result.ussd_code
      };
      
    } catch (error) {
      LoggerService.error('Moov Money payment failed', error);
      throw new Error('Erreur lors du paiement Moov Money');
    }
  }

  /**
   * Vérification du statut d'un paiement mobile money
   */
  static async checkPaymentStatus(provider, transactionId) {
    switch (provider) {
      case 'orange': return await this.checkOrangePaymentStatus(transactionId);
      case 'wave': return await this.checkWavePaymentStatus(transactionId);
      case 'moov': return await this.checkMoovPaymentStatus(transactionId);
      default: throw new Error('Provider not supported');
    }
  }

  /**
   * Génère un ID de commande unique
   */
  static generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `WF${timestamp}${random}`;
  }

  /**
   * Génère la signature pour Moov Money
   */
  static generateMoovSignature(transactionRef, amount, secretKey) {
    const crypto = require('crypto');
    const data = `${transactionRef}${amount}${secretKey}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
```

#### **2. WebhookService**
```javascript
// services/integration/WebhookService.js
class WebhookService {
  /**
   * Enregistre un webhook
   */
  static async registerWebhook(url, events, secret = null) {
    const webhooks = this.getWebhooksStore();
    
    const webhook = {
      id: this.generateWebhookId(),
      url: url,
      events: events,
      secret: secret,
      active: true,
      created_at: new Date(),
      last_triggered: null,
      success_count: 0,
      failure_count: 0
    };
    
    webhooks.push(webhook);
    await this.saveWebhooksStore(webhooks);
    
    LoggerService.info('Webhook registered', {
      webhook_id: webhook.id,
      url: url,
      events: events
    });
    
    return webhook;
  }

  /**
   * Déclenche un webhook pour un événement
   */
  static async triggerWebhook(eventType, data) {
    const webhooks = this.getWebhooksStore();
    const relevantWebhooks = webhooks.filter(w => 
      w.active && w.events.includes(eventType)
    );
    
    const results = [];
    
    for (const webhook of relevantWebhooks) {
      try {
        const payload = {
          event: eventType,
          data: data,
          timestamp: new Date().toISOString(),
          webhook_id: webhook.id
        };
        
        const signature = webhook.secret ? 
          this.generateSignature(payload, webhook.secret) : null;
        
        const headers = {
          'Content-Type': 'application/json',
          'User-Agent': 'WolofDict-Webhook/1.0'
        };
        
        if (signature) {
          headers['X-WolofDict-Signature'] = signature;
        }
        
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
          timeout: 10000
        });
        
        if (response.ok) {
          webhook.success_count++;
          webhook.last_triggered = new Date();
          
          results.push({
            webhook_id: webhook.id,
            success: true,
            status_code: response.status
          });
        } else {
          webhook.failure_count++;
          results.push({
            webhook_id: webhook.id,
            success: false,
            status_code: response.status,
            error: `HTTP ${response.status}`
          });
        }
        
      } catch (error) {
        webhook.failure_count++;
        results.push({
          webhook_id: webhook.id,
          success: false,
          error: error.message
        });
      }
    }
    
    await this.saveWebhooksStore(webhooks);
    return results;
  }

  /**
   * Valide la signature d'un webhook
   */
  static validateSignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return signature === expectedSignature;
  }

  /**
   * Génère une signature HMAC
   */
  static generateSignature(payload, secret) {
    const crypto = require('crypto');
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
  }
}
```

#### **3. SyncService**
```javascript
// services/integration/SyncService.js
class SyncService {
  /**
   * Synchronise les données utilisateur vers le cloud
   */
  static async syncToCloud(userId, dataType = 'all') {
    try {
      const userData = await this.getUserData(userId, dataType);
      const cloudResult = await this.uploadToCloud(userId, userData);
      
      await this.updateLastSyncTime(userId, dataType);
      
      LoggerService.info('Data synced to cloud', {
        user_id: userId,
        data_type: dataType,
        size: JSON.stringify(userData).length
      });
      
      return {
        success: true,
        synced_at: new Date(),
        data_size: JSON.stringify(userData).length,
        cloud_id: cloudResult.id
      };
      
    } catch (error) {
      LoggerService.error('Sync to cloud failed', {
        user_id: userId,
        data_type: dataType,
        error: error.message
      });
      
      throw new Error('Échec de la synchronisation');
    }
  }

  /**
   * Récupère les données depuis le cloud
   */
  static async syncFromCloud(userId, dataType = 'all') {
    try {
      const cloudData = await this.downloadFromCloud(userId, dataType);
      const localData = await this.getUserData(userId, dataType);
      
      const mergedData = await this.resolveConflicts(localData, cloudData);
      await this.updateUserData(userId, mergedData, dataType);
      
      return {
        success: true,
        synced_at: new Date(),
        conflicts_resolved: mergedData.conflicts?.length || 0,
        updated_items: mergedData.updated_items
      };
      
    } catch (error) {
      LoggerService.error('Sync from cloud failed', error);
      throw new Error('Échec de la récupération des données');
    }
  }

  /**
   * Résout les conflits entre données locales et cloud
   */
  static async resolveConflicts(localData, cloudData) {
    const conflicts = [];
    const mergedData = { ...localData };
    
    for (const [key, cloudValue] of Object.entries(cloudData)) {
      const localValue = localData[key];
      
      if (!localValue) {
        mergedData[key] = cloudValue;
      } else if (localValue.updated_at && cloudValue.updated_at) {
        if (new Date(cloudValue.updated_at) > new Date(localValue.updated_at)) {
          mergedData[key] = cloudValue;
          conflicts.push({
            key: key,
            resolution: 'cloud_newer',
            local_timestamp: localValue.updated_at,
            cloud_timestamp: cloudValue.updated_at
          });
        }
      }
    }
    
    return {
      ...mergedData,
      conflicts: conflicts,
      updated_items: Object.keys(mergedData).length
    };
  }
}
```

#### **4. BackupService**
```javascript
// services/integration/BackupService.js
class BackupService {
  /**
   * Crée une sauvegarde
   */
  static async createBackup(backupType = 'incremental') {
    const { Backup } = require('../../models');
    
    try {
      const backup = await Backup.create({
        backup_type: backupType,
        file_path: '',
        file_size: 0,
        checksum: '',
        backup_status: 'in_progress',
        retention_until: this.calculateRetentionDate(backupType)
      });
      
      let backupResult;
      switch (backupType) {
        case 'full':
          backupResult = await this.createFullBackup(backup.id);
          break;
        case 'incremental':
          backupResult = await this.createIncrementalBackup(backup.id);
          break;
        case 'user_data':
          backupResult = await this.createUserDataBackup(backup.id);
          break;
        case 'media':
          backupResult = await this.createMediaBackup(backup.id);
          break;
        default:
          throw new Error('Type de sauvegarde non supporté');
      }
      
      await backup.update({
        file_path: backupResult.filePath,
        file_size: backupResult.fileSize,
        checksum: backupResult.checksum,
        compression_ratio: backupResult.compressionRatio,
        backup_status: 'completed',
        completed_at: new Date()
      });
      
      LoggerService.info('Backup created successfully', {
        backup_id: backup.id,
        type: backupType,
        size: backupResult.fileSize
      });
      
      return backup;
      
    } catch (error) {
      LoggerService.error('Backup creation failed', error);
      throw new Error('Échec de la création de sauvegarde');
    }
  }

  /**
   * Restaure une sauvegarde
   */
  static async restoreBackup(backupId, restoreOptions = {}) {
    const { Backup } = require('../../models');
    
    const backup = await Backup.findByPk(backupId);
    if (!backup) {
      throw new Error('Sauvegarde introuvable');
    }
    
    try {
      const isValid = await this.verifyBackupIntegrity(backup);
      if (!isValid) {
        throw new Error('Sauvegarde corrompue');
      }
      
      let restoreResult;
      switch (backup.backup_type) {
        case 'full':
          restoreResult = await this.restoreFullBackup(backup, restoreOptions);
          break;
        case 'incremental':
          restoreResult = await this.restoreIncrementalBackup(backup, restoreOptions);
          break;
        case 'user_data':
          restoreResult = await this.restoreUserDataBackup(backup, restoreOptions);
          break;
        case 'media':
          restoreResult = await this.restoreMediaBackup(backup, restoreOptions);
          break;
      }
      
      LoggerService.info('Backup restored successfully', {
        backup_id: backupId,
        type: backup.backup_type,
        restored_items: restoreResult.restoredItems
      });
      
      return {
        success: true,
        backup: backup,
        restored_items: restoreResult.restoredItems,
        restored_at: new Date()
      };
      
    } catch (error) {
      LoggerService.error('Backup restoration failed', error);
      throw new Error('Échec de la restauration');
    }
  }

  /**
   * Planifie les sauvegardes automatiques
   */
  static scheduleBackups() {
    const cron = require('node-cron');
    
    // Sauvegarde incrémentale quotidienne à 2h du matin
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.createBackup('incremental');
        LoggerService.info('Scheduled incremental backup completed');
      } catch (error) {
        LoggerService.error('Scheduled incremental backup failed', error);
      }
    });
    
    // Sauvegarde complète hebdomadaire le dimanche à 1h du matin
    cron.schedule('0 1 * * 0', async () => {
      try {
        await this.createBackup('full');
        LoggerService.info('Scheduled full backup completed');
      } catch (error) {
        LoggerService.error('Scheduled full backup failed', error);
      }
    });
    
    LoggerService.info('Backup schedules initialized');
  }

  /**
   * Calcule la date de rétention
   */
  static calculateRetentionDate(backupType) {
    const now = new Date();
    const retentionDays = {
      'full': 90,        // 3 mois
      'incremental': 30, // 1 mois
      'user_data': 60,   // 2 mois
      'media': 180       // 6 mois
    };
    
    const days = retentionDays[backupType] || 30;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
```

#### **5. APIGatewayService**
```javascript
// services/integration/APIGatewayService.js
class APIGatewayService {
  /**
   * Route une requête intelligemment
   */
  static async routeRequest(req, res, next) {
    try {
      const route = req.originalUrl;
      const method = req.method;
      const apiKey = req.headers['x-api-key'];
      
      const routeInfo = this.analyzeRoute(route, method);
      
      // Vérification des limites de taux
      const rateLimitResult = await this.checkRateLimit(req, routeInfo);
      if (!rateLimitResult.allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retry_after: rateLimitResult.retryAfter
        });
      }
      
      // Logging de l'utilisation API
      await this.logAPIUsage(req, routeInfo);
      
      // Application des politiques de sécurité
      const securityCheck = await this.applySecurityPolicies(req, routeInfo);
      if (!securityCheck.passed) {
        return res.status(403).json({
          error: 'Security policy violation',
          details: securityCheck.reason
        });
      }
      
      LoggerService.info('Request routed', {
        route: route,
        method: method,
        user_id: req.user?.id,
        api_key: apiKey ? 'present' : 'absent'
      });
      
      next();
      
    } catch (error) {
      LoggerService.error('Request routing failed', error);
      res.status(500).json({ error: 'Internal routing error' });
    }
  }

  /**
   * Applique les limites de taux selon le plan utilisateur
   */
  static async applyRateLimit(userId, endpoint) {
    const { SubscriptionService, RedisService } = require('../');
    
    const userSubscription = await SubscriptionService.getUserSubscription(userId);
    const plan = userSubscription?.plan || { slug: 'free' };
    
    const rateLimits = this.getRateLimits(plan.slug, endpoint);
    const key = `rate_limit:${userId}:${endpoint}`;
    
    const currentCount = await RedisService.get(key) || 0;
    
    if (currentCount >= rateLimits.max) {
      return {
        allowed: false,
        current: currentCount,
        max: rateLimits.max,
        resetTime: rateLimits.window
      };
    }
    
    await RedisService.increment(key, rateLimits.window);
    
    return {
      allowed: true,
      current: currentCount + 1,
      max: rateLimits.max,
      remaining: rateLimits.max - currentCount - 1
    };
  }

  /**
   * Obtient les limites de taux selon le plan
   */
  static getRateLimits(planSlug, endpoint) {
    const planLimits = {
      free: {
        '/api/search': { max: 100, window: 3600 },
        '/api/words': { max: 200, window: 3600 },
        default: { max: 50, window: 3600 }
      },
      premium: {
        '/api/search': { max: 1000, window: 3600 },
        '/api/words': { max: 2000, window: 3600 },
        default: { max: 500, window: 3600 }
      },
      pro: {
        '/api/search': { max: 10000, window: 3600 },
        '/api/words': { max: 20000, window: 3600 },
        default: { max: 5000, window: 3600 }
      }
    };
    
    const limits = planLimits[planSlug] || planLimits.free;
    return limits[endpoint] || limits.default;
  }
}
```

### **📋 Plan d'Implémentation Phase 4**

#### **Mois 10 : Mobile Money + Backup**
- [ ] **Semaine 1-2** : MobileMoneyService (Orange, Wave, Moov)
- [ ] **Semaine 3-4** : BackupService + migrations

#### **Mois 11 : Synchronisation + Webhooks**
- [ ] **Semaine 1-2** : SyncService complet
- [ ] **Semaine 3-4** : WebhookService + intégrations

#### **Mois 12 : API Gateway + Tests**
- [ ] **Semaine 1-2** : APIGatewayService
- [ ] **Semaine 3-4** : Tests d'intégration + déploiement

---

## 📊 **MATRICE DE PRIORITÉS GLOBALE**

### **🔥 Priorité CRITIQUE (Développer en premier)**
| Extension | Phase | Impact Business | Délai | Ressources |
|-----------|-------|-----------------|-------|------------|
| **WolofTransliterationService** | 2 | Différenciation unique | 2 sem | 1 dev |
| **WolofPronunciationService** | 2 | Valeur premium | 3 sem | 1 dev senior |
| **LearningPathService** | 3 | Conversion freemium | 4 sem | 2 dev |
| **QuizService** | 3 | Engagement | 3 sem | 1 dev |
| **MobileMoneyService** | 4 | Marché africain | 3 sem | 1 dev |

### **🟡 Priorité MOYENNE (Développer après critiques)**
| Extension | Phase | Impact Business | Délai | Ressources |
|-----------|-------|-----------------|-------|------------|
| **WolofDialectService** | 2 | Richesse contenu | 2 sem | 1 dev |
| **ProgressTrackingService** | 3 | Rétention | 2 sem | 1 dev |
| **BackupService** | 4 | Fiabilité | 2 sem | 1 dev |
| **SyncService** | 4 | Expérience mobile | 4 sem | 1 dev senior |

### **🟢 Priorité BASSE (Développer en dernier)**
| Extension | Phase | Impact Business | Délai | Ressources |
|-----------|-------|-----------------|-------|------------|
| **WolofGrammarService** | 2 | Fonctionnalité avancée | 4 sem | 1 dev senior |
| **CertificationService** | 3 | Monétisation B2B | 6 sem | 2 dev |
| **WebhookService** | 4 | Intégrations B2B | 1 sem | 1 dev |
| **APIGatewayService** | 4 | Performance API | 5 sem | 1 dev senior |

---

## 🎯 **RECOMMANDATIONS STRATÉGIQUES**

### **📈 Stratégie de Développement Optimale**

#### **1. MVP + Services Wolof (Mois 1-4)**
```
Focus : Différenciation unique
✅ Lancer MVP avec architecture actuelle
🌍 Ajouter services wolof critiques (translitération + phonétique)
📊 Objectif : 5K utilisateurs, 300 premium
💰 Revenue : 7,500€/mois
```

#### **2. Services Éducation Premium (Mois 6-8)**
```
Focus : Monétisation freemium
🎓 Parcours d'apprentissage + Quiz
🏆 Achievements + Gamification
📊 Objectif : 15K utilisateurs, 1,500 premium
💰 Revenue : 45,000€/mois
```

#### **3. Services Intégration Sélective (Mois 10-12)**
```
Focus : Expansion africaine + Robustesse
💰 Mobile Money (Orange, Wave, Moov)
💾 Backup automatique
📊 Objectif : 50K utilisateurs, 5K premium
💰 Revenue : 150,000€/mois
```

### **💡 Optimisations Recommandées**

#### **Phase 2 : Focus Différenciation**
- Développer **translitération + phonétique** en priorité
- Reporter **dialectes + grammaire** si ressources limitées
- Impact : 80% de la valeur avec 60% de l'effort

#### **Phase 3 : Focus Conversion**
- Développer **parcours + quiz** en priorité  
- Reporter **certification** si conversion insuffisante
- Impact : Justification claire des abonnements premium

#### **Phase 4 : Focus Sélectif**
- Développer **Mobile Money** en priorité absolue
- Reporter **API Gateway** si pas d'usage API important
- Impact : Expansion marché africain critique

---

## ✅ **CHECKLIST DE VALIDATION PAR PHASE**

### **Phase 2 - Services Wolof**
- [ ] Tests linguistiques avec locuteurs natifs
- [ ] Validation alphabet arabe par académiciens
- [ ] Performance IPA avec échantillons audio
- [ ] Intégration frontend translitération

### **Phase 3 - Services Éducation**
- [ ] Tests utilisabilité parcours d'apprentissage
- [ ] Validation pédagogique des quiz
- [ ] Tests performance avec 1000+ utilisateurs simultanés
- [ ] Intégration système de paiement pour certificats

### **Phase 4 - Services Intégration**
- [ ] Tests paiements Mobile Money en sandbox
- [ ] Validation backup/restore avec données réelles
- [ ] Tests charge API Gateway avec 10K req/minute
- [ ] Monitoring production complet

---

## 🚀 **GUIDE DE DÉMARRAGE IMMÉDIAT**

### **✅ Actions Prioritaires (Semaine 1)**
1. **Valider MVP** avec architecture actuelle
2. **Planifier Phase 2** (services wolof critiques)
3. **Recruter ressources** pour extensions
4. **Configurer environnements** de développement

### **📋 Roadmap Exécution**
```
MVP Launch      ████████████████████ (Maintenant)
Phase 2 Wolof   ░░░░████████████████ (Mois 3-4)
Phase 3 Edu     ░░░░░░░░████████████ (Mois 6-8) 
Phase 4 Int     ░░░░░░░░░░░░████████ (Mois 10-12)
```

### **🎯 Métriques de Succès**
- **MVP** : 1K utilisateurs, 50 premium, 5% conversion
- **Phase 2** : 5K utilisateurs, 300 premium, 6% conversion  
- **Phase 3** : 15K utilisateurs, 1.5K premium, 10% conversion
- **Phase 4** : 50K utilisateurs, 5K premium, 10% conversion

---

## 🎉 **CONCLUSION - ROADMAP CLAIRE POUR LE SUCCÈS**

### **🏗️ Architecture Évolutive Validée**
- **Base solide** : MVP prêt avec 45 controllers + 29 services
- **Extensions planifiées** : 13 services + 10 modèles additionnels
- **Croissance organique** : Développement selon feedback utilisateurs

### **💰 Business Case Solide**
- **Phase 2** : Différenciation unique (+500% revenus)
- **Phase 3** : Justification premium (+1000% revenus)  
- **Phase 4** : Expansion africaine (+300% revenus)

### **🚀 Prêt pour l'Exécution**
Ce guide fournit la roadmap complète pour faire évoluer WolofDict du MVP vers une plateforme enterprise leader sur le marché des langues africaines.

**Le futur de WolofDict est tracé ! 🌍✨**

---

*Document d'extension généré le : Décembre 2024*
*Version : 1.0 Future Extensions Roadmap*
*Statut : Guide complet pour phases 2, 3 & 4 post-MVP*