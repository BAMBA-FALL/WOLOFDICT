const fs = require('fs');
const path = require('path');

// Structure des modèles à créer
const modelsStructure = {
  'models': {
    'index.js': `// Export de tous les modèles
// User models
const User = require('./user/User');
const UserProfile = require('./user/UserProfile');
const UserSession = require('./user/UserSession');

// Content models
const Word = require('./content/Word');
const WordExample = require('./content/WordExample');
const WordSynonym = require('./content/WordSynonym');
const WordVariation = require('./content/WordVariation');
const Phrase = require('./content/Phrase');
const PhraseVariation = require('./content/PhraseVariation');
const Alphabet = require('./content/Alphabet');
const Proverb = require('./content/Proverb');

// Categorization models
const Category = require('./categorization/Category');
const Tag = require('./categorization/Tag');
const WordCategory = require('./categorization/WordCategory');
const PhraseCategory = require('./categorization/PhraseCategory');
const WordTag = require('./categorization/WordTag');
const PhraseTag = require('./categorization/PhraseTag');

// Media models
const AudioRecording = require('./media/AudioRecording');
const Image = require('./media/Image');

// Interactions models
const Favorite = require('./interactions/Favorite');
const Like = require('./interactions/Like');
const Rating = require('./interactions/Rating');
const UserContribution = require('./interactions/UserContribution');

// Community models
const ForumCategory = require('./community/ForumCategory');
const ForumTopic = require('./community/ForumTopic');
const ForumPost = require('./community/ForumPost');
const Comment = require('./community/Comment');

// Events models
const Event = require('./events/Event');
const EventRegistration = require('./events/EventRegistration');
const EventCategory = require('./events/EventCategory');

// Projects models
const Project = require('./projects/Project');
const ProjectContributor = require('./projects/ProjectContributor');
const Suggestion = require('./projects/Suggestion');

// Stats models
const SearchLog = require('./stats/SearchLog');
const UserActivity = require('./stats/UserActivity');
const WordUsageStats = require('./stats/WordUsageStats');
const DailyStats = require('./stats/DailyStats');

// Communication models
const Notification = require('./communication/Notification');
const NewsletterSubscription = require('./communication/NewsletterSubscription');
const Announcement = require('./communication/Announcement');

// Admin models
const ModeratorAction = require('./admin/ModeratorAction');
const ReportedContent = require('./admin/ReportedContent');
const SystemSettings = require('./admin/SystemSettings');

// Integration models
const APIKey = require('./integration/APIKey');
const ExternalIntegration = require('./integration/ExternalIntegration');

module.exports = {
  // User
  User,
  UserProfile,
  UserSession,
  
  // Content
  Word,
  WordExample,
  WordSynonym,
  WordVariation,
  Phrase,
  PhraseVariation,
  Alphabet,
  Proverb,
  
  // Categorization
  Category,
  Tag,
  WordCategory,
  PhraseCategory,
  WordTag,
  PhraseTag,
  
  // Media
  AudioRecording,
  Image,
  
  // Interactions
  Favorite,
  Like,
  Rating,
  UserContribution,
  
  // Community
  ForumCategory,
  ForumTopic,
  ForumPost,
  Comment,
  
  // Events
  Event,
  EventRegistration,
  EventCategory,
  
  // Projects
  Project,
  ProjectContributor,
  Suggestion,
  
  // Stats
  SearchLog,
  UserActivity,
  WordUsageStats,
  DailyStats,
  
  // Communication
  Notification,
  NewsletterSubscription,
  Announcement,
  
  // Admin
  ModeratorAction,
  ReportedContent,
  SystemSettings,
  
  // Integration
  APIKey,
  ExternalIntegration
};`,
    'user': {
      'User.js': `// Modèle User
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Définir le schéma du modèle User
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);`,
      'UserProfile.js': `// Modèle UserProfile
const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  // Définir le schéma du modèle UserProfile
}, {
  timestamps: true
});

module.exports = mongoose.model('UserProfile', userProfileSchema);`,
      'UserSession.js': `// Modèle UserSession
const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema({
  // Définir le schéma du modèle UserSession
}, {
  timestamps: true
});

module.exports = mongoose.model('UserSession', userSessionSchema);`
    },
    'content': {
      'Word.js': `// Modèle Word
const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  // Définir le schéma du modèle Word
}, {
  timestamps: true
});

module.exports = mongoose.model('Word', wordSchema);`,
      'WordExample.js': `// Modèle WordExample
const mongoose = require('mongoose');

const wordExampleSchema = new mongoose.Schema({
  // Définir le schéma du modèle WordExample
}, {
  timestamps: true
});

module.exports = mongoose.model('WordExample', wordExampleSchema);`,
      'WordSynonym.js': `// Modèle WordSynonym
const mongoose = require('mongoose');

const wordSynonymSchema = new mongoose.Schema({
  // Définir le schéma du modèle WordSynonym
}, {
  timestamps: true
});

module.exports = mongoose.model('WordSynonym', wordSynonymSchema);`,
      'WordVariation.js': `// Modèle WordVariation
const mongoose = require('mongoose');

const wordVariationSchema = new mongoose.Schema({
  // Définir le schéma du modèle WordVariation
}, {
  timestamps: true
});

module.exports = mongoose.model('WordVariation', wordVariationSchema);`,
      'Phrase.js': `// Modèle Phrase
const mongoose = require('mongoose');

const phraseSchema = new mongoose.Schema({
  // Définir le schéma du modèle Phrase
}, {
  timestamps: true
});

module.exports = mongoose.model('Phrase', phraseSchema);`,
      'PhraseVariation.js': `// Modèle PhraseVariation
const mongoose = require('mongoose');

const phraseVariationSchema = new mongoose.Schema({
  // Définir le schéma du modèle PhraseVariation
}, {
  timestamps: true
});

module.exports = mongoose.model('PhraseVariation', phraseVariationSchema);`,
      'Alphabet.js': `// Modèle Alphabet
const mongoose = require('mongoose');

const alphabetSchema = new mongoose.Schema({
  // Définir le schéma du modèle Alphabet
}, {
  timestamps: true
});

module.exports = mongoose.model('Alphabet', alphabetSchema);`,
      'Proverb.js': `// Modèle Proverb
const mongoose = require('mongoose');

const proverbSchema = new mongoose.Schema({
  // Définir le schéma du modèle Proverb
}, {
  timestamps: true
});

module.exports = mongoose.model('Proverb', proverbSchema);`
    },
    'categorization': {
      'Category.js': `// Modèle Category
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  // Définir le schéma du modèle Category
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);`,
      'Tag.js': `// Modèle Tag
const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  // Définir le schéma du modèle Tag
}, {
  timestamps: true
});

module.exports = mongoose.model('Tag', tagSchema);`,
      'WordCategory.js': `// Modèle WordCategory
const mongoose = require('mongoose');

const wordCategorySchema = new mongoose.Schema({
  // Définir le schéma du modèle WordCategory
}, {
  timestamps: true
});

module.exports = mongoose.model('WordCategory', wordCategorySchema);`,
      'PhraseCategory.js': `// Modèle PhraseCategory
const mongoose = require('mongoose');

const phraseCategorySchema = new mongoose.Schema({
  // Définir le schéma du modèle PhraseCategory
}, {
  timestamps: true
});

module.exports = mongoose.model('PhraseCategory', phraseCategorySchema);`,
      'WordTag.js': `// Modèle WordTag
const mongoose = require('mongoose');

const wordTagSchema = new mongoose.Schema({
  // Définir le schéma du modèle WordTag
}, {
  timestamps: true
});

module.exports = mongoose.model('WordTag', wordTagSchema);`,
      'PhraseTag.js': `// Modèle PhraseTag
const mongoose = require('mongoose');

const phraseTagSchema = new mongoose.Schema({
  // Définir le schéma du modèle PhraseTag
}, {
  timestamps: true
});

module.exports = mongoose.model('PhraseTag', phraseTagSchema);`
    },
    'media': {
      'AudioRecording.js': `// Modèle AudioRecording
const mongoose = require('mongoose');

const audioRecordingSchema = new mongoose.Schema({
  // Définir le schéma du modèle AudioRecording
}, {
  timestamps: true
});

module.exports = mongoose.model('AudioRecording', audioRecordingSchema);`,
      'Image.js': `// Modèle Image
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  // Définir le schéma du modèle Image
}, {
  timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);`
    },
    'interactions': {
      'Favorite.js': `// Modèle Favorite
const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  // Définir le schéma du modèle Favorite
}, {
  timestamps: true
});

module.exports = mongoose.model('Favorite', favoriteSchema);`,
      'Like.js': `// Modèle Like
const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  // Définir le schéma du modèle Like
}, {
  timestamps: true
});

module.exports = mongoose.model('Like', likeSchema);`,
      'Rating.js': `// Modèle Rating
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  // Définir le schéma du modèle Rating
}, {
  timestamps: true
});

module.exports = mongoose.model('Rating', ratingSchema);`,
      'UserContribution.js': `// Modèle UserContribution
const mongoose = require('mongoose');

const userContributionSchema = new mongoose.Schema({
  // Définir le schéma du modèle UserContribution
}, {
  timestamps: true
});

module.exports = mongoose.model('UserContribution', userContributionSchema);`
    },
    'community': {
      'ForumCategory.js': `// Modèle ForumCategory
const mongoose = require('mongoose');

const forumCategorySchema = new mongoose.Schema({
  // Définir le schéma du modèle ForumCategory
}, {
  timestamps: true
});

module.exports = mongoose.model('ForumCategory', forumCategorySchema);`,
      'ForumTopic.js': `// Modèle ForumTopic
const mongoose = require('mongoose');

const forumTopicSchema = new mongoose.Schema({
  // Définir le schéma du modèle ForumTopic
}, {
  timestamps: true
});

module.exports = mongoose.model('ForumTopic', forumTopicSchema);`,
      'ForumPost.js': `// Modèle ForumPost
const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  // Définir le schéma du modèle ForumPost
}, {
  timestamps: true
});

module.exports = mongoose.model('ForumPost', forumPostSchema);`,
      'Comment.js': `// Modèle Comment
const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Définir le schéma du modèle Comment
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);`
    },
    'events': {
      'Event.js': `// Modèle Event
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // Définir le schéma du modèle Event
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);`,
      'EventRegistration.js': `// Modèle EventRegistration
const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema({
  // Définir le schéma du modèle EventRegistration
}, {
  timestamps: true
});

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);`,
      'EventCategory.js': `// Modèle EventCategory
const mongoose = require('mongoose');

const eventCategorySchema = new mongoose.Schema({
  // Définir le schéma du modèle EventCategory
}, {
  timestamps: true
});

module.exports = mongoose.model('EventCategory', eventCategorySchema);`
    },
    'projects': {
      'Project.js': `// Modèle Project
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Définir le schéma du modèle Project
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);`,
      'ProjectContributor.js': `// Modèle ProjectContributor
const mongoose = require('mongoose');

const projectContributorSchema = new mongoose.Schema({
  // Définir le schéma du modèle ProjectContributor
}, {
  timestamps: true
});

module.exports = mongoose.model('ProjectContributor', projectContributorSchema);`,
      'Suggestion.js': `// Modèle Suggestion
const mongoose = require('mongoose');

const suggestionSchema = new mongoose.Schema({
  // Définir le schéma du modèle Suggestion
}, {
  timestamps: true
});

module.exports = mongoose.model('Suggestion', suggestionSchema);`
    },
    'stats': {
      'SearchLog.js': `// Modèle SearchLog
const mongoose = require('mongoose');

const searchLogSchema = new mongoose.Schema({
  // Définir le schéma du modèle SearchLog
}, {
  timestamps: true
});

module.exports = mongoose.model('SearchLog', searchLogSchema);`,
      'UserActivity.js': `// Modèle UserActivity
const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  // Définir le schéma du modèle UserActivity
}, {
  timestamps: true
});

module.exports = mongoose.model('UserActivity', userActivitySchema);`,
      'WordUsageStats.js': `// Modèle WordUsageStats
const mongoose = require('mongoose');

const wordUsageStatsSchema = new mongoose.Schema({
  // Définir le schéma du modèle WordUsageStats
}, {
  timestamps: true
});

module.exports = mongoose.model('WordUsageStats', wordUsageStatsSchema);`,
      'DailyStats.js': `// Modèle DailyStats
const mongoose = require('mongoose');

const dailyStatsSchema = new mongoose.Schema({
  // Définir le schéma du modèle DailyStats
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyStats', dailyStatsSchema);`
    },
    'communication': {
      'Notification.js': `// Modèle Notification
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Définir le schéma du modèle Notification
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);`,
      'NewsletterSubscription.js': `// Modèle NewsletterSubscription
const mongoose = require('mongoose');

const newsletterSubscriptionSchema = new mongoose.Schema({
  // Définir le schéma du modèle NewsletterSubscription
}, {
  timestamps: true
});

module.exports = mongoose.model('NewsletterSubscription', newsletterSubscriptionSchema);`,
      'Announcement.js': `// Modèle Announcement
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  // Définir le schéma du modèle Announcement
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);`
    },
    'admin': {
      'ModeratorAction.js': `// Modèle ModeratorAction
const mongoose = require('mongoose');

const moderatorActionSchema = new mongoose.Schema({
  // Définir le schéma du modèle ModeratorAction
}, {
  timestamps: true
});

module.exports = mongoose.model('ModeratorAction', moderatorActionSchema);`,
      'ReportedContent.js': `// Modèle ReportedContent
const mongoose = require('mongoose');

const reportedContentSchema = new mongoose.Schema({
  // Définir le schéma du modèle ReportedContent
}, {
  timestamps: true
});

module.exports = mongoose.model('ReportedContent', reportedContentSchema);`,
      'SystemSettings.js': `// Modèle SystemSettings
const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Définir le schéma du modèle SystemSettings
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);`
    },
    'integration': {
      'APIKey.js': `// Modèle APIKey
const mongoose = require('mongoose');

const apiKeySchema = new mongoose.Schema({
  // Définir le schéma du modèle APIKey
}, {
  timestamps: true
});

module.exports = mongoose.model('APIKey', apiKeySchema);`,
      'ExternalIntegration.js': `// Modèle ExternalIntegration
const mongoose = require('mongoose');

const externalIntegrationSchema = new mongoose.Schema({
  // Définir le schéma du modèle ExternalIntegration
}, {
  timestamps: true
});

module.exports = mongoose.model('ExternalIntegration', externalIntegrationSchema);`
    }
  }
};

/**
 * Crée récursivement la structure de dossiers et fichiers
 * @param {Object} structure - Structure à créer
 * @param {string} basePath - Chemin de base
 */
function createStructure(structure, basePath = './') {
  Object.keys(structure).forEach(name => {
    const fullPath = path.join(basePath, name);
    const item = structure[name];
    
    if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
      // C'est un dossier
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Dossier créé: ${fullPath}`);
      }
      
      // Créer le contenu du dossier
      if (Object.keys(item).length > 0) {
        createStructure(item, fullPath);
      }
    } else {
      // C'est un fichier
      if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, item || '');
        console.log(`📄 Fichier créé: ${fullPath}`);
      } else {
        console.log(`⚠️  Fichier existe déjà: ${fullPath}`);
      }
    }
  });
}

/**
 * Fonction principale
 */
function main() {
  const projectPath = process.argv[2] || './';
  
  console.log('🚀 Création de la structure des modèles');
  console.log(`📍 Chemin: ${path.resolve(projectPath)}`);
  console.log('---');
  
  // Créer la structure
  createStructure(modelsStructure, projectPath);
  
  console.log('---');
  console.log('✅ Structure des modèles créée avec succès !');
  console.log('\nStructure créée:');
  console.log('models/');
  console.log('├── index.js');
  console.log('├── user/ (3 fichiers)');
  console.log('├── content/ (8 fichiers)');
  console.log('├── categorization/ (6 fichiers)');
  console.log('├── media/ (2 fichiers)');
  console.log('├── interactions/ (4 fichiers)');
  console.log('├── community/ (4 fichiers)');
  console.log('├── events/ (3 fichiers)');
  console.log('├── projects/ (3 fichiers)');
  console.log('├── stats/ (4 fichiers)');
  console.log('├── communication/ (3 fichiers)');
  console.log('├── admin/ (3 fichiers)');
  console.log('└── integration/ (2 fichiers)');
  console.log('\nTotal: 12 dossiers, 46 fichiers');
}

// Exécuter le script
main();