// =============================================================================
// 🌍 WOLOFDICT - INDEX DES MODÈLES (45 modèles)
// Architecture complète avec modèles business pour monétisation
// =============================================================================

// Export de tous les modèles

// =============================================================================
// 👤 USER MODELS (3 modèles)
// =============================================================================
const User = require('./user/User');
const UserProfile = require('./user/UserProfile');
const UserSession = require('./user/UserSession');

// =============================================================================
// 💰 BUSINESS MODELS (3 nouveaux modèles pour monétisation)
// =============================================================================
const Plan = require('./business/Plan');
const Subscription = require('./business/Subscription');
const Payment = require('./business/Payment');

// =============================================================================
// 📚 CONTENT MODELS (8 modèles)
// =============================================================================
const Word = require('./content/Word');
const WordExample = require('./content/WordExample');
const WordSynonym = require('./content/WordSynonym');
const WordVariation = require('./content/WordVariation');
const Phrase = require('./content/Phrase');
const PhraseVariation = require('./content/PhraseVariation');
const Alphabet = require('./content/Alphabet');
const Proverb = require('./content/Proverb');

// =============================================================================
// 🏷️ CATEGORIZATION MODELS (6 modèles)
// =============================================================================
const Category = require('./categorization/Category');
const Tag = require('./categorization/Tag');
const WordCategory = require('./categorization/WordCategory');
const PhraseCategory = require('./categorization/PhraseCategory');
const WordTag = require('./categorization/WordTag');
const PhraseTag = require('./categorization/PhraseTag');

// =============================================================================
// 🎵 MEDIA MODELS (2 modèles)
// =============================================================================
const AudioRecording = require('./media/AudioRecording');
const Image = require('./media/Image');

// =============================================================================
// 💫 INTERACTION MODELS (4 modèles)
// =============================================================================
const Favorite = require('./interactions/Favorite');
const Like = require('./interactions/Like');
const Rating = require('./interactions/Rating');
const UserContribution = require('./interactions/UserContribution');

// =============================================================================
// 💬 COMMUNITY MODELS (4 modèles)
// =============================================================================
const ForumCategory = require('./community/ForumCategory');
const ForumTopic = require('./community/ForumTopic');
const ForumPost = require('./community/ForumPost');
const Comment = require('./community/Comment');

// =============================================================================
// 📅 EVENTS MODELS (3 modèles)
// =============================================================================
const Event = require('./events/Event');
const EventRegistration = require('./events/EventRegistration');
const EventCategory = require('./events/EventCategory');

// =============================================================================
// 🚀 PROJECTS MODELS (3 modèles)
// =============================================================================
const Project = require('./projects/Project');
const ProjectContributor = require('./projects/ProjectContributor');
const Suggestion = require('./projects/Suggestion');

// =============================================================================
// 📊 STATS MODELS (4 modèles)
// =============================================================================
const SearchLog = require('./stats/SearchLog');
const UserActivity = require('./stats/UserActivity');
const WordUsageStats = require('./stats/WordUsageStats');
const DailyStats = require('./stats/DailyStats');

// =============================================================================
// 📢 COMMUNICATION MODELS (3 modèles)
// =============================================================================
const Notification = require('./communication/Notification');
const NewsletterSubscription = require('./communication/NewsletterSubscription');
const Announcement = require('./communication/Announcement');

// =============================================================================
// 🛠️ ADMIN MODELS (3 modèles)
// =============================================================================
const ModeratorAction = require('./admin/ModeratorAction');
const ReportedContent = require('./admin/ReportedContent');
const SystemSettings = require('./admin/SystemSettings');

// =============================================================================
// 🔗 INTEGRATION MODELS (2 modèles)
// =============================================================================
const APIKey = require('./integration/APIKey');
const ExternalIntegration = require('./integration/ExternalIntegration');

// =============================================================================
// 📤 EXPORT PRINCIPAL
// =============================================================================
module.exports = {
  // =============================================================================
  // 👤 USER (3)
  // =============================================================================
  User,
  UserProfile,
  UserSession,
  
  // =============================================================================
  // 💰 BUSINESS (3) - NOUVEAUX MODÈLES POUR MONÉTISATION
  // =============================================================================
  Plan,
  Subscription,
  Payment,
  
  // =============================================================================
  // 📚 CONTENT (8)
  // =============================================================================
  Word,
  WordExample,
  WordSynonym,
  WordVariation,
  Phrase,
  PhraseVariation,
  Alphabet,
  Proverb,
  
  // =============================================================================
  // 🏷️ CATEGORIZATION (6)
  // =============================================================================
  Category,
  Tag,
  WordCategory,
  PhraseCategory,
  WordTag,
  PhraseTag,
  
  // =============================================================================
  // 🎵 MEDIA (2)
  // =============================================================================
  AudioRecording,
  Image,
  
  // =============================================================================
  // 💫 INTERACTIONS (4)
  // =============================================================================
  Favorite,
  Like,
  Rating,
  UserContribution,
  
  // =============================================================================
  // 💬 COMMUNITY (4)
  // =============================================================================
  ForumCategory,
  ForumTopic,
  ForumPost,
  Comment,
  
  // =============================================================================
  // 📅 EVENTS (3)
  // =============================================================================
  Event,
  EventRegistration,
  EventCategory,
  
  // =============================================================================
  // 🚀 PROJECTS (3)
  // =============================================================================
  Project,
  ProjectContributor,
  Suggestion,
  
  // =============================================================================
  // 📊 STATS (4)
  // =============================================================================
  SearchLog,
  UserActivity,
  WordUsageStats,
  DailyStats,
  
  // =============================================================================
  // 📢 COMMUNICATION (3)
  // =============================================================================
  Notification,
  NewsletterSubscription,
  Announcement,
  
  // =============================================================================
  // 🛠️ ADMIN (3)
  // =============================================================================
  ModeratorAction,
  ReportedContent,
  SystemSettings,
  
  // =============================================================================
  // 🔗 INTEGRATION (2)
  // =============================================================================
  APIKey,
  ExternalIntegration
};

// =============================================================================
// 📊 RÉSUMÉ DE L'ARCHITECTURE
// =============================================================================
/*
TOTAL: 45 modèles

RÉPARTITION:
├── 👤 User: 3 modèles
├── 💰 Business: 3 modèles (NOUVEAUX)
├── 📚 Content: 8 modèles  
├── 🏷️ Categorization: 6 modèles
├── 🎵 Media: 2 modèles
├── 💫 Interactions: 4 modèles
├── 💬 Community: 4 modèles
├── 📅 Events: 3 modèles
├── 🚀 Projects: 3 modèles
├── 📊 Stats: 4 modèles
├── 📢 Communication: 3 modèles
├── 🛠️ Admin: 3 modèles
└── 🔗 Integration: 2 modèles

NOUVEAUTÉS:
✅ Plan.js - Plans tarifaires (Free, Premium, Pro)
✅ Subscription.js - Abonnements utilisateurs
✅ Payment.js - Historique des paiements

AVANTAGES:
🚀 Monétisation intégrée dès le début
📈 Architecture évolutive et flexible
💡 Séparation claire des responsabilités
🔧 Requêtes optimisées possibles
*/