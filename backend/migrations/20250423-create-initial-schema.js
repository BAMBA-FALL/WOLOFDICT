// migrations/20250423-create-initial-schema.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer la table des utilisateurs
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('admin', 'expert', 'contributor', 'user'),
        defaultValue: 'user'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      speciality: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Créer la table des types de mots
    await queryInterface.createTable('WordTypes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      nameWolof: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Créer la table des catégories
    await queryInterface.createTable('Categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      icon: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      nameWolof: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(7),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Créer la table des mots
    await queryInterface.createTable('Words', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      term: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      pronunciation: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      initialLetter: {
        type: Sequelize.STRING(2),
        allowNull: false
      },
      etymology: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      validationStatus: {
        type: Sequelize.ENUM('pending', 'validated', 'rejected'),
        defaultValue: 'pending'
      },
      validationDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      popularity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      dialect: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      isArchaic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      audioUrl: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      wordTypeId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'WordTypes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      validatedBy: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Créer les autres tables...
    // (Translations, Conjugations, Examples, etc.)

    // Table de jonction pour WordCategories
    await queryInterface.createTable('WordCategories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      wordId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Words',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      categoryId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Table de jonction pour les synonymes
    await queryInterface.createTable('Synonyms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      wordId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Words',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      synonymId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Words',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false
      },
      strength: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        comment: 'Force de la relation synonymique (1-10)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les tables dans l'ordre inverse
    await queryInterface.dropTable('Synonyms');
    await queryInterface.dropTable('WordCategories');
    await queryInterface.dropTable('Contributions');
    await queryInterface.dropTable('Conjugations');
    await queryInterface.dropTable('Examples');
    await queryInterface.dropTable('Translations');
    await queryInterface.dropTable('Words');
    await queryInterface.dropTable('Categories');
    await queryInterface.dropTable('WordTypes');
    await queryInterface.dropTable('Users');
  }
};