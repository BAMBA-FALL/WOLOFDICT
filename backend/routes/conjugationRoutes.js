// routes/conjugationRoutes.js
const express = require('express');
const router = express.Router();
const conjugationController = require('../controllers/conjugationController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/word/:wordId', conjugationController.getConjugationsForWord);
router.get('/word/:wordId/template', conjugationController.getBulkConjugationTemplate);

// Routes protégées
router.post('/word/:wordId', authenticate, conjugationController.addConjugation);
router.post('/word/:wordId/bulk', authenticate, conjugationController.addBulkConjugations);
router.put('/:id', authenticate, conjugationController.updateConjugation);
router.delete('/:id', authenticate, conjugationController.deleteConjugation);
router.put('/:id/validate', authenticate, authorize(['admin', 'expert']), conjugationController.validateConjugation);

module.exports = router;