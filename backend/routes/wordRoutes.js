// routes/wordRoutes.js
const express = require('express');
const router = express.Router();
const wordController = require('../controllers/wordController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/', wordController.getAllWords);
router.get('/:id', wordController.getWordById);
router.get('/letter/:letter', wordController.getWordsByLetter);
router.get('/stats', wordController.getWordStats);

// Routes protégées (nécessitent authentification)
router.post('/', authenticate, wordController.createWord);
router.put('/:id', authenticate, wordController.updateWord);
router.delete('/:id', authenticate, wordController.deleteWord);

// Routes pour validation (admin et expert uniquement)
router.put('/:id/validate', authenticate, authorize(['admin', 'expert']), wordController.validateWord);
router.get('/pending', authenticate, authorize(['admin', 'expert']), wordController.getPendingWords);

module.exports = router;