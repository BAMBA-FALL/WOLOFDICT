// scripts/initDatabase.js
require('dotenv').config();
const { sequelize } = require('../models');
const { User, WordType, Category, Word, Translation } = require('../models');
const bcrypt = require('bcrypt');
const WOLOF_DICTIONARY = require('../data/dictionary');

async function initDatabase() {
  try {
    // Synchroniser la base de données
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Créer un utilisateur admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@wolof-dictionary.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });
    console.log('Admin user created');

    // Créer les types de mots
    const wordTypes = await WordType.bulkCreate([
      {
        name: 'Nom',
        nameWolof: 'Tur',
        description: 'Désigne une entité, une chose, une personne, etc.'
      },
      {
        name: 'Verbe',
        nameWolof: 'Jëf',
        description: 'Exprime une action, un état ou un devenir'
      },
      {
        name: 'Adjectif',
        nameWolof: 'Làkk-tur',
        description: 'Qualifie un nom'
      },
      {
        name: 'Adverbe',
        nameWolof: 'Làkk-jëf',
        description: 'Modifie un verbe, un adjectif ou un autre adverbe'
      },
      {
        name: 'Pronom',
        nameWolof: 'Wuutal',
        description: 'Remplace un nom'
      },
      {
        name: 'Expression',
        nameWolof: 'Wax-ju-lépp',
        description: 'Locution ou expression figée'
      }
    ]);
    console.log('Word types created');

    // Créer les catégories
    const categories = await Category.bulkCreate([
      {
        name: 'Politique',
        icon: 'Landmark',
        nameWolof: 'Nguur',
        color: '#3B82F6'
      },
      {
        name: 'Religion',
        icon: 'Cross',
        nameWolof: 'Diine',
        color: '#10B981'
      },
      {
        name: 'Culture',
        icon: 'Scroll',
        nameWolof: 'Cosaan',
        color: '#F59E0B'
      },
      {
        name: 'Vie quotidienne',
        icon: 'Home',
        nameWolof: 'Dundu gu yaa',
        color: '#EC4899'
      },
      {
        name: 'Langue',
        icon: 'PenTool',
        nameWolof: 'Làkk',
        color: '#8B5CF6'
      }
    ]);
    console.log('Categories created');

    // Ajouter des mots et traductions depuis le dictionnaire
    const verbeType = wordTypes.find(type => type.name === 'Verbe');
    const nomType = wordTypes.find(type => type.name === 'Nom');
    const vieQuotidienneCategory = categories.find(cat => cat.name === 'Vie quotidienne');
    const langueCategory = categories.find(cat => cat.name === 'Langue');

    // Importer les mots depuis le dictionnaire
    let importedCount = 0;
    for (const [term, translation] of Object.entries(WOLOF_DICTIONARY)) {
      try {
        // Déterminer le type de mot (simplifié)
        const isVerb = term.endsWith('r') || translation.startsWith('être') || translation.startsWith('avoir');
        const wordTypeId = isVerb ? verbeType.id : nomType.id;
        
        // Déterminer la lettre initiale
        let initialLetter = term.charAt(0).toUpperCase();
        if (term.toUpperCase().startsWith('NG') && !term.startsWith('ŋ')) {
          initialLetter = 'NG';
        }
        
        // Créer le mot
        const word = await Word.create({
          term,
          initialLetter,
          wordTypeId,
          createdBy: admin.id,
          validationStatus: 'validated',
          validatedBy: admin.id,
          validationDate: new Date()
        });
        
        // Ajouter la catégorie
        await word.addCategory(isVerb ? langueCategory : vieQuotidienneCategory);
        
        // Ajouter la traduction
        await Translation.create({
          wordId: word.id,
          text: translation,
          isPrimary: true,
          createdBy: admin.id,
          validationStatus: 'validated'
        });
        
        importedCount++;
      } catch (error) {
        console.error(`Error importing word "${term}":`, error);
      }
    }
    
    console.log(`${importedCount} words imported from dictionary`);
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    process.exit();
  }
}

initDatabase();