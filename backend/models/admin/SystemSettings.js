// models/admin/SystemSettings.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9_]+$/,
      len: [3, 100]
    },
    comment: 'Clé unique du paramètre'
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Valeur du paramètre (JSON si complexe)'
  },
  default_value: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Valeur par défaut'
  },
  data_type: {
    type: DataTypes.ENUM('string', 'integer', 'float', 'boolean', 'json', 'text'),
    allowNull: false,
    defaultValue: 'string',
    comment: 'Type de données de la valeur'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'general',
    comment: 'Catégorie du paramètre'
  },
  section: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Sous-section dans la catégorie'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Titre affiché dans l\'interface'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description du paramètre'
  },
  help_text: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Texte d\'aide pour l\'utilisateur'
  },
  validation_rules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Règles de validation (min, max, regex, etc.)'
  },
  options: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Options disponibles pour les listes déroulantes'
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Visible publiquement via API'
  },
  is_editable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Peut être modifié via l\'interface'
  },
  requires_restart: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Nécessite un redémarrage du serveur'
  },
  is_sensitive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Information sensible (mots de passe, clés API)'
  },
  environment: {
    type: DataTypes.ENUM('all', 'development', 'staging', 'production'),
    allowNull: false,
    defaultValue: 'all',
    comment: 'Environnement où le paramètre s\'applique'
  },
  display_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Ordre d\'affichage dans l\'interface'
  },
  updated_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Dernier utilisateur à avoir modifié'
  },
  last_validated: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière validation de la valeur'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Métadonnées supplémentaires'
  }
}, {
  tableName: 'system_settings',
  indexes: [
    { fields: ['key'] },
    { fields: ['category'] },
    { fields: ['section'] },
    { fields: ['is_public'] },
    { fields: ['is_editable'] },
    { fields: ['environment'] },
    { fields: ['display_order'] },
    { fields: ['updated_by'] },
    {
      name: 'settings_category_order',
      fields: ['category', 'section', 'display_order']
    }
  ]
});

// ========================================
// MÉTHODES D'INSTANCE
// ========================================

SystemSettings.prototype.getValue = function() {
  if (!this.value) return this.getDefaultValue();
  
  switch (this.data_type) {
    case 'boolean':
      return this.value === 'true' || this.value === '1';
    case 'integer':
      return parseInt(this.value);
    case 'float':
      return parseFloat(this.value);
    case 'json':
      try {
        return JSON.parse(this.value);
      } catch (e) {
        return this.getDefaultValue();
      }
    default:
      return this.value;
  }
};

SystemSettings.prototype.getDefaultValue = function() {
  if (!this.default_value) return null;
  
  switch (this.data_type) {
    case 'boolean':
      return this.default_value === 'true' || this.default_value === '1';
    case 'integer':
      return parseInt(this.default_value);
    case 'float':
      return parseFloat(this.default_value);
    case 'json':
      try {
        return JSON.parse(this.default_value);
      } catch (e) {
        return null;
      }
    default:
      return this.default_value;
  }
};

SystemSettings.prototype.setValue = function(newValue, updatedBy = null) {
  let stringValue;
  
  switch (this.data_type) {
    case 'boolean':
      stringValue = newValue ? 'true' : 'false';
      break;
    case 'json':
      stringValue = JSON.stringify(newValue);
      break;
    default:
      stringValue = String(newValue);
  }
  
  this.value = stringValue;
  this.updated_by = updatedBy;
  this.last_validated = new Date();
  
  return this.save(['value', 'updated_by', 'last_validated']);
};

SystemSettings.prototype.validate = function(value) {
  if (!this.validation_rules) return { isValid: true };
  
  const rules = this.validation_rules;
  const errors = [];
  
  // Validation selon le type
  switch (this.data_type) {
    case 'integer':
      if (isNaN(parseInt(value))) {
        errors.push('La valeur doit être un nombre entier');
      } else {
        const intValue = parseInt(value);
        if (rules.min !== undefined && intValue < rules.min) {
          errors.push(`La valeur doit être supérieure ou égale à ${rules.min}`);
        }
        if (rules.max !== undefined && intValue > rules.max) {
          errors.push(`La valeur doit être inférieure ou égale à ${rules.max}`);
        }
      }
      break;
      
    case 'float':
      if (isNaN(parseFloat(value))) {
        errors.push('La valeur doit être un nombre');
      } else {
        const floatValue = parseFloat(value);
        if (rules.min !== undefined && floatValue < rules.min) {
          errors.push(`La valeur doit être supérieure ou égale à ${rules.min}`);
        }
        if (rules.max !== undefined && floatValue > rules.max) {
          errors.push(`La valeur doit être inférieure ou égale à ${rules.max}`);
        }
      }
      break;
      
    case 'string':
    case 'text':
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`La valeur doit contenir au moins ${rules.minLength} caractères`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`La valeur ne peut pas dépasser ${rules.maxLength} caractères`);
      }
      if (rules.regex && !new RegExp(rules.regex).test(value)) {
        errors.push('Le format de la valeur n\'est pas valide');
      }
      break;
      
    case 'json':
      try {
        JSON.parse(value);
      } catch (e) {
        errors.push('La valeur doit être un JSON valide');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

SystemSettings.prototype.reset = function() {
  this.value = this.default_value;
  return this.save(['value']);
};

// ========================================
// MÉTHODES DE CLASSE - CRUD DE BASE
// ========================================

SystemSettings.get = async function(key, defaultValue = null) {
  const setting = await this.findOne({ where: { key } });
  
  if (!setting) {
    return defaultValue;
  }
  
  return setting.getValue();
};

SystemSettings.set = async function(key, value, updatedBy = null) {
  const setting = await this.findOne({ where: { key } });
  
  if (!setting) {
    throw new Error(`Paramètre '${key}' non trouvé`);
  }
  
  if (!setting.is_editable) {
    throw new Error(`Paramètre '${key}' non modifiable`);
  }
  
  const validation = setting.validate(value);
  if (!validation.isValid) {
    throw new Error(`Validation échouée: ${validation.errors.join(', ')}`);
  }
  
  await setting.setValue(value, updatedBy);
  return setting;
};

SystemSettings.createSetting = async function(settingData) {
  // Vérifier que la clé n'existe pas déjà
  const existing = await this.findOne({ where: { key: settingData.key } });
  if (existing) {
    throw new Error(`Paramètre avec la clé '${settingData.key}' existe déjà`);
  }
  
  return await this.create(settingData);
};

// ========================================
// MÉTHODES DE RECHERCHE ET FILTRAGE
// ========================================

SystemSettings.getByCategory = function(category, section = null) {
  const where = { category };
  if (section) {
    where.section = section;
  }
  
  return this.findAll({
    where,
    order: [['display_order', 'ASC'], ['title', 'ASC']]
  });
};

SystemSettings.getPublicSettings = function() {
  return this.findAll({
    where: { 
      is_public: true,
      environment: ['all', process.env.NODE_ENV || 'development']
    },
    attributes: ['key', 'value', 'data_type', 'title', 'description'],
    order: [['category', 'ASC'], ['display_order', 'ASC']]
  });
};

SystemSettings.getEnvironmentSettings = function(environment) {
  return this.findAll({
    where: {
      environment: [environment, 'all']
    },
    order: [['category', 'ASC'], ['section', 'ASC'], ['display_order', 'ASC']]
  });
};

SystemSettings.searchSettings = function(query) {
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      [Op.or]: [
        { key: { [Op.like]: `%${query}%` } },
        { title: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } }
      ]
    },
    order: [['category', 'ASC'], ['title', 'ASC']]
  });
};

SystemSettings.getSecuritySettings = function() {
  return this.findAll({
    where: { category: 'security' },
    order: [['section', 'ASC'], ['display_order', 'ASC']]
  });
};

SystemSettings.getRequiringRestart = function() {
  return this.findAll({
    where: { requires_restart: true },
    attributes: ['key', 'title', 'value', 'updated_at']
  });
};

SystemSettings.getChangedSettings = function(since = null) {
  const { Op } = require('sequelize');
  
  const whereClause = {};
  
  if (since) {
    whereClause.updated_at = {
      [Op.gte]: since
    };
  }
  
  return this.findAll({
    where: whereClause,
    order: [['updated_at', 'DESC']],
    include: [{
      model: require('../user/User'),
      as: 'updatedBy',
      attributes: ['id', 'username', 'first_name', 'last_name'],
      required: false
    }]
  });
};

// ========================================
// MÉTHODES DE VALIDATION
// ========================================

SystemSettings.validateAllSettings = async function() {
  const settings = await this.findAll({
    where: { is_editable: true }
  });
  
  const results = [];
  
  for (const setting of settings) {
    const validation = setting.validate(setting.value || setting.default_value);
    results.push({
      key: setting.key,
      title: setting.title,
      isValid: validation.isValid,
      errors: validation.errors || [],
      current_value: setting.getValue(),
      default_value: setting.getDefaultValue()
    });
  }
  
  return results;
};

SystemSettings.scheduleValidation = async function() {
  // Cette méthode pourrait être appelée par un cron job
  // pour valider périodiquement tous les paramètres
  const settings = await this.findAll({
    where: {
      is_editable: true,
      last_validated: {
        [require('sequelize').Op.or]: [
          null,
          { [require('sequelize').Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        ]
      }
    }
  });
  
  const results = [];
  
  for (const setting of settings) {
    const validation = setting.validate(setting.value);
    
    if (!validation.isValid) {
      // Alerte pour paramètre invalide
      results.push({
        key: setting.key,
        title: setting.title,
        status: 'invalid',
        errors: validation.errors
      });
    } else {
      setting.last_validated = new Date();
      await setting.save(['last_validated']);
      
      results.push({
        key: setting.key,
        status: 'valid'
      });
    }
  }
  
  return results;
};

// ========================================
// MÉTHODES DE GESTION EN LOT
// ========================================

SystemSettings.bulkUpdate = async function(updates, updatedBy) {
  const transaction = await sequelize.transaction();
  const results = [];
  
  try {
    for (const update of updates) {
      const setting = await this.findOne({
        where: { key: update.key },
        transaction
      });
      
      if (!setting) {
        results.push({
          key: update.key,
          success: false,
          error: 'Paramètre non trouvé'
        });
        continue;
      }
      
      if (!setting.is_editable) {
        results.push({
          key: update.key,
          success: false,
          error: 'Paramètre non modifiable'
        });
        continue;
      }
      
      const validation = setting.validate(update.value);
      if (!validation.isValid) {
        results.push({
          key: update.key,
          success: false,
          error: `Validation échouée: ${validation.errors.join(', ')}`
        });
        continue;
      }
      
      await setting.setValue(update.value, updatedBy);
      results.push({
        key: update.key,
        success: true,
        old_value: setting.getValue(),
        new_value: update.value
      });
    }
    
    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

SystemSettings.resetToDefaults = async function(keys = null) {
  const where = { is_editable: true };
  if (keys && Array.isArray(keys)) {
    where.key = { [require('sequelize').Op.in]: keys };
  }
  
  const settings = await this.findAll({ where });
  const results = [];
  
  for (const setting of settings) {
    try {
      await setting.reset();
      results.push({
        key: setting.key,
        success: true,
        reset_to: setting.getDefaultValue()
      });
    } catch (error) {
      results.push({
        key: setting.key,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

// ========================================
// MÉTHODES D'IMPORT/EXPORT ET SAUVEGARDE
// ========================================

SystemSettings.backup = async function() {
  const settings = await this.findAll({
    attributes: ['key', 'value', 'category', 'section']
  });
  
  return {
    timestamp: new Date().toISOString(),
    settings: settings.map(s => ({
      key: s.key,
      value: s.value,
      category: s.category,
      section: s.section
    }))
  };
};

SystemSettings.restore = async function(backupData) {
  const transaction = await sequelize.transaction();
  
  try {
    for (const settingData of backupData.settings) {
      const setting = await this.findOne({ 
        where: { key: settingData.key },
        transaction 
      });
      
      if (setting && setting.is_editable) {
        await setting.update({ value: settingData.value }, { transaction });
      }
    }
    
    await transaction.commit();
    return true;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

SystemSettings.exportSettings = async function(category = null, environment = null) {
  const where = {};
  
  if (category) {
    where.category = category;
  }
  
  if (environment) {
    where.environment = [environment, 'all'];
  }
  
  const settings = await this.findAll({
    where,
    attributes: [
      'key', 'value', 'default_value', 'data_type', 
      'category', 'section', 'title', 'description',
      'validation_rules', 'is_public', 'environment'
    ],
    order: [['category', 'ASC'], ['section', 'ASC'], ['display_order', 'ASC']]
  });
  
  return {
    export_date: new Date().toISOString(),
    category,
    environment,
    settings: settings.map(s => ({
      key: s.key,
      value: s.is_sensitive ? '[HIDDEN]' : s.value,
      default_value: s.default_value,
      data_type: s.data_type,
      category: s.category,
      section: s.section,
      title: s.title,
      description: s.description,
      validation_rules: s.validation_rules,
      is_public: s.is_public,
      environment: s.environment
    }))
  };
};

SystemSettings.importSettings = async function(importData, updatedBy = null, overwrite = false) {
  const transaction = await sequelize.transaction();
  const results = [];
  
  try {
    for (const settingData of importData.settings) {
      const existing = await this.findOne({
        where: { key: settingData.key },
        transaction
      });
      
      if (existing) {
        if (overwrite && existing.is_editable) {
          await existing.setValue(settingData.value, updatedBy);
          results.push({
            key: settingData.key,
            action: 'updated',
            success: true
          });
        } else {
          results.push({
            key: settingData.key,
            action: 'skipped',
            success: true,
            reason: existing.is_editable ? 'already_exists' : 'not_editable'
          });
        }
      } else {
        // Créer un nouveau paramètre
        await this.create({
          ...settingData,
          created_by: updatedBy,
          updated_by: updatedBy
        }, { transaction });
        
        results.push({
          key: settingData.key,
          action: 'created',
          success: true
        });
      }
    }
    
    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// ========================================
// MÉTHODES D'INITIALISATION ET MIGRATION
// ========================================

SystemSettings.initializeDefaults = async function() {
  const defaultSettings = [
    // Paramètres généraux
    {
      key: 'site_name',
      value: 'WolofDict',
      title: 'Nom du site',
      description: 'Nom affiché du site web',
      category: 'general',
      section: 'identity',
      data_type: 'string',
      is_public: true,
      display_order: 1
    },
    {
      key: 'site_description',
      value: 'Dictionnaire collaboratif de la langue wolof',
      title: 'Description du site',
      description: 'Description courte du site',
      category: 'general',
      section: 'identity',
      data_type: 'text',
      is_public: true,
      display_order: 2
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      default_value: 'false',
      title: 'Mode maintenance',
      description: 'Activer le mode maintenance',
      category: 'general',
      section: 'status',
      data_type: 'boolean',
      requires_restart: false,
      display_order: 10
    },
    
    // Paramètres d'inscription
    {
      key: 'registration_enabled',
      value: 'true',
      default_value: 'true',
      title: 'Inscription ouverte',
      description: 'Permettre aux nouveaux utilisateurs de s\'inscrire',
      category: 'users',
      section: 'registration',
      data_type: 'boolean',
      display_order: 1
    },
    {
      key: 'email_verification_required',
      value: 'true',
      default_value: 'true',
      title: 'Vérification email obligatoire',
      description: 'Exiger la vérification de l\'email pour l\'inscription',
      category: 'users',
      section: 'registration',
      data_type: 'boolean',
      display_order: 2
    },
    
    // Paramètres de contenu
    {
      key: 'content_auto_approval',
      value: 'false',
      default_value: 'false',
      title: 'Approbation automatique du contenu',
      description: 'Approuver automatiquement le nouveau contenu',
      category: 'content',
      section: 'moderation',
      data_type: 'boolean',
      display_order: 1
    },
    {
      key: 'max_words_per_day',
      value: '10',
      default_value: '10',
      title: 'Mots maximum par jour',
      description: 'Nombre maximum de mots qu\'un utilisateur peut ajouter par jour',
      category: 'content',
      section: 'limits',
      data_type: 'integer',
      validation_rules: JSON.stringify({ min: 1, max: 100 }),
      display_order: 1
    },
    
    // Paramètres d'email
    {
      key: 'smtp_host',
      value: '',
      title: 'Serveur SMTP',
      description: 'Adresse du serveur SMTP',
      category: 'email',
      section: 'smtp',
      data_type: 'string',
      is_sensitive: true,
      display_order: 1
    },
    {
      key: 'smtp_port',
      value: '587',
      default_value: '587',
      title: 'Port SMTP',
      description: 'Port du serveur SMTP',
      category: 'email',
      section: 'smtp',
      data_type: 'integer',
      validation_rules: JSON.stringify({ min: 1, max: 65535 }),
      display_order: 2
    },
    
    // Paramètres de sécurité
    {
      key: 'session_timeout',
      value: '1440',
      default_value: '1440',
      title: 'Durée de session (minutes)',
      description: 'Durée d\'inactivité avant déconnexion automatique',
      category: 'security',
      section: 'authentication',
      data_type: 'integer',
      validation_rules: JSON.stringify({ min: 5, max: 10080 }),
      display_order: 1
    },
    {
      key: 'max_login_attempts',
      value: '5',
      default_value: '5',
      title: 'Tentatives de connexion maximum',
      description: 'Nombre maximum de tentatives de connexion avant blocage',
      category: 'security',
      section: 'authentication',
      data_type: 'integer',
      validation_rules: JSON.stringify({ min: 3, max: 20 }),
      display_order: 2
    },
    
    // Paramètres d'API
    {
      key: 'api_rate_limit',
      value: '1000',
      default_value: '1000',
      title: 'Limite de taux API (par heure)',
      description: 'Nombre maximum de requêtes API par heure',
      category: 'api',
      section: 'limits',
      data_type: 'integer',
      validation_rules: JSON.stringify({ min: 100, max: 10000 }),
      display_order: 1
    }
  ];
  
  for (const setting of defaultSettings) {
    const existing = await this.findOne({ where: { key: setting.key } });
    if (!existing) {
      await this.create(setting);
    }
  }
  
  console.log('✅ Paramètres système initialisés');
};

SystemSettings.migrateFromEnv = async function() {
  // Migrer les variables d'environnement vers la base de données
  const envMappings = {
    'DB_HOST': { key: 'database_host', category: 'database' },
    'DB_PORT': { key: 'database_port', category: 'database', data_type: 'integer' },
    'SMTP_HOST': { key: 'smtp_host', category: 'email' },
    'SMTP_PORT': { key: 'smtp_port', category: 'email', data_type: 'integer' },
    'API_RATE_LIMIT': { key: 'api_rate_limit', category: 'api', data_type: 'integer' },
    'SESSION_TIMEOUT': { key: 'session_timeout', category: 'security', data_type: 'integer' }
  };
  
  const results = [];
  
  for (const [envVar, config] of Object.entries(envMappings)) {
    const envValue = process.env[envVar];
    
    if (envValue) {
      const existing = await this.findOne({ where: { key: config.key } });
      
      if (!existing) {
        await this.create({
          key: config.key,
          value: envValue,
          data_type: config.data_type || 'string',
          category: config.category,
          title: `Migré depuis ${envVar}`,
          description: `Valeur migrée automatiquement depuis la variable d'environnement ${envVar}`,
          is_editable: true
        });
        
        results.push({
          env_var: envVar,
          key: config.key,
          action: 'migrated'
        });
      }
    }
  }
  
  return results;
};

// ========================================
// MÉTHODES UTILITAIRES
// ========================================

SystemSettings.createCategory = async function(categoryData) {
  // Utilitaire pour créer une nouvelle catégorie de paramètres
  const { name, description, icon, display_order } = categoryData;
  
  // Vérifier si la catégorie existe déjà
  const existing = await this.findOne({
    where: { category: name }
  });
  
  if (existing) {
    throw new Error(`La catégorie '${name}' existe déjà`);
  }
  
  // Créer un paramètre de métadonnées pour la catégorie
  return await this.create({
    key: `_category_${name}`,
    value: JSON.stringify({
      description,
      icon,
      display_order: display_order || 0
    }),
    data_type: 'json',
    category: '_system',
    section: 'categories',
    title: `Métadonnées de la catégorie ${name}`,
    description: `Configuration de la catégorie ${name}`,
    is_editable: false,
    is_public: false
  });
};

module.exports = SystemSettings;