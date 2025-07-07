// =============================================================================
// 🌍 WOLOFDICT - INDEX DES SERVICES
// Point d'entrée + initialisation globale
// Généré automatiquement le 06/07/2025
// =============================================================================

const AuthService = require('./AuthService');
const EmailService = require('./EmailService');
const LoggerService = require('./LoggerService');
const SearchService = require('./SearchService');
const NotificationService = require('./NotificationService');
const RedisService = require('./RedisService');
const FileUploadService = require('./FileUploadService');
const ValidationService = require('./ValidationService');
const StripeService = require('./business/StripeService');
const PayPalService = require('./business/PayPalService');
const SubscriptionService = require('./business/SubscriptionService');
const PlanService = require('./business/PlanService');
const InvoiceService = require('./business/InvoiceService');
const AnalyticsService = require('./business/AnalyticsService');
const SMSService = require('./communication/SMSService');
const PushService = require('./communication/PushService');
const NewsletterService = require('./communication/NewsletterService');
const AudioService = require('./media/AudioService');
const ImageService = require('./media/ImageService');
const StorageService = require('./media/StorageService');
const EncryptionService = require('./utils/EncryptionService');
const DateService = require('./utils/DateService');
const SlugService = require('./utils/SlugService');
const TranslationService = require('./ai/TranslationService');
const SpeechService = require('./ai/SpeechService');
const NLPService = require('./ai/NLPService');

module.exports = {
  AuthService,
  EmailService,
  LoggerService,
  SearchService,
  NotificationService,
  RedisService,
  FileUploadService,
  ValidationService,
  StripeService,
  PayPalService,
  SubscriptionService,
  PlanService,
  InvoiceService,
  AnalyticsService,
  SMSService,
  PushService,
  NewsletterService,
  AudioService,
  ImageService,
  StorageService,
  EncryptionService,
  DateService,
  SlugService,
  TranslationService,
  SpeechService,
  NLPService
};

// =============================================================================
// 🚀 INITIALISATION GLOBALE
// =============================================================================

const initializeAllServices = async () => {
  const services = [  AuthService,   EmailService,   LoggerService,   SearchService,   NotificationService,   RedisService,   FileUploadService,   ValidationService,   StripeService,   PayPalService,   SubscriptionService,   PlanService,   InvoiceService,   AnalyticsService,   SMSService,   PushService,   NewsletterService,   AudioService,   ImageService,   StorageService,   EncryptionService,   DateService,   SlugService,   TranslationService,   SpeechService,   NLPService];
  const results = [];
  let successCount = 0;

  console.log('🔧 Initialisation de ' + services.length + ' services...');

  for (const service of services) {
    try {
      if (service && typeof service.initialize === 'function') {
        await service.initialize();
        results.push({ service: service.name, status: 'success' });
        successCount++;
      } else {
        results.push({ service: service.name, status: 'skipped', reason: 'No initialize method' });
      }
    } catch (error) {
      results.push({ service: service.name, status: 'error', error: error.message });
    }
  }

  console.log('✅ ' + successCount + '/' + services.length + ' services initialisés avec succès');
  return results;
};

const getServiceStatus = () => {
  const services = [  AuthService,   EmailService,   LoggerService,   SearchService,   NotificationService,   RedisService,   FileUploadService,   ValidationService,   StripeService,   PayPalService,   SubscriptionService,   PlanService,   InvoiceService,   AnalyticsService,   SMSService,   PushService,   NewsletterService,   AudioService,   ImageService,   StorageService,   EncryptionService,   DateService,   SlugService,   TranslationService,   SpeechService,   NLPService];
  return services.map(service => ({
    name: service.name || 'Unknown',
    initialized: service.isInitialized || false,
    hasInitialize: typeof service.initialize === 'function'
  }));
};

const shutdownAllServices = async () => {
  const services = [  AuthService,   EmailService,   LoggerService,   SearchService,   NotificationService,   RedisService,   FileUploadService,   ValidationService,   StripeService,   PayPalService,   SubscriptionService,   PlanService,   InvoiceService,   AnalyticsService,   SMSService,   PushService,   NewsletterService,   AudioService,   ImageService,   StorageService,   EncryptionService,   DateService,   SlugService,   TranslationService,   SpeechService,   NLPService];
  const results = [];

  for (const service of services) {
    try {
      if (service && typeof service.cleanup === 'function') {
        await service.cleanup();
        results.push({ service: service.name, status: 'cleaned' });
      }
    } catch (error) {
      results.push({ service: service.name, status: 'error', error: error.message });
    }
  }

  return results;
};

module.exports.initializeAllServices = initializeAllServices;
module.exports.getServiceStatus = getServiceStatus;
module.exports.shutdownAllServices = shutdownAllServices;
