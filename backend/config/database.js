// config/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'wolofdict',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      supportBigNumbers: true,
      bigNumberStrings: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+00:00',
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      underscored: true,
      freezeTableName: true,
      timestamps: true,
      paranoid: true // Soft delete par défaut
    }
  }
);

module.exports = sequelize;

// models/index.js
const sequelize = require('../config/database');

// Import des modèles utilisateurs
const User = require('./user/User');
const UserProfile = require('./user/UserProfile');
const UserSession = require('./user/UserSession');

// 💰 Import des modèles business (NOUVEAUX)
const Plan = require('./business/Plan');
const Subscription = require('./business/Subscription');
const Payment = require('./business/Payment');

// Import des modèles contenu
const Word = require('./content/Word');
const WordExample = require('./content/WordExample');
const WordSynonym = require('./content/WordSynonym');
const WordVariation = require('./content/WordVariation');
const Phrase = require('./content/Phrase');
const PhraseVariation = require('./content/PhraseVariation');
const Alphabet = require('./content/Alphabet');
const Proverb = require('./content/Proverb');

// Import des modèles catégorisation
const Category = require('./categorization/Category');
const Tag = require('./categorization/Tag');
const WordCategory = require('./categorization/WordCategory');
const PhraseCategory = require('./categorization/PhraseCategory');
const WordTag = require('./categorization/WordTag');
const PhraseTag = require('./categorization/PhraseTag');

// Import des modèles média
const AudioRecording = require('./media/AudioRecording');
const Image = require('./media/Image');

// Import des modèles interactions
const Favorite = require('./interactions/Favorite');
const Like = require('./interactions/Like');
const Rating = require('./interactions/Rating');
const UserContribution = require('./interactions/UserContribution');

// Import des modèles communauté
const ForumCategory = require('./community/ForumCategory');
const ForumTopic = require('./community/ForumTopic');
const ForumPost = require('./community/ForumPost');
const Comment = require('./community/Comment');

// Import des modèles événements
const Event = require('./events/Event');
const EventRegistration = require('./events/EventRegistration');
const EventCategory = require('./events/EventCategory');

// Import des modèles projets
const Project = require('./projects/Project');
const ProjectContributor = require('./projects/ProjectContributor');
const Suggestion = require('./projects/Suggestion');

// Import des modèles statistiques
const SearchLog = require('./stats/SearchLog');
const UserActivity = require('./stats/UserActivity');
const WordUsageStats = require('./stats/WordUsageStats');
const DailyStats = require('./stats/DailyStats');

// Import des modèles communication
const Notification = require('./communication/Notification');
const NewsletterSubscription = require('./communication/NewsletterSubscription');
const Announcement = require('./communication/Announcement');

// Import des modèles administration
const ModeratorAction = require('./admin/ModeratorAction');
const ReportedContent = require('./admin/ReportedContent');
const SystemSettings = require('./admin/SystemSettings');

// Import des modèles intégration
const APIKey = require('./integration/APIKey');
const ExternalIntegration = require('./integration/ExternalIntegration');

// Définition des associations
function defineAssociations() {
  // ==========================================================================
  // 👤 RELATIONS USER
  // ==========================================================================
  User.hasOne(UserProfile, { foreignKey: 'user_id', as: 'profile' });
  UserProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  
  User.hasMany(UserSession, { foreignKey: 'user_id', as: 'sessions' });
  UserSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ==========================================================================
  // 💰 RELATIONS BUSINESS (NOUVELLES)
  // ==========================================================================
  
  // User ↔ Subscription
  User.hasMany(Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
  Subscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Plan ↔ Subscription
  Plan.hasMany(Subscription, { foreignKey: 'plan_id', as: 'subscriptions' });
  Subscription.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });

  // User ↔ Payment
  User.hasMany(Payment, { foreignKey: 'user_id', as: 'payments' });
  Payment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Subscription ↔ Payment
  Subscription.hasMany(Payment, { foreignKey: 'subscription_id', as: 'payments' });
  Payment.belongsTo(Subscription, { foreignKey: 'subscription_id', as: 'subscription' });

  // Plan ↔ Payment (pour historique)
  Plan.hasMany(Payment, { foreignKey: 'plan_id', as: 'payments' });
  Payment.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' });

  // ==========================================================================
  // 📚 RELATIONS WORD
  // ==========================================================================
  User.hasMany(Word, { foreignKey: 'created_by', as: 'createdWords' });
  Word.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  
  Word.hasMany(WordExample, { foreignKey: 'word_id', as: 'examples' });
  WordExample.belongsTo(Word, { foreignKey: 'word_id', as: 'word' });
  
  Word.hasMany(WordSynonym, { foreignKey: 'word_id', as: 'synonyms' });
  WordSynonym.belongsTo(Word, { foreignKey: 'word_id', as: 'word' });
  
  Word.hasMany(WordVariation, { foreignKey: 'word_id', as: 'variations' });
  WordVariation.belongsTo(Word, { foreignKey: 'word_id', as: 'word' });

  // ==========================================================================
  // 📝 RELATIONS PHRASE
  // ==========================================================================
  User.hasMany(Phrase, { foreignKey: 'created_by', as: 'createdPhrases' });
  Phrase.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  
  Phrase.hasMany(PhraseVariation, { foreignKey: 'phrase_id', as: 'variations' });
  PhraseVariation.belongsTo(Phrase, { foreignKey: 'phrase_id', as: 'phrase' });

  // ==========================================================================
  // 🏷️ RELATIONS MANY-TO-MANY POUR CATÉGORIES
  // ==========================================================================
  Word.belongsToMany(Category, { 
    through: WordCategory, 
    foreignKey: 'word_id', 
    otherKey: 'category_id',
    as: 'categories' 
  });
  Category.belongsToMany(Word, { 
    through: WordCategory, 
    foreignKey: 'category_id', 
    otherKey: 'word_id',
    as: 'words' 
  });

  Phrase.belongsToMany(Category, { 
    through: PhraseCategory, 
    foreignKey: 'phrase_id', 
    otherKey: 'category_id',
    as: 'categories' 
  });
  Category.belongsToMany(Phrase, { 
    through: PhraseCategory, 
    foreignKey: 'category_id', 
    otherKey: 'phrase_id',
    as: 'phrases' 
  });

  // ==========================================================================
  // 🔖 RELATIONS MANY-TO-MANY POUR TAGS
  // ==========================================================================
  Word.belongsToMany(Tag, { 
    through: WordTag, 
    foreignKey: 'word_id', 
    otherKey: 'tag_id',
    as: 'tags' 
  });
  Tag.belongsToMany(Word, { 
    through: WordTag, 
    foreignKey: 'tag_id', 
    otherKey: 'word_id',
    as: 'words' 
  });

  Phrase.belongsToMany(Tag, { 
    through: PhraseTag, 
    foreignKey: 'phrase_id', 
    otherKey: 'tag_id',
    as: 'tags' 
  });
  Tag.belongsToMany(Phrase, { 
    through: PhraseTag, 
    foreignKey: 'tag_id', 
    otherKey: 'phrase_id',
    as: 'phrases' 
  });

  // ==========================================================================
  // 🎵 RELATIONS AUDIO ET IMAGES (polymorphes)
  // ==========================================================================
  Word.hasMany(AudioRecording, { 
    foreignKey: 'content_id',
    scope: { content_type: 'word' },
    as: 'audioRecordings'
  });
  Phrase.hasMany(AudioRecording, { 
    foreignKey: 'content_id',
    scope: { content_type: 'phrase' },
    as: 'audioRecordings'
  });
  AudioRecording.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  Word.hasMany(Image, { 
    foreignKey: 'content_id',
    scope: { content_type: 'word' },
    as: 'images'
  });
  Phrase.hasMany(Image, { 
    foreignKey: 'content_id',
    scope: { content_type: 'phrase' },
    as: 'images'
  });
  Image.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

  // ==========================================================================
  // 💫 RELATIONS FAVORITES ET LIKES (polymorphes)
  // ==========================================================================
  User.hasMany(Favorite, { foreignKey: 'user_id', as: 'favorites' });
  Favorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(Like, { foreignKey: 'user_id', as: 'likes' });
  Like.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(Rating, { foreignKey: 'user_id', as: 'ratings' });
  Rating.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ==========================================================================
  // 💬 RELATIONS FORUM
  // ==========================================================================
  ForumCategory.hasMany(ForumTopic, { foreignKey: 'category_id', as: 'topics' });
  ForumTopic.belongsTo(ForumCategory, { foreignKey: 'category_id', as: 'category' });
  
  User.hasMany(ForumTopic, { foreignKey: 'created_by', as: 'createdTopics' });
  ForumTopic.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  
  ForumTopic.hasMany(ForumPost, { foreignKey: 'topic_id', as: 'posts' });
  ForumPost.belongsTo(ForumTopic, { foreignKey: 'topic_id', as: 'topic' });
  
  User.hasMany(ForumPost, { foreignKey: 'author_id', as: 'posts' });
  ForumPost.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

  // Self-referencing pour les réponses
  ForumPost.hasMany(ForumPost, { foreignKey: 'parent_post_id', as: 'replies' });
  ForumPost.belongsTo(ForumPost, { foreignKey: 'parent_post_id', as: 'parentPost' });

  // ==========================================================================
  // 💭 RELATIONS COMMENTS (polymorphes)
  // ==========================================================================
  User.hasMany(Comment, { foreignKey: 'author_id', as: 'comments' });
  Comment.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
  
  Comment.hasMany(Comment, { foreignKey: 'parent_comment_id', as: 'replies' });
  Comment.belongsTo(Comment, { foreignKey: 'parent_comment_id', as: 'parentComment' });

  // ==========================================================================
  // 📅 RELATIONS EVENTS
  // ==========================================================================
  EventCategory.hasMany(Event, { foreignKey: 'category_id', as: 'events' });
  Event.belongsTo(EventCategory, { foreignKey: 'category_id', as: 'category' });
  
  User.hasMany(Event, { foreignKey: 'organizer_id', as: 'organizedEvents' });
  Event.belongsTo(User, { foreignKey: 'organizer_id', as: 'organizer' });
  
  Event.hasMany(EventRegistration, { foreignKey: 'event_id', as: 'registrations' });
  EventRegistration.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });
  
  User.hasMany(EventRegistration, { foreignKey: 'user_id', as: 'eventRegistrations' });
  EventRegistration.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ==========================================================================
  // 🚀 RELATIONS PROJECTS
  // ==========================================================================
  User.hasMany(Project, { foreignKey: 'lead_contributor_id', as: 'ledProjects' });
  Project.belongsTo(User, { foreignKey: 'lead_contributor_id', as: 'leadContributor' });
  
  Project.hasMany(ProjectContributor, { foreignKey: 'project_id', as: 'contributors' });
  ProjectContributor.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
  
  User.hasMany(ProjectContributor, { foreignKey: 'user_id', as: 'projectContributions' });
  ProjectContributor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ==========================================================================
  // 💡 RELATIONS SUGGESTIONS
  // ==========================================================================
  User.hasMany(Suggestion, { foreignKey: 'submitter_id', as: 'suggestions' });
  Suggestion.belongsTo(User, { foreignKey: 'submitter_id', as: 'submitter' });
  
  User.hasMany(Suggestion, { foreignKey: 'reviewed_by', as: 'reviewedSuggestions' });
  Suggestion.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });

  // ==========================================================================
  // 📊 RELATIONS STATISTICS
  // ==========================================================================
  User.hasMany(SearchLog, { foreignKey: 'user_id', as: 'searchLogs' });
  SearchLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  
  User.hasMany(UserActivity, { foreignKey: 'user_id', as: 'activities' });
  UserActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  
  Word.hasMany(WordUsageStats, { foreignKey: 'word_id', as: 'usageStats' });
  WordUsageStats.belongsTo(Word, { foreignKey: 'word_id', as: 'word' });

  // ==========================================================================
  // 📢 RELATIONS COMMUNICATION
  // ==========================================================================
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  
  User.hasOne(NewsletterSubscription, { foreignKey: 'user_id', as: 'newsletterSubscription' });
  NewsletterSubscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  
  User.hasMany(Announcement, { foreignKey: 'created_by', as: 'createdAnnouncements' });
  Announcement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

  // ==========================================================================
  // 🛠️ RELATIONS ADMINISTRATION
  // ==========================================================================
  User.hasMany(ModeratorAction, { foreignKey: 'moderator_id', as: 'moderatorActions' });
  ModeratorAction.belongsTo(User, { foreignKey: 'moderator_id', as: 'moderator' });
  
  User.hasMany(ReportedContent, { foreignKey: 'reporter_id', as: 'reportedContents' });
  ReportedContent.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
  
  User.hasMany(ReportedContent, { foreignKey: 'resolved_by', as: 'resolvedReports' });
  ReportedContent.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });

  // ==========================================================================
  // 🔗 RELATIONS API
  // ==========================================================================
  User.hasMany(APIKey, { foreignKey: 'user_id', as: 'apiKeys' });
  APIKey.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ==========================================================================
  // 🏗️ SELF-REFERENCING POUR CATÉGORIES HIÉRARCHIQUES
  // ==========================================================================
  Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
  Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
}

// =============================================================================
// 📦 INITIALISATION DES MODÈLES
// =============================================================================
const models = {
  // User models
  User, UserProfile, UserSession,
  
  // 💰 Business models (NOUVEAUX)
  Plan, Subscription, Payment,
  
  // Content models
  Word, WordExample, WordSynonym, WordVariation,
  Phrase, PhraseVariation, Alphabet, Proverb,
  
  // Categorization models
  Category, Tag, WordCategory, PhraseCategory, WordTag, PhraseTag,
  
  // Media models
  AudioRecording, Image,
  
  // Interaction models
  Favorite, Like, Rating, UserContribution,
  
  // Community models
  ForumCategory, ForumTopic, ForumPost, Comment,
  
  // Event models
  Event, EventRegistration, EventCategory,
  
  // Project models
  Project, ProjectContributor, Suggestion,
  
  // Stats models
  SearchLog, UserActivity, WordUsageStats, DailyStats,
  
  // Communication models
  Notification, NewsletterSubscription, Announcement,
  
  // Admin models
  ModeratorAction, ReportedContent, SystemSettings,
  
  // Integration models
  APIKey, ExternalIntegration
};

// Établir les associations
defineAssociations();

// =============================================================================
// 🔄 SYNCHRONISATION AVEC LA BASE DE DONNÉES
// =============================================================================
async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à MySQL réussie');
    
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Synchronisation des modèles terminée (45 modèles)');
      console.log('💰 Modèles business intégrés : Plan, Subscription, Payment');
    }
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error);
  }
}

// =============================================================================
// 📤 EXPORTS
// =============================================================================
module.exports = {
  sequelize,
  models,
  syncDatabase,
  ...models
};

// =============================================================================
// 📊 RÉSUMÉ ARCHITECTURE FINALE
// =============================================================================
/*
🎯 ARCHITECTURE COMPLÈTE : 45 MODÈLES

NOUVEAUTÉS BUSINESS :
✅ Plan.js - Plans tarifaires (Free, Premium, Pro)
✅ Subscription.js - Abonnements utilisateurs  
✅ Payment.js - Historique paiements

RELATIONS BUSINESS AJOUTÉES :
├── User → hasMany → Subscription
├── Plan → hasMany → Subscription  
├── User → hasMany → Payment
├── Subscription → hasMany → Payment
└── Plan → hasMany → Payment

FONCTIONNALITÉS BUSINESS :
🔄 Gestion abonnements complets
💳 Support multi-devises (EUR, USD, XOF)
🏦 Intégrations : Stripe, PayPal, Mobile Money
📊 Analytics intégrées
🎯 Système freemium opérationnel
*/