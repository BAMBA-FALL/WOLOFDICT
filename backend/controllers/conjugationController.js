// controllers/conjugationController.js
const { Conjugation, Word, User } = require('../models');

exports.getConjugationsForWord = async (req, res) => {
  try {
    const { wordId } = req.params;
    
    const conjugations = await Conjugation.findAll({
      where: { wordId },
      order: [
        ['tense', 'ASC'],
        ['person', 'ASC']
      ]
    });
    
    res.json(conjugations);
  } catch (error) {
    console.error('Error fetching conjugations:', error);
    res.status(500).json({ error: 'An error occurred while fetching conjugations' });
  }
};

// controllers/conjugationController.js (suite)
exports.addConjugation = async (req, res) => {
    try {
      const { wordId } = req.params;
      const { tense, person, form, isRegular, aspect, mood } = req.body;
      
      // Vérifier si le mot existe
      const word = await Word.findByPk(wordId);
      if (!word) {
        return res.status(404).json({ error: 'Word not found' });
      }
      
      // Vérifier si la conjugaison existe déjà
      const existingConjugation = await Conjugation.findOne({
        where: { wordId, tense, person }
      });
      
      if (existingConjugation) {
        return res.status(409).json({ error: 'This conjugation already exists for this word' });
      }
      
      // Créer la conjugaison
      const conjugation = await Conjugation.create({
        wordId,
        tense,
        person,
        form,
        isRegular,
        aspect,
        mood,
        createdBy: req.user.id,
        validationStatus: req.user.role === 'admin' || req.user.role === 'expert' ? 'validated' : 'pending'
      });
      
      res.status(201).json(conjugation);
    } catch (error) {
      console.error('Error adding conjugation:', error);
      res.status(500).json({ error: 'An error occurred while adding the conjugation' });
    }
  };
  
  exports.updateConjugation = async (req, res) => {
    try {
      const { id } = req.params;
      const { tense, person, form, isRegular, aspect, mood } = req.body;
      
      // Trouver la conjugaison
      const conjugation = await Conjugation.findByPk(id);
      if (!conjugation) {
        return res.status(404).json({ error: 'Conjugation not found' });
      }
      
      // Vérifier les permissions
      if (req.user.role !== 'admin' && req.user.role !== 'expert' && conjugation.createdBy !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to update this conjugation' });
      }
      
      // Mettre à jour la conjugaison
      await conjugation.update({
        tense,
        person,
        form,
        isRegular,
        aspect,
        mood,
        validationStatus: req.user.role === 'admin' || req.user.role === 'expert' ? 'validated' : 'pending'
      });
      
      res.json(conjugation);
    } catch (error) {
      console.error('Error updating conjugation:', error);
      res.status(500).json({ error: 'An error occurred while updating the conjugation' });
    }
  };
  
  exports.deleteConjugation = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Trouver la conjugaison
      const conjugation = await Conjugation.findByPk(id);
      if (!conjugation) {
        return res.status(404).json({ error: 'Conjugation not found' });
      }
      
      // Vérifier les permissions
      if (req.user.role !== 'admin' && conjugation.createdBy !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this conjugation' });
      }
      
      // Supprimer la conjugaison
      await conjugation.destroy();
      
      res.json({ message: 'Conjugation deleted successfully' });
    } catch (error) {
      console.error('Error deleting conjugation:', error);
      res.status(500).json({ error: 'An error occurred while deleting the conjugation' });
    }
  };
  
  exports.validateConjugation = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;
      
      // Vérifier les permissions
      if (req.user.role !== 'admin' && req.user.role !== 'expert') {
        return res.status(403).json({ error: 'Only admins and experts can validate conjugations' });
      }
      
      // Trouver la conjugaison
      const conjugation = await Conjugation.findByPk(id);
      if (!conjugation) {
        return res.status(404).json({ error: 'Conjugation not found' });
      }
      
      // Mettre à jour le statut
      await conjugation.update({
        validationStatus: status,
        validatedBy: req.user.id
      });
      
      // Enregistrer la contribution
      await Contribution.create({
        userId: req.user.id,
        conjugationId: id,
        action: status === 'validated' ? 'validate' : 'reject',
        entityType: 'conjugation',
        comment
      });
      
      res.json({ message: `Conjugation ${status}` });
    } catch (error) {
      console.error('Error validating conjugation:', error);
      res.status(500).json({ error: 'An error occurred while validating the conjugation' });
    }
  };
  
  exports.getBulkConjugationTemplate = async (req, res) => {
    try {
      const { wordId } = req.params;
      
      // Trouver le mot
      const word = await Word.findByPk(wordId);
      if (!word) {
        return res.status(404).json({ error: 'Word not found' });
      }
      
      // Vérifier si c'est un verbe
      const wordType = await word.getWordType();
      if (!wordType || wordType.name !== 'Verbe') {
        return res.status(400).json({ error: 'Only verbs can have conjugations' });
      }
      
      // Créer un modèle de conjugaison en wolof avec les temps et les personnes courantes
      const template = {
        term: word.term,
        conjugations: [
          // Présent
          { tense: 'present', person: '1sg', form: '' },
          { tense: 'present', person: '2sg', form: '' },
          { tense: 'present', person: '3sg', form: '' },
          { tense: 'present', person: '1pl', form: '' },
          { tense: 'present', person: '2pl', form: '' },
          { tense: 'present', person: '3pl', form: '' },
          // Passé
          { tense: 'past', person: '1sg', form: '' },
          { tense: 'past', person: '2sg', form: '' },
          { tense: 'past', person: '3sg', form: '' },
          { tense: 'past', person: '1pl', form: '' },
          { tense: 'past', person: '2pl', form: '' },
          { tense: 'past', person: '3pl', form: '' },
          // Futur
          { tense: 'future', person: '1sg', form: '' },
          { tense: 'future', person: '2sg', form: '' },
          { tense: 'future', person: '3sg', form: '' },
          { tense: 'future', person: '1pl', form: '' },
          { tense: 'future', person: '2pl', form: '' },
          { tense: 'future', person: '3pl', form: '' }
        ]
      };
      
      res.json(template);
    } catch (error) {
      console.error('Error creating conjugation template:', error);
      res.status(500).json({ error: 'An error occurred while creating the conjugation template' });
    }
  };
  
  exports.addBulkConjugations = async (req, res) => {
    try {
      const { wordId } = req.params;
      const { conjugations } = req.body;
      
      // Vérifier si le mot existe
      const word = await Word.findByPk(wordId);
      if (!word) {
        return res.status(404).json({ error: 'Word not found' });
      }
      
      // Vérifier si les conjugaisons sont valides
      if (!conjugations || !Array.isArray(conjugations) || conjugations.length === 0) {
        return res.status(400).json({ error: 'Invalid conjugations data' });
      }
      
      // Créer les conjugaisons en masse
      const createdConjugations = await Promise.all(
        conjugations
          .filter(conj => conj.form && conj.form.trim() !== '') // Ignorer les formes vides
          .map(async conj => {
            try {
              // Vérifier si la conjugaison existe déjà
              const existing = await Conjugation.findOne({
                where: {
                  wordId,
                  tense: conj.tense,
                  person: conj.person
                }
              });
              
              if (existing) {
                // Mettre à jour si elle existe
                await existing.update({
                  form: conj.form,
                  isRegular: conj.isRegular || true,
                  aspect: conj.aspect || null,
                  mood: conj.mood || null,
                  validationStatus: req.user.role === 'admin' || req.user.role === 'expert' ? 'validated' : 'pending'
                });
                return existing;
              } else {
                // Créer si elle n'existe pas
                return await Conjugation.create({
                  wordId,
                  tense: conj.tense,
                  person: conj.person,
                  form: conj.form,
                  isRegular: conj.isRegular || true,
                  aspect: conj.aspect || null,
                  mood: conj.mood || null,
                  createdBy: req.user.id,
                  validationStatus: req.user.role === 'admin' || req.user.role === 'expert' ? 'validated' : 'pending'
                });
              }
            } catch (error) {
              console.error(`Error creating conjugation for ${conj.tense} ${conj.person}:`, error);
              return null;
            }
          })
      );
      
      // Filtrer les nulls (conjugaisons qui n'ont pas pu être créées)
      const validConjugations = createdConjugations.filter(conj => conj !== null);
      
      res.status(201).json({
        success: true,
        message: `${validConjugations.length} conjugaisons ajoutées/modifiées`,
        conjugations: validConjugations
      });
    } catch (error) {
      console.error('Error adding bulk conjugations:', error);
      res.status(500).json({ error: 'An error occurred while adding the conjugations' });
    }
  };