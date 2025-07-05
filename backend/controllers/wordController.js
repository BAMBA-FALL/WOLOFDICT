// controllers/wordController.js
const { Word, WordType, Category, Translation, Example, User } = require('../models');
const { Op } = require('sequelize');

exports.getAllWords = async (req, res) => {
  try {
    const { letter, category, type, search, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    
    // Construire les conditions de recherche
    let where = {};
    
    if (letter) {
      where.initialLetter = letter;
    }
    
    if (search) {
      where.term = { [Op.like]: `%${search}%` };
    }
    
    // Options d'inclusion
    const include = [
      {
        model: WordType,
        attributes: ['id', 'name', 'nameWolof']
      },
      {
        model: Translation,
        where: { validationStatus: 'validated' },
        required: false
      }
    ];
    
    if (category) {
      include.push({
        model: Category,
        where: { id: category },
        required: true
      });
    }
    
    if (type) {
      where.wordTypeId = type;
    }
    
    const { count, rows } = await Word.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true,
      order: [['term', 'ASC']]
    });
    
    res.json({
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      words: rows
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'An error occurred while fetching words' });
  }
};

exports.getWordById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const word = await Word.findByPk(id, {
      include: [
        {
          model: WordType,
          attributes: ['id', 'name', 'nameWolof']
        },
        {
          model: Category,
          through: { attributes: [] }
        },
        {
          model: Translation,
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username']
            }
          ]
        },
        {
          model: Example,
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'username']
            }
          ]
        },
        {
          model: Word,
          as: 'synonyms',
          through: { attributes: [] },
          attributes: ['id', 'term']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        },
        {
          model: User,
          as: 'validator',
          attributes: ['id', 'username']
        }
      ]
    });
    
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }
    
    // Incrémenter le compteur de popularité
    await word.increment('popularity');
    
    res.json(word);
  } catch (error) {
    console.error('Error fetching word:', error);
    res.status(500).json({ error: 'An error occurred while fetching the word' });
  }
};

exports.createWord = async (req, res) => {
  try {
    const {
      term,
      pronunciation,
      etymology,
      wordTypeId,
      categoryIds,
      translations,
      examples,
      dialect,
      isArchaic,
      notes
    } = req.body;
    
    // Validation
    if (!term) {
      return res.status(400).json({ error: 'Term is required' });
    }
    
    // Vérifier si le mot existe déjà
    const existingWord = await Word.findOne({ where: { term } });
    if (existingWord) {
      return res.status(409).json({ error: 'Word already exists' });
    }
    
    // Créer le mot
    const word = await Word.create({
      term,
      pronunciation,
      etymology,
      wordTypeId,
      dialect,
      isArchaic,
      notes,
      createdBy: req.user.id, // Utilisateur actuel
      validationStatus: req.user.role === 'admin' || req.user.role === 'expert' ? 'validated' : 'pending',
      validationDate: req.user.role === 'admin' || req.user.role === 'expert' ? new Date() : null,
      validatedBy: req.user.role === 'admin' || req.user.role === 'expert' ? req.user.id : null
    });
    
    // Associer les catégories
    if (categoryIds && categoryIds.length > 0) {
      await word.setCategories(categoryIds);
    }
    
    // Ajouter les traductions
    if (translations && translations.length > 0) {
      await Promise.all(translations.map(async (translation) => {
        await Translation.create({
          ...translation,
          wordId: word.id,
          createdBy: req.user.id,
          validationStatus: req.user.role === 'admin' || req.user.role === 'expert' ? 'validated' : 'pending'
        });
      }));
    }
    
    // Ajouter les exemples
    if (examples && examples.length > 0) {
      await Promise.all(examples.map(async (example) => {
        await Example.create({
          ...example,
          wordId: word.id,
          createdBy: req.user.id,
          validationStatus: req.user.role === 'admin' || req.user.role === 'expert' ? 'validated' : 'pending'
        });
      }));
    }
    
    // Récupérer le mot avec toutes ses associations
    const newWord = await Word.findByPk(word.id, {
      include: [
        { model: WordType },
        { model: Category },
        { model: Translation },
        { model: Example }
      ]
    });
    
    res.status(201).json(newWord);
  } catch (error) {
    console.error('Error creating word:', error);
    res.status(500).json({ error: 'An error occurred while creating the word' });
  }
};

exports.updateWord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      term,
      pronunciation,
      etymology,
      wordTypeId,
      categoryIds,
      dialect,
      isArchaic,
      notes
    } = req.body;
    
    // Trouver le mot
    const word = await Word.findByPk(id);
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }
    
    // Vérifier les permissions
    const isAdmin = req.user.role === 'admin';
    const isExpert = req.user.role === 'expert';
    const isCreator = word.createdBy === req.user.id;
    
    if (!isAdmin && !isExpert && !isCreator) {
      return res.status(403).json({ error: 'You do not have permission to update this word' });
    }
    
    // Mettre à jour le mot
    await word.update({
      term,
      pronunciation,
      etymology,
      wordTypeId,
      dialect,
      isArchaic,
      notes,
      // Si ce n'est pas un admin/expert qui fait la modification, reset le statut de validation
      validationStatus: (!isAdmin && !isExpert) ? 'pending' : word.validationStatus
    });
    
    // Mettre à jour les catégories
    if (categoryIds) {
      await word.setCategories(categoryIds);
    }
    
    // Récupérer le mot mis à jour avec toutes ses associations
    const updatedWord = await Word.findByPk(id, {
      include: [
        { model: WordType },
        { model: Category },
        { model: Translation },
        { model: Example }
      ]
    });
    
    res.json(updatedWord);
  } catch (error) {
    console.error('Error updating word:', error);
    res.status(500).json({ error: 'An error occurred while updating the word' });
  }
};

exports.validateWord = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    
    // Vérifier les permissions
    if (req.user.role !== 'admin' && req.user.role !== 'expert') {
      return res.status(403).json({ error: 'Only admins and experts can validate words' });
    }
    
    // Trouver le mot
    const word = await Word.findByPk(id);
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }
    
    // Mettre à jour le statut
    await word.update({
      validationStatus: status,
      validationDate: new Date(),
      validatedBy: req.user.id
    });
    
    // Enregistrer la contribution
    await Contribution.create({
      userId: req.user.id,
      wordId: id,
      action: status === 'validated' ? 'validate' : 'reject',
      entityType: 'word',
      comment
    });
    
    res.json({ message: `Word ${status}` });
  } catch (error) {
    console.error('Error validating word:', error);
    res.status(500).json({ error: 'An error occurred while validating the word' });
  }
};

exports.deleteWord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Trouver le mot
    const word = await Word.findByPk(id);
    if (!word) {
      return res.status(404).json({ error: 'Word not found' });
    }
    
    // Vérifier les permissions
    if (req.user.role !== 'admin' && word.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this word' });
    }
    
    // Supprimer le mot (soft delete grâce à paranoid: true)
    await word.destroy();
    
    res.json({ message: 'Word deleted successfully' });
  } catch (error) {
    console.error('Error deleting word:', error);
    res.status(500).json({ error: 'An error occurred while deleting the word' });
  }
};

// Autres méthodes pour gérer les statistiques, etc.