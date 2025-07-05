// models/integration/ExternalIntegration.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const ExternalIntegration = sequelize.define('ExternalIntegration', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 100]
    },
    comment: 'Nom unique de l\'intégration'
  },
  service_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Nom du service externe'
  },
  service_type: {
    type: DataTypes.ENUM(
      'translation', 'tts', 'stt', 'nlp', 'analytics', 
      'notification', 'storage', 'cdn', 'payment',
      'social_media', 'email', 'sms', 'webhook'
    ),
    allowNull: false,
    comment: 'Type de service'
  },
  provider: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Fournisseur du service (Google, AWS, etc.)'
  },
  version: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Version de l\'API utilisée'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description de l\'intégration'
  },
  api_endpoint: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      isUrl: true
    },
    comment: 'URL de base de l\'API'
  },
  api_documentation_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'URL de la documentation API'
  },
  authentication_type: {
    type: DataTypes.ENUM('api_key', 'oauth2', 'bearer_token', 'basic_auth', 'jwt', 'none'),
    allowNull: false,
    defaultValue: 'api_key',
    comment: 'Type d\'authentification'
  },
  credentials: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Informations d\'authentification (chiffrées)'
  },
  configuration: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Configuration spécifique à l\'intégration'
  },
  default_settings: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Paramètres par défaut pour les requêtes'
  },
  rate_limit: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Limites de taux { requests_per_minute, requests_per_hour, requests_per_day }'
  },
  timeout_seconds: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 30,
    comment: 'Timeout des requêtes en secondes'
  },
  retry_attempts: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 3,
    comment: 'Nombre de tentatives en cas d\'échec'
  },
  retry_delay_seconds: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: 'Délai entre les tentatives en secondes'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_production_ready: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Prêt pour la production'
  },
  environment: {
    type: DataTypes.ENUM('development', 'staging', 'production', 'all'),
    allowNull: false,
    defaultValue: 'development',
    comment: 'Environnement d\'utilisation'
  },
  health_check_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'URL de vérification de santé'
  },
  health_check_interval: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 300,
    comment: 'Intervalle de vérification de santé en secondes'
  },
  last_health_check: {
    type: DataTypes.DATE,
    allowNull: true
  },
  health_status: {
    type: DataTypes.ENUM('healthy', 'degraded', 'unhealthy', 'unknown'),
    allowNull: false,
    defaultValue: 'unknown'
  },
  error_threshold: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.05,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Seuil d\'erreur acceptable (0.05 = 5%)'
  },
  usage_statistics: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      average_response_time: 0
    },
    comment: 'Statistiques d\'utilisation'
  },
  last_sync: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière synchronisation'
  },
  sync_frequency: {
    type: DataTypes.ENUM('realtime', 'minutely', 'hourly', 'daily', 'weekly', 'manual'),
    allowNull: false,
    defaultValue: 'manual',
    comment: 'Fréquence de synchronisation'
  },
  webhook_endpoints: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Points de terminaison webhook pour recevoir des notifications'
  },
  supported_features: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Fonctionnalités supportées par cette intégration'
  },
  data_mapping: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Mapping des champs de données'
  },
  fallback_integration_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'external_integrations',
      key: 'id'
    },
    comment: 'Intégration de secours en cas d\'échec'
  },
  priority: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: 'Priorité d\'utilisation (1 = plus haute)'
  },
  cost_per_request: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    comment: 'Coût par requête (pour suivi budgétaire)'
  },
  monthly_budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Budget mensuel alloué'
  },
  current_month_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Coût du mois en cours'
  },
  alerts_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Alertes activées'
  },
  alert_thresholds: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Seuils d\'alerte pour différentes métriques'
  },
  maintenance_window: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Fenêtre de maintenance programmée'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Tags pour organisation et filtrage'
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'external_integrations',
  indexes: [
    { fields: ['name'] },
    { fields: ['service_name'] },
    { fields: ['service_type'] },
    { fields: ['provider'] },
    { fields: ['is_active'] },
    { fields: ['environment'] },
    { fields: ['health_status'] },
    { fields: ['priority'] },
    { fields: ['last_health_check'] },
    { fields: ['last_sync'] },
    { fields: ['fallback_integration_id'] },
    {
      name: 'integration_lookup',
      fields: ['service_type', 'is_active', 'environment', 'priority']
    }
  ]
});

// Méthodes d'instance
ExternalIntegration.prototype.isHealthy = function() {
  return this.health_status === 'healthy';
};

ExternalIntegration.prototype.isAvailable = function() {
  return this.is_active && this.health_status !== 'unhealthy';
};

ExternalIntegration.prototype.checkHealth = async function() {
  if (!this.health_check_url) {
    this.health_status = 'unknown';
    this.last_health_check = new Date();
    await this.save(['health_status', 'last_health_check']);
    return this.health_status;
  }
  
  try {
    const startTime = Date.now();
    // Dans un vrai projet, utiliser axios ou fetch
    // const response = await axios.get(this.health_check_url, { timeout: this.timeout_seconds * 1000 });
    const responseTime = Date.now() - startTime;
    
    // Simulation d'une vérification réussie
    this.health_status = 'healthy';
    this.last_health_check = new Date();
    
    // Mettre à jour les statistiques
    const stats = this.usage_statistics;
    stats.average_response_time = (stats.average_response_time + responseTime) / 2;
    this.usage_statistics = stats;
    
    await this.save(['health_status', 'last_health_check', 'usage_statistics']);
    
    return this.health_status;
  } catch (error) {
    this.health_status = 'unhealthy';
    this.last_health_check = new Date();
    await this.save(['health_status', 'last_health_check']);
    
    // Ici, on pourrait déclencher une alerte
    if (this.alerts_enabled) {
      await this.sendAlert('health_check_failed', error.message);
    }
    
    return this.health_status;
  }
};

ExternalIntegration.prototype.recordRequest = async function(success = true, responseTime = 0, error = null) {
  const stats = { ...this.usage_statistics };
  
  stats.total_requests = (stats.total_requests || 0) + 1;
  
  if (success) {
    stats.successful_requests = (stats.successful_requests || 0) + 1;
  } else {
    stats.failed_requests = (stats.failed_requests || 0) + 1;
  }
  
  if (responseTime > 0) {
    stats.average_response_time = stats.average_response_time 
      ? (stats.average_response_time + responseTime) / 2 
      : responseTime;
  }
  
  // Calculer le taux d'erreur
  const errorRate = stats.failed_requests / stats.total_requests;
  
  // Vérifier si on dépasse le seuil d'erreur
  if (errorRate > this.error_threshold && this.alerts_enabled) {
    await this.sendAlert('error_threshold_exceeded', `Taux d'erreur: ${(errorRate * 100).toFixed(2)}%`);
  }
  
  // Mettre à jour le coût si défini
  if (this.cost_per_request) {
    this.current_month_cost = (this.current_month_cost || 0) + parseFloat(this.cost_per_request);
  }
  
  this.usage_statistics = stats;
  await this.save(['usage_statistics', 'current_month_cost']);
};

ExternalIntegration.prototype.resetMonthlyStats = async function() {
  this.current_month_cost = 0;
  const stats = { ...this.usage_statistics };
  stats.monthly_requests = 0;
  stats.monthly_successful = 0;
  stats.monthly_failed = 0;
  this.usage_statistics = stats;
  
  await this.save(['current_month_cost', 'usage_statistics']);
};

ExternalIntegration.prototype.sendAlert = async function(alertType, message) {
  // Dans un vrai projet, intégrer avec un service de notification
  // comme Slack, Discord, email, etc.
  console.warn(`🚨 Alerte ${this.name}: ${alertType} - ${message}`);
  
  // Ici, on pourrait créer un enregistrement d'alerte
  // const AlertLog = require('./AlertLog');
  // await AlertLog.create({
  //   integration_id: this.id,
  //   alert_type: alertType,
  //   message,
  //   severity: 'warning'
  // });
};

ExternalIntegration.prototype.sync = async function() {
  if (this.sync_frequency === 'manual') {
    throw new Error('Cette intégration nécessite une synchronisation manuelle');
  }
  
  try {
    // Logique de synchronisation spécifique à chaque type d'intégration
    // Ceci serait implémenté dans des classes spécialisées
    
    this.last_sync = new Date();
    await this.save(['last_sync']);
    
    return { success: true, message: 'Synchronisation réussie' };
  } catch (error) {
    if (this.alerts_enabled) {
      await this.sendAlert('sync_failed', error.message);
    }
    throw error;
  }
};

ExternalIntegration.prototype.getCredentials = function() {
  // Dans un vrai projet, les credentials seraient chiffrés
  // et nécessiteraient un déchiffrement sécurisé
  return this.credentials;
};

ExternalIntegration.prototype.updateCredentials = async function(newCredentials) {
  // Dans un vrai projet, chiffrer les credentials avant stockage
  this.credentials = newCredentials;
  await this.save(['credentials']);
};

ExternalIntegration.prototype.testConnection = async function() {
  try {
    // Test de connexion basique
    await this.checkHealth();
    
    // Test avec les credentials
    // const testResult = await this.makeTestRequest();
    
    return {
      success: true,
      health_status: this.health_status,
      message: 'Connexion établie avec succès'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      health_status: 'unhealthy'
    };
  }
};

// Méthodes de classe
ExternalIntegration.getByServiceType = function(serviceType, environment = null) {
  const where = { 
    service_type: serviceType, 
    is_active: true 
  };
  
  if (environment) {
    where.environment = [environment, 'all'];
  }
  
  return this.findAll({
    where,
    order: [['priority', 'ASC']],
    include: [{
      model: ExternalIntegration,
      as: 'fallbackIntegration',
      required: false
    }]
  });
};

ExternalIntegration.getPrimary = function(serviceType, environment = 'production') {
  return this.findOne({
    where: {
      service_type: serviceType,
      is_active: true,
      environment: [environment, 'all']
    },
    order: [['priority', 'ASC']]
  });
};

ExternalIntegration.checkAllHealth = async function() {
  const integrations = await this.findAll({
    where: { is_active: true }
  });
  
  const results = [];
  
  for (const integration of integrations) {
    try {
      const status = await integration.checkHealth();
      results.push({
        id: integration.id,
        name: integration.name,
        status,
        success: true
      });
    } catch (error) {
      results.push({
        id: integration.id,
        name: integration.name,
        status: 'error',
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
};

ExternalIntegration.getUnhealthyIntegrations = function() {
  return this.findAll({
    where: {
      is_active: true,
      health_status: ['degraded', 'unhealthy']
    },
    order: [['last_health_check', 'ASC']]
  });
};

ExternalIntegration.getUsageReport = function(period = 'month') {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'week':
      dateFilter = {
        updated_at: {
          [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case 'month':
      dateFilter = {
        updated_at: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
  }
  
  return this.findAll({
    where: {
      is_active: true,
      ...dateFilter
    },
    attributes: [
      'id', 'name', 'service_type', 'provider',
      'usage_statistics', 'current_month_cost',
      'health_status', 'last_health_check'
    ],
    order: [['current_month_cost', 'DESC']]
  });
};

ExternalIntegration.syncAll = async function(serviceType = null) {
  const where = {
    is_active: true,
    sync_frequency: { [require('sequelize').Op.ne]: 'manual' }
  };
  
  if (serviceType) {
    where.service_type = serviceType;
  }
  
  const integrations = await this.findAll({ where });
  const results = [];
  
  for (const integration of integrations) {
    try {
      const result = await integration.sync();
      results.push({
        id: integration.id,
        name: integration.name,
        success: true,
        ...result
      });
    } catch (error) {
      results.push({
        id: integration.id,
        name: integration.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
};

ExternalIntegration.getIntegrationsByTag = function(tag) {
  const { Op } = require('sequelize');
  
  return this.findAll({
    where: {
      is_active: true,
      tags: {
        [Op.contains]: [tag]
      }
    }
  });
};

ExternalIntegration.initializeDefaults = async function() {
  const defaultIntegrations = [
    {
      name: 'google_translate',
      service_name: 'Google Translate',
      service_type: 'translation',
      provider: 'Google Cloud',
      api_endpoint: 'https://translation.googleapis.com',
      authentication_type: 'api_key',
      configuration: {
        source_language: 'wo',
        target_languages: ['fr', 'en'],
        model: 'base'
      },
      supported_features: ['text_translation', 'language_detection'],
      tags: ['translation', 'google', 'ai']
    },
    {
      name: 'google_tts',
      service_name: 'Google Text-to-Speech',
      service_type: 'tts',
      provider: 'Google Cloud',
      api_endpoint: 'https://texttospeech.googleapis.com',
      authentication_type: 'api_key',
      configuration: {
        voice_name: 'standard',
        language_code: 'wo',
        audio_encoding: 'MP3'
      },
      supported_features: ['text_to_speech', 'voice_selection'],
      tags: ['tts', 'google', 'audio']
    }
  ];
  
  for (const integrationData of defaultIntegrations) {
    const existing = await this.findOne({ where: { name: integrationData.name } });
    if (!existing) {
      await this.create({
        ...integrationData,
        is_active: false, // Désactivé par défaut jusqu'à configuration
      });
    }
  }
  
  console.log('✅ Intégrations par défaut initialisées');
};

module.exports = ExternalIntegration;