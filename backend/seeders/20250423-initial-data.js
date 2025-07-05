// seeders/20250423-initial-data.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter les types de mots
    await queryInterface.bulkInsert('WordTypes', [
      {
        name: 'Nom',
        nameWolof: 'Tur',
        description: 'Désigne une entité, une chose, une personne, etc.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Verbe',
        nameWolof: 'Jëf',
        description: 'Exprime une action, un état ou un devenir',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Adjectif',
        nameWolof: 'Làkk-tur',
        description: 'Qualifie un nom',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Adverbe',
        nameWolof: 'Làkk-jëf',
        description: 'Modifie un verbe, un adjectif ou un autre adverbe',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pronom',
        nameWolof: 'Wuutal',
        description: 'Remplace un nom',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Expression',
        nameWolof: 'Wax-ju-lépp',
        description: 'Locution ou expression figée',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Ajouter les catégories
    await queryInterface.bulkInsert('Categories', [
      {
        name: 'Politique',
        icon: 'Landmark',
        nameWolof: 'Nguur',
        color: '#3B82F6',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Religion',
        icon: 'Cross',
        nameWolof: 'Diine',
        color: '#10B981',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Culture',
        icon: 'Scroll',
        nameWolof: 'Cosaan',
        color: '#F59E0B',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Vie quotidienne',
        icon: 'Home',
        nameWolof: 'Dundu gu yaa',
        color: '#EC4899',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Langue',
        icon: 'PenTool',
        nameWolof: 'Làkk',
        color: '#8B5CF6',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // Ajouter un utilisateur admin
    await queryInterface.bulkInsert('Users', [
      {
        username: 'admin',
        email: 'admin@wolof-dictionary.com',
        password: '$2a$10$iqRIHZbHm6CdwGsYvZJsIeIJ2VwPMWRQZw1tIqJkwfaOiJnYvDV26', // 'password' hashé avec bcrypt
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('WordTypes', null, {});
  }
};