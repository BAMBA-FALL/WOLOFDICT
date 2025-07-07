// =============================================================================
// 📄 middleware/validation.js - MIDDLEWARES DE VALIDATION
// =============================================================================

const { body, param, query } = require('express-validator');

class ValidationMiddleware {
  /**
   * Validation pour le login
   */
  static validateLogin() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Mot de passe requis (min 6 caractères)')
    ];
  }

  /**
   * Validation pour l'inscription
   */
  static validateRegister() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
      body('password')
        .isLength({ min: 6 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Mot de passe trop faible (min 6 chars, 1 maj, 1 min, 1 chiffre)'),
      body('firstName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Prénom invalide'),
      body('lastName')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Nom invalide'),
      body('phoneNumber')
        .optional()
        .isMobilePhone('any')
        .withMessage('Numéro de téléphone invalide'),
      body('acceptTerms')
        .equals('true')
        .withMessage('Acceptation des conditions requise')
    ];
  }

  /**
   * Validation pour la réinitialisation de mot de passe
   */
  static validatePasswordReset() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide')
    ];
  }

  /**
   * Validation pour le nouveau mot de passe
   */
  static validateNewPassword() {
    return [
      body('token')
        .notEmpty()
        .withMessage('Token requis'),
      body('newPassword')
        .isLength({ min: 6 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Mot de passe trop faible (min 6 chars, 1 maj, 1 min, 1 chiffre)')
    ];
  }

  /**
   * Validation pour le changement de mot de passe
   */
  static validateChangePassword() {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Mot de passe actuel requis'),
      body('newPassword')
        .isLength({ min: 6 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Nouveau mot de passe trop faible'),
      body('confirmPassword')
        .custom((value, { req }) => {
          if (value !== req.body.newPassword) {
            throw new Error('Confirmation de mot de passe incorrecte');
          }
          return true;
        })
    ];
  }

  /**
   * Validation pour ID numérique
   */
  static validateId(paramName = 'id') {
    return [
      param(paramName)
        .isNumeric()
        .withMessage(`${paramName} doit être un nombre`)
    ];
  }

  /**
   * Validation pour pagination
   */
  static validatePagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page doit être un entier positif'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit doit être entre 1 et 100')
    ];
  }
}

module.exports = ValidationMiddleware;