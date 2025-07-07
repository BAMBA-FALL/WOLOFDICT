// =============================================================================
// 🌍 WOLOFDICT - VALIDATION SERVICE COMPLET
// Service de validation avec Joi + règles métier WolofDict
// =============================================================================

const logger = require('./LoggerService');

class ValidationService {
  constructor() {
    this.isInitialized = false;
    this.name = 'ValidationService';
    this.joi = null;
    this.validator = null;
    this.schemas = {};
  }

  async initialize() {
    try {
      // Charger Joi si disponible
      try {
        this.joi = require('joi');
        logger.info('Joi chargé pour validation avancée');
      } catch (error) {
        logger.warn('Joi non disponible, validation basique activée');
      }

      // Charger validator si disponible
      try {
        this.validator = require('validator');
        logger.info('Validator.js chargé pour validation complémentaire');
      } catch (error) {
        logger.warn('Validator.js non disponible');
      }

      // Initialiser les schémas de validation
      await this.initializeSchemas();
      
      this.isInitialized = true;
      logger.info('ValidationService initialisé avec succès');
      
    } catch (error) {
      logger.error('Erreur initialisation ValidationService:', error.message);
      throw error;
    }
  }

  async initializeSchemas() {
    if (!this.joi) {
      logger.warn('Schémas Joi non disponibles');
      return;
    }

    // Schéma utilisateur
    this.schemas.user = this.joi.object({
      email: this.joi.string().email().required()
        .messages({
          'string.email': 'Format email invalide',
          'any.required': 'Email obligatoire'
        }),
      password: this.joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
          'string.min': 'Mot de passe minimum 8 caractères',
          'string.pattern.base': 'Mot de passe doit contenir: minuscule, majuscule, chiffre',
          'any.required': 'Mot de passe obligatoire'
        }),
      fullName: this.joi.string().min(2).max(100).required()
        .messages({
          'string.min': 'Nom minimum 2 caractères',
          'string.max': 'Nom maximum 100 caractères',
          'any.required': 'Nom complet obligatoire'
        }),
      phoneNumber: this.joi.string().pattern(/^(\+221|221)?[0-9]{9}$/)
        .messages({
          'string.pattern.base': 'Numéro de téléphone sénégalais invalide'
        }),
      dateOfBirth: this.joi.date().max('now').iso(),
      location: this.joi.string().max(100),
      bio: this.joi.string().max(500)
    });

    // Schéma mot wolof
    this.schemas.word = this.joi.object({
      wolof: this.joi.string().min(1).max(100).required()
        .pattern(/^[a-zA-ZàáâãäåæçèéêëìíîïñòóôõöøùúûüýÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝ\s\-']+$/)
        .messages({
          'string.min': 'Mot wolof requis',
          'string.max': 'Mot wolof maximum 100 caractères',
          'string.pattern.base': 'Caractères non autorisés dans le mot wolof',
          'any.required': 'Mot wolof obligatoire'
        }),
      french: this.joi.string().min(1).max(200).required()
        .messages({
          'string.min': 'Traduction française requise',
          'string.max': 'Traduction maximum 200 caractères',
          'any.required': 'Traduction française obligatoire'
        }),
      english: this.joi.string().max(200),
      definition: this.joi.string().max(1000),
      pronunciation: this.joi.string().max(200),
      etymology: this.joi.string().max(500),
      difficulty: this.joi.string().valid('beginner', 'intermediate', 'advanced'),
      isVerified: this.joi.boolean().default(false),
      isPremium: this.joi.boolean().default(false)
    });

    // Schéma phrase
    this.schemas.phrase = this.joi.object({
      wolof: this.joi.string().min(2).max(500).required()
        .messages({
          'string.min': 'Phrase wolof minimum 2 caractères',
          'string.max': 'Phrase wolof maximum 500 caractères',
          'any.required': 'Phrase wolof obligatoire'
        }),
      french: this.joi.string().min(2).max(500).required()
        .messages({
          'string.min': 'Traduction française minimum 2 caractères',
          'string.max': 'Traduction française maximum 500 caractères',
          'any.required': 'Traduction française obligatoire'
        }),
      english: this.joi.string().max(500),
      context: this.joi.string().max(1000),
      difficulty: this.joi.string().valid('beginner', 'intermediate', 'advanced'),
      type: this.joi.string().valid('expression', 'proverb', 'greeting', 'question', 'other')
    });

    // Schéma événement
    this.schemas.event = this.joi.object({
      title: this.joi.string().min(5).max(200).required(),
      description: this.joi.string().min(10).max(2000).required(),
      startDate: this.joi.date().min('now').required(),
      endDate: this.joi.date().min(this.joi.ref('startDate')),
      location: this.joi.string().max(200),
      maxParticipants: this.joi.number().integer().min(1).max(10000),
      isOnline: this.joi.boolean().default(false),
      isPremium: this.joi.boolean().default(false),
      price: this.joi.number().min(0).max(1000000)
    });

    // Schéma commentaire
    this.schemas.comment = this.joi.object({
      content: this.joi.string().min(1).max(1000).required()
        .messages({
          'string.min': 'Commentaire requis',
          'string.max': 'Commentaire maximum 1000 caractères',
          'any.required': 'Contenu du commentaire obligatoire'
        }),
      contentType: this.joi.string().valid('word', 'phrase', 'proverb', 'event', 'project').required(),
      contentId: this.joi.number().integer().positive().required(),
      parentId: this.joi.number().integer().positive()
    });

    // Schéma post forum
    this.schemas.forumPost = this.joi.object({
      title: this.joi.string().min(5).max(200).required(),
      content: this.joi.string().min(10).max(5000).required(),
      categoryId: this.joi.number().integer().positive().required(),
      tags: this.joi.array().items(this.joi.string().max(50)).max(5)
    });

    logger.info('Schémas de validation initialisés: user, word, phrase, event, comment, forumPost');
  }

  // Validation générique
  async validate(schema, data, options = {}) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validation avec Joi si disponible
      if (this.joi && this.schemas[schema]) {
        const { error, value } = this.schemas[schema].validate(data, {
          abortEarly: false,
          allowUnknown: options.allowUnknown || false,
          stripUnknown: true
        });

        if (error) {
          const errors = error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context.value
          }));

          return {
            isValid: false,
            errors,
            data: null
          };
        }

        return {
          isValid: true,
          errors: [],
          data: value
        };
      }

      // Validation basique sans Joi
      const result = await this.basicValidation(schema, data);
      return result;

    } catch (error) {
      logger.error('Erreur validation:', error.message);
      return {
        isValid: false,
        errors: [{ field: 'general', message: 'Erreur de validation' }],
        data: null
      };
    }
  }

  // Validations spécialisées
  async validateUser(userData) {
    return this.validate('user', userData);
  }

  async validateWord(wordData) {
    return this.validate('word', wordData);
  }

  async validatePhrase(phraseData) {
    return this.validate('phrase', phraseData);
  }

  async validateEvent(eventData) {
    return this.validate('event', eventData);
  }

  async validateComment(commentData) {
    return this.validate('comment', commentData);
  }

  async validateForumPost(postData) {
    return this.validate('forumPost', postData);
  }

  // Validation basique sans Joi
  async basicValidation(schema, data) {
    const errors = [];

    switch (schema) {
      case 'user':
        if (!data.email || !this.isValidEmail(data.email)) {
          errors.push({ field: 'email', message: 'Email invalide' });
        }
        if (!data.password || data.password.length < 8) {
          errors.push({ field: 'password', message: 'Mot de passe minimum 8 caractères' });
        }
        if (!data.fullName || data.fullName.length < 2) {
          errors.push({ field: 'fullName', message: 'Nom complet requis' });
        }
        break;

      case 'word':
        if (!data.wolof || data.wolof.length < 1) {
          errors.push({ field: 'wolof', message: 'Mot wolof requis' });
        }
        if (!data.french || data.french.length < 1) {
          errors.push({ field: 'french', message: 'Traduction française requise' });
        }
        break;

      case 'phrase':
        if (!data.wolof || data.wolof.length < 2) {
          errors.push({ field: 'wolof', message: 'Phrase wolof requise' });
        }
        if (!data.french || data.french.length < 2) {
          errors.push({ field: 'french', message: 'Traduction française requise' });
        }
        break;

      default:
        errors.push({ field: 'general', message: 'Schéma de validation non trouvé' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : null
    };
  }

  // Validations utilitaires
  isValidEmail(email) {
    if (this.validator) {
      return this.validator.isEmail(email);
    }
    
    // Regex basique email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidURL(url) {
    if (this.validator) {
      return this.validator.isURL(url);
    }

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  isValidPhoneNumber(phone, country = 'SN') {
    if (country === 'SN') {
      // Format sénégalais: +221xxxxxxxxx ou 221xxxxxxxxx ou xxxxxxxxx
      const senegalRegex = /^(\+221|221)?[0-9]{9}$/;
      return senegalRegex.test(phone);
    }
    
    // Validation générique
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
  }

  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
      return input;
    }

    let sanitized = input;

    // Supprimer les espaces en début/fin
    sanitized = sanitized.trim();

    // Supprimer les caractères dangereux si demandé
    if (options.removeDangerous) {
      sanitized = sanitized.replace(/[<>'"]/g, '');
    }

    // Limiter la longueur si spécifié
    if (options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Convertir en minuscules si demandé
    if (options.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    }

    return sanitized;
  }

  validateFileUpload(file, options = {}) {
    const errors = [];
    
    if (!file) {
      errors.push({ field: 'file', message: 'Fichier requis' });
      return { isValid: false, errors };
    }

    // Vérifier la taille
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB par défaut
    if (file.size > maxSize) {
      errors.push({ 
        field: 'file', 
        message: `Fichier trop volumineux (max: ${Math.round(maxSize / 1024 / 1024)}MB)` 
      });
    }

    // Vérifier le type MIME
    if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
      errors.push({ 
        field: 'file', 
        message: `Type de fichier non autorisé. Types acceptés: ${options.allowedTypes.join(', ')}` 
      });
    }

    // Vérifier l'extension
    if (options.allowedExtensions) {
      const extension = file.originalname.split('.').pop().toLowerCase();
      if (!options.allowedExtensions.includes(extension)) {
        errors.push({ 
          field: 'file', 
          message: `Extension non autorisée. Extensions acceptées: ${options.allowedExtensions.join(', ')}`
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      file: errors.length === 0 ? file : null
    };
  }

  validatePagination(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    
    const errors = [];
    
    if (page < 1) {
      errors.push({ field: 'page', message: 'Page doit être >= 1' });
    }
    
    if (limit < 1 || limit > 100) {
      errors.push({ field: 'limit', message: 'Limit doit être entre 1 et 100' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      pagination: {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)),
        offset: (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit))
      }
    };
  }

  validatePassword(password) {
    const errors = [];
    
    if (!password) {
      errors.push({ field: 'password', message: 'Mot de passe requis' });
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push({ field: 'password', message: 'Minimum 8 caractères' });
    }

    if (!/[a-z]/.test(password)) {
      errors.push({ field: 'password', message: 'Au moins une minuscule requise' });
    }

    if (!/[A-Z]/.test(password)) {
      errors.push({ field: 'password', message: 'Au moins une majuscule requise' });
    }

    if (!/\d/.test(password)) {
      errors.push({ field: 'password', message: 'Au moins un chiffre requis' });
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push({ field: 'password', message: 'Au moins un caractère spécial requis' });
    }

    const strength = this.calculatePasswordStrength(password);

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      suggestions: this.getPasswordSuggestions(password)
    };
  }

  calculatePasswordStrength(password) {
    let score = 0;
    
    // Longueur
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Complexité
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    
    // Variété de caractères
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) score += 1;

    if (score <= 3) return 'weak';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'strong';
    return 'very_strong';
  }

  getPasswordSuggestions(password) {
    const suggestions = [];
    
    if (password.length < 12) {
      suggestions.push('Utilisez au moins 12 caractères pour plus de sécurité');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      suggestions.push('Ajoutez des caractères spéciaux (!@#$%^&*)');
    }
    
    if (password.toLowerCase() === password) {
      suggestions.push('Mélangez majuscules et minuscules');
    }
    
    // Vérifier les patterns courants
    if (/123|abc|qwerty|password/i.test(password)) {
      suggestions.push('Évitez les séquences communes (123, abc, qwerty)');
    }

    return suggestions;
  }

  validateSearchQuery(query) {
    const errors = [];
    const cleaned = this.sanitizeInput(query, { removeDangerous: true });
    
    if (!cleaned || cleaned.length < 1) {
      errors.push({ field: 'query', message: 'Recherche ne peut pas être vide' });
    }
    
    if (cleaned.length > 200) {
      errors.push({ field: 'query', message: 'Recherche trop longue (max 200 caractères)' });
    }

    // Bloquer les caractères potentiellement dangereux
    if (/[<>'"\\]/.test(cleaned)) {
      errors.push({ field: 'query', message: 'Caractères non autorisés dans la recherche' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      query: cleaned
    };
  }

  validateWolofText(text) {
    const errors = [];
    
    if (!text || text.length === 0) {
      errors.push({ field: 'wolof', message: 'Texte wolof requis' });
      return { isValid: false, errors };
    }

    // Caractères autorisés en wolof (lettres, espaces, apostrophes, tirets)
    const wolofPattern = /^[a-zA-ZàáâãäåæçèéêëìíîïñòóôõöøùúûüýÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÑÒÓÔÕÖØÙÚÛÜÝ\s\-'ëŋ]+$/;
    
    if (!wolofPattern.test(text)) {
      errors.push({ 
        field: 'wolof', 
        message: 'Caractères non autorisés. Utilisez uniquement lettres, espaces, apostrophes et tirets' 
      });
    }

    // Vérifier longueur raisonnable
    if (text.length > 1000) {
      errors.push({ field: 'wolof', message: 'Texte trop long (max 1000 caractères)' });
    }

    // Vérifier qu'il n'y a pas que des espaces
    if (text.trim().length === 0) {
      errors.push({ field: 'wolof', message: 'Le texte ne peut pas être uniquement des espaces' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      text: text.trim()
    };
  }

  validateDateRange(startDate, endDate) {
    const errors = [];
    
    if (!startDate) {
      errors.push({ field: 'startDate', message: 'Date de début requise' });
    }
    
    if (!endDate) {
      errors.push({ field: 'endDate', message: 'Date de fin requise' });
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime())) {
        errors.push({ field: 'startDate', message: 'Format de date de début invalide' });
      }
      
      if (isNaN(end.getTime())) {
        errors.push({ field: 'endDate', message: 'Format de date de fin invalide' });
      }
      
      if (start.getTime() >= end.getTime()) {
        errors.push({ field: 'dateRange', message: 'La date de fin doit être après la date de début' });
      }
      
      // Vérifier que les dates ne sont pas trop dans le futur (100 ans)
      const maxFuture = new Date();
      maxFuture.setFullYear(maxFuture.getFullYear() + 100);
      
      if (start.getTime() > maxFuture.getTime() || end.getTime() > maxFuture.getTime()) {
        errors.push({ field: 'dateRange', message: 'Dates trop éloignées dans le futur' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      dates: errors.length === 0 ? { startDate, endDate } : null
    };
  }

  // Validation de contenu pour éviter le spam
  validateContent(content, options = {}) {
    const errors = [];
    const maxLinks = options.maxLinks || 3;
    const maxCaps = options.maxCapsPercentage || 70;
    
    if (!content || content.length === 0) {
      errors.push({ field: 'content', message: 'Contenu requis' });
      return { isValid: false, errors };
    }

    // Détecter trop de liens
    const linkCount = (content.match(/https?:\/\/|www\./gi) || []).length;
    if (linkCount > maxLinks) {
      errors.push({ 
        field: 'content', 
        message: `Trop de liens détectés (max: ${maxLinks})` 
      });
    }

    // Détecter trop de majuscules
    const capsCount = (content.match(/[A-Z]/g) || []).length;
    const totalLetters = (content.match(/[a-zA-Z]/g) || []).length;
    
    if (totalLetters > 10 && (capsCount / totalLetters) * 100 > maxCaps) {
      errors.push({ 
        field: 'content', 
        message: 'Trop de majuscules (évitez de crier)' 
      });
    }

    // Détecter répétition excessive
    const words = content.toLowerCase().split(/\s+/);
    const wordCount = {};
    words.forEach(word => {
      if (word.length > 3) {
        wordCount[word] = (wordCount[word] || 0) + 1;
      }
    });
    
    const repeatedWords = Object.entries(wordCount)
      .filter(([word, count]) => count > 5)
      .map(([word]) => word);
      
    if (repeatedWords.length > 0) {
      errors.push({ 
        field: 'content', 
        message: 'Répétition excessive de mots détectée' 
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      content: errors.length === 0 ? content : null,
      stats: {
        wordCount: words.length,
        linkCount,
        capsPercentage: totalLetters > 0 ? (capsCount / totalLetters) * 100 : 0
      }
    };
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasJoi: !!this.joi,
      hasValidator: !!this.validator,
      schemasCount: Object.keys(this.schemas).length,
      availableSchemas: Object.keys(this.schemas),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ValidationService();