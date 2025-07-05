// =============================================================================
// 🔐 AUTHENTICATION & AUTHORIZATION
// =============================================================================

// controllers/auth/AuthController.js
const { 
  User, 
  UserProfile, 
  UserSession,
  Plan,           // ← NOUVEAU pour plan par défaut
  Subscription    // ← NOUVEAU pour créer abonnement gratuit
} = require('../../models');

// controllers/auth/SocialAuthController.js
const { 
  User, 
  UserProfile, 
  UserSession,
  Plan,           // ← NOUVEAU pour plan par défaut
  Subscription    // ← NOUVEAU pour créer abonnement gratuit
} = require('../../models');

// =============================================================================
// 👤 GESTION UTILISATEURS
// =============================================================================

// controllers/user/UserController.js
const { 
  User, 
  UserProfile, 
  UserSession,
  UserContribution,
  UserActivity,
  Word,
  Phrase,
  ForumTopic,
  ForumPost,
  Event,
  Project,
  Subscription,   // ← NOUVEAU pour afficher abonnements
  Payment,        // ← NOUVEAU pour historique paiements
  Plan            // ← NOUVEAU pour infos plans
} = require('../../models');

// controllers/user/UserProfileController.js
const { 
  User, 
  UserProfile,
  Image,
  UserActivity,
  Subscription,   // ← NOUVEAU pour statut premium
  Plan            // ← NOUVEAU pour limites du plan
} = require('../../models');

// controllers/user/UserSessionController.js
const { 
  User, 
  UserSession 
} = require('../../models');

// =============================================================================
// 💰 BUSINESS CONTROLLERS (NOUVEAUX)
// =============================================================================

// controllers/business/PlanController.js
const { 
  Plan,
  Subscription,
  Payment,
  User
} = require('../../models');

// controllers/business/SubscriptionController.js
const { 
  Subscription,
  Plan,
  Payment,
  User,
  UserActivity    // ← Pour tracker les changements d'abonnement
} = require('../../models');

// controllers/business/PaymentController.js
const { 
  Payment,
  Subscription,
  Plan,
  User,
  UserActivity    // ← Pour tracker les paiements
} = require('../../models');

// =============================================================================
// 📚 CONTENU LINGUISTIQUE
// =============================================================================

// controllers/content/WordController.js
const { 
  Word,
  WordExample,
  WordSynonym,
  WordVariation,
  User,
  Category,
  Tag,
  WordCategory,
  WordTag,
  AudioRecording,
  Image,
  Like,
  Favorite,
  Rating,
  Comment,
  WordUsageStats,
  Subscription,   // ← NOUVEAU pour vérifier limites plan
  Plan            // ← NOUVEAU pour accès premium
} = require('../../models');

// controllers/content/WordExampleController.js
const { 
  Word,
  WordExample,
  User,
  Subscription,   // ← NOUVEAU pour vérifier permissions
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// controllers/content/WordSynonymController.js
const { 
  Word,
  WordSynonym,
  User,
  Subscription,   // ← NOUVEAU pour vérifier permissions
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// controllers/content/WordVariationController.js
const { 
  Word,
  WordVariation,
  User,
  Subscription,   // ← NOUVEAU pour vérifier permissions
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// controllers/content/PhraseController.js
const { 
  Phrase,
  PhraseVariation,
  User,
  Category,
  Tag,
  PhraseCategory,
  PhraseTag,
  AudioRecording,
  Image,
  Like,
  Favorite,
  Rating,
  Comment,
  Subscription,   // ← NOUVEAU pour vérifier limites plan
  Plan            // ← NOUVEAU pour accès premium
} = require('../../models');

// controllers/content/PhraseVariationController.js
const { 
  Phrase,
  PhraseVariation,
  User,
  Subscription,   // ← NOUVEAU pour vérifier permissions
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// controllers/content/AlphabetController.js
const { 
  Alphabet,
  Word,
  AudioRecording,
  Subscription,   // ← NOUVEAU pour audio premium
  Plan            // ← NOUVEAU pour fonctionnalités
} = require('../../models');

// controllers/content/ProverbController.js
const { 
  Proverb,
  User,
  Category,
  Tag,
  AudioRecording,
  Image,
  Like,
  Favorite,
  Rating,
  Comment,
  Subscription,   // ← NOUVEAU pour contenu premium
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// =============================================================================
// 🏷️ CATÉGORISATION
// =============================================================================

// controllers/categorization/CategoryController.js
const { 
  Category,
  WordCategory,
  PhraseCategory,
  Word,
  Phrase,
  User,
  Subscription,   // ← NOUVEAU pour catégories premium
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// controllers/categorization/TagController.js
const { 
  Tag,
  WordTag,
  PhraseTag,
  Word,
  Phrase,
  User,
  Subscription,   // ← NOUVEAU pour tags premium
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// =============================================================================
// 🎵 MULTIMÉDIA
// =============================================================================

// controllers/media/AudioController.js
const { 
  AudioRecording,
  User,
  Word,
  Phrase,
  Proverb,
  Alphabet,
  Subscription,   // ← NOUVEAU pour audio premium
  Plan            // ← NOUVEAU pour limites qualité
} = require('../../models');

// controllers/media/ImageController.js
const { 
  Image,
  User,
  Word,
  Phrase,
  Event,
  Category,
  Subscription,   // ← NOUVEAU pour images premium
  Plan            // ← NOUVEAU pour limites upload
} = require('../../models');

// =============================================================================
// 💫 INTERACTIONS UTILISATEURS
// =============================================================================

// controllers/interaction/FavoriteController.js
const { 
  Favorite,
  User,
  Word,
  Phrase,
  Proverb,
  Event,
  Project,
  Subscription,   // ← NOUVEAU pour limite favoris
  Plan            // ← NOUVEAU pour quota
} = require('../../models');

// controllers/interaction/LikeController.js
const { 
  Like,
  User,
  Word,
  Phrase,
  Proverb,
  Comment,
  ForumPost,
  Event,
  Subscription,   // ← NOUVEAU pour limite likes
  Plan            // ← NOUVEAU pour quota
} = require('../../models');

// controllers/interaction/RatingController.js
const { 
  Rating,
  User,
  Word,
  Phrase,
  Proverb,
  AudioRecording,
  Event,
  Subscription,   // ← NOUVEAU pour système rating premium
  Plan            // ← NOUVEAU pour fonctionnalités
} = require('../../models');

// controllers/interaction/UserContributionController.js
const { 
  UserContribution,
  User,
  Word,
  Phrase,
  Proverb,
  AudioRecording,
  Image,
  ForumPost,
  Comment,
  Subscription,   // ← NOUVEAU pour récompenses premium
  Plan,           // ← NOUVEAU pour bonus
  Payment         // ← NOUVEAU pour commissions
} = require('../../models');

// =============================================================================
// 💬 COMMUNAUTÉ
// =============================================================================

// controllers/community/ForumCategoryController.js
const { 
  ForumCategory,
  ForumTopic,
  ForumPost,
  User,
  Subscription,   // ← NOUVEAU pour forums premium
  Plan            // ← NOUVEAU pour accès spécial
} = require('../../models');

// controllers/community/ForumTopicController.js
const { 
  ForumTopic,
  ForumCategory,
  ForumPost,
  User,
  Like,
  Comment,
  Subscription,   // ← NOUVEAU pour création topics premium
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// controllers/community/ForumPostController.js
const { 
  ForumPost,
  ForumTopic,
  ForumCategory,
  User,
  Like,
  Subscription,   // ← NOUVEAU pour posts premium
  Plan            // ← NOUVEAU pour quota quotidien
} = require('../../models');

// controllers/community/CommentController.js
const { 
  Comment,
  User,
  Word,
  Phrase,
  Proverb,
  Event,
  Project,
  Like,
  Subscription,   // ← NOUVEAU pour commentaires premium
  Plan            // ← NOUVEAU pour limites
} = require('../../models');

// =============================================================================
// 📅 ÉVÉNEMENTS
// =============================================================================

// controllers/event/EventCategoryController.js
const { 
  EventCategory,
  Event,
  Subscription,   // ← NOUVEAU pour événements premium
  Plan            // ← NOUVEAU pour accès VIP
} = require('../../models');

// controllers/event/EventController.js
const { 
  Event,
  EventCategory,
  EventRegistration,
  User,
  Image,
  Like,
  Favorite,
  Comment,
  Subscription,   // ← NOUVEAU pour événements premium
  Plan,           // ← NOUVEAU pour accès prioritaire
  Payment         // ← NOUVEAU pour événements payants
} = require('../../models');

// controllers/event/EventRegistrationController.js
const { 
  EventRegistration,
  Event,
  EventCategory,
  User,
  Subscription,   // ← NOUVEAU pour inscriptions premium
  Plan,           // ← NOUVEAU pour places réservées
  Payment         // ← NOUVEAU pour événements payants
} = require('../../models');

// =============================================================================
// 🚀 PROJETS
// =============================================================================

// controllers/project/ProjectController.js
const { 
  Project,
  ProjectContributor,
  User,
  Image,
  Like,
  Favorite,
  Comment,
  Subscription,   // ← NOUVEAU pour projets premium
  Plan            // ← NOUVEAU pour outils avancés
} = require('../../models');

// controllers/project/ProjectContributorController.js
const { 
  ProjectContributor,
  Project,
  User,
  Subscription,   // ← NOUVEAU pour contributors premium
  Plan            // ← NOUVEAU pour rôles avancés
} = require('../../models');

// controllers/project/SuggestionController.js
const { 
  Suggestion,
  User,
  Word,
  Phrase,
  Proverb,
  Subscription,   // ← NOUVEAU pour suggestions premium
  Plan            // ← NOUVEAU pour priorité
} = require('../../models');

// =============================================================================
// 📊 STATISTIQUES
// =============================================================================

// controllers/stats/SearchLogController.js
const { 
  SearchLog,
  User,
  Subscription,   // ← NOUVEAU pour stats premium
  Plan            // ← NOUVEAU pour analytics avancées
} = require('../../models');

// controllers/stats/UserActivityController.js
const { 
  UserActivity,
  User,
  Subscription,   // ← NOUVEAU pour tracking premium
  Plan            // ← NOUVEAU pour métriques avancées
} = require('../../models');

// controllers/stats/WordUsageStatsController.js
const { 
  WordUsageStats,
  Word,
  Subscription,   // ← NOUVEAU pour stats premium
  Plan            // ← NOUVEAU pour analytics
} = require('../../models');

// controllers/stats/DailyStatsController.js
const { 
  DailyStats,
  User,
  Word,
  Phrase,
  Event,
  ForumTopic,
  SearchLog,
  Subscription,   // ← NOUVEAU pour dashboard premium
  Plan,           // ← NOUVEAU pour métriques avancées
  Payment         // ← NOUVEAU pour stats revenus
} = require('../../models');

// =============================================================================
// 📢 COMMUNICATION
// =============================================================================

// controllers/communication/NotificationController.js
const { 
  Notification,
  User,
  Subscription,   // ← NOUVEAU pour notifications premium
  Plan            // ← NOUVEAU pour personnalisation
} = require('../../models');

// controllers/communication/NewsletterController.js
const { 
  NewsletterSubscription,
  User,
  Subscription,   // ← NOUVEAU pour contenu premium
  Plan            // ← NOUVEAU pour newsletters VIP
} = require('../../models');

// controllers/communication/AnnouncementController.js
const { 
  Announcement,
  User,
  Image,
  Subscription,   // ← NOUVEAU pour annonces premium
  Plan            // ← NOUVEAU pour ciblage
} = require('../../models');

// =============================================================================
// 🛠️ ADMINISTRATION
// =============================================================================

// controllers/admin/ModeratorActionController.js
const { 
  ModeratorAction,
  User,
  Word,
  Phrase,
  Proverb,
  ForumPost,
  Comment,
  Event,
  Subscription,   // ← NOUVEAU pour modération premium
  Plan            // ← NOUVEAU pour outils avancés
} = require('../../models');

// controllers/admin/ReportedContentController.js
const { 
  ReportedContent,
  User,
  Word,
  Phrase,
  Proverb,
  ForumPost,
  Comment,
  Event,
  Subscription,   // ← NOUVEAU pour signalements premium
  Plan            // ← NOUVEAU pour priorité
} = require('../../models');

// controllers/admin/SystemSettingsController.js
const { 
  SystemSettings,
  User,
  Plan,           // ← NOUVEAU pour gestion plans
  Subscription,   // ← NOUVEAU pour statistiques
  Payment         // ← NOUVEAU pour config paiements
} = require('../../models');

// =============================================================================
// 🔗 INTÉGRATIONS
// =============================================================================

// controllers/integration/APIKeyController.js
const { 
  APIKey,
  User,
  Subscription,   // ← NOUVEAU pour API premium
  Plan            // ← NOUVEAU pour limites API
} = require('../../models');

// controllers/integration/ExternalIntegrationController.js
const { 
  ExternalIntegration,
  User,
  Subscription,   // ← NOUVEAU pour intégrations premium
  Plan            // ← NOUVEAU pour fonctionnalités avancées
} = require('../../models');

// =============================================================================
// 🔍 RECHERCHE & NAVIGATION
// =============================================================================

// controllers/search/SearchController.js
const { 
  Word,
  Phrase,
  Proverb,
  Event,
  ForumTopic,
  User,
  Category,
  Tag,
  SearchLog,
  Subscription,   // ← NOUVEAU pour recherche premium
  Plan            // ← NOUVEAU pour résultats avancés
} = require('../../models');

// controllers/explore/ExploreController.js
const { 
  Word,
  Phrase,
  Proverb,
  Category,
  Tag,
  Event,
  User,
  Subscription,   // ← NOUVEAU pour exploration premium
  Plan            // ← NOUVEAU pour contenu exclusif
} = require('../../models');

// =============================================================================
// 📱 API MOBILE
// =============================================================================

// controllers/mobile/MobileAppController.js
const { 
  User,
  UserSession,
  Notification,
  Subscription,   // ← NOUVEAU pour app premium
  Plan            // ← NOUVEAU pour fonctionnalités mobile
} = require('../../models');

// =============================================================================
// 📈 ANALYTICS & REPORTING
// =============================================================================

// controllers/analytics/AnalyticsController.js
const { 
  User,
  Word,
  Phrase,
  Event,
  ForumTopic,
  SearchLog,
  UserActivity,
  WordUsageStats,
  DailyStats,
  Subscription,   // ← NOUVEAU pour analytics premium
  Plan,           // ← NOUVEAU pour métriques business
  Payment         // ← NOUVEAU pour revenus
} = require('../../models');

// controllers/report/ReportController.js
const { 
  User,
  Word,
  Phrase,
  Event,
  ForumTopic,
  UserContribution,
  SearchLog,
  UserActivity,
  WordUsageStats,
  DailyStats,
  Subscription,   // ← NOUVEAU pour rapports premium
  Plan,           // ← NOUVEAU pour analytics business
  Payment         // ← NOUVEAU pour rapports financiers
} = require('../../models');

// =============================================================================
// 🎯 RÉSUMÉ DES AJOUTS
// =============================================================================

/*
MODÈLES BUSINESS AJOUTÉS DANS 80%+ DES CONTROLLERS :

✅ Plan - Pour :
   - Vérifier les limites du plan utilisateur
   - Contrôler l'accès aux fonctionnalités premium
   - Afficher les options de mise à niveau
   - Gérer les quotas et restrictions

✅ Subscription - Pour :
   - Vérifier le statut d'abonnement actuel
   - Contrôler l'accès au contenu premium
   - Tracker l'usage pour facturation
   - Gérer les périodes d'essai

✅ Payment - Pour :
   - Historique des transactions
   - Gestion des échecs de paiement
   - Analytics de revenus
   - Commissions et récompenses

STRATÉGIE D'IMPLÉMENTATION :

1. 🔒 Middleware d'authentification premium
2. 🎯 Vérification des limites par plan
3. 📊 Tracking d'usage pour analytics
4. 💰 Gestion des fonctionnalités payantes
5. 🚀 Suggestions de mise à niveau contextuelle

EXEMPLE D'USAGE DANS UN CONTROLLER :

// Vérifier si l'utilisateur peut accéder à cette fonctionnalité
const userSubscription = await Subscription.findOne({
  where: { user_id: req.user.id, status: 'active' },
  include: [{ model: Plan, as: 'plan' }]
});

if (!userSubscription?.plan?.features?.advanced_search) {
  return res.status(403).json({
    error: 'Cette fonctionnalité nécessite un abonnement Premium',
    upgrade_url: '/plans/premium'
  });
}
*/