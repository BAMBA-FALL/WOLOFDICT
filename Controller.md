// =============================================================================
// 🎮 LISTE EXHAUSTIVE DES CONTROLLERS POUR WOLOFDICT
// Architecture complète avec modèles business pour monétisation
// Total: 45 Controllers | ~350 endpoints API
// =============================================================================

// =============================================================================
// 🔐 AUTHENTICATION & AUTHORIZATION (2 controllers)
// =============================================================================

// AuthController
POST /auth/register - Inscription utilisateur (+ abonnement gratuit auto)
POST /auth/login - Connexion
POST /auth/logout - Déconnexion
POST /auth/refresh - Rafraîchir le token
POST /auth/forgot-password - Mot de passe oublié
POST /auth/reset-password - Réinitialiser mot de passe
POST /auth/verify-email - Vérifier email
POST /auth/resend-verification - Renvoyer vérification

// SocialAuthController
GET /auth/google - Connexion Google (+ abonnement gratuit auto)
GET /auth/google/callback - Callback Google
GET /auth/facebook - Connexion Facebook (+ abonnement gratuit auto)
GET /auth/facebook/callback - Callback Facebook

// =============================================================================
// 👤 GESTION UTILISATEURS (3 controllers)
// =============================================================================

// UserController
GET /users - Liste des utilisateurs (admin)
GET /users/:id - Profil utilisateur public
GET /users/me - Profil utilisateur connecté (+ statut abonnement)
PUT /users/me - Mettre à jour profil
DELETE /users/me - Supprimer compte (+ annuler abonnements)
POST /users/change-password - Changer mot de passe
GET /users/stats - Statistiques utilisateur (+ usage premium)
GET /users/activity - Activité utilisateur
GET /users/contributions - Contributions utilisateur (+ récompenses premium)

// UserProfileController
GET /users/:id/profile - Profil détaillé
PUT /users/me/profile - Mettre à jour profil détaillé
POST /users/me/profile/avatar - Upload avatar (limite selon plan)
PUT /users/me/preferences - Préférences utilisateur
GET /users/me/dashboard - Tableau de bord (+ métriques premium)

// UserSessionController
GET /users/me/sessions - Sessions actives
DELETE /users/me/sessions/:id - Supprimer session
DELETE /users/me/sessions - Supprimer toutes les sessions

// =============================================================================
// 💰 BUSINESS - MONÉTISATION (3 nouveaux controllers)
// =============================================================================

// PlanController ⭐ NOUVEAU
GET /plans - Liste des plans disponibles
GET /plans/:slug - Détails d'un plan spécifique
GET /plans/compare - Comparaison des plans
PUT /plans/:id - Modifier plan (admin)
POST /plans - Créer nouveau plan (admin)
DELETE /plans/:id - Supprimer plan (admin)
GET /plans/features - Matrice des fonctionnalités

// SubscriptionController ⭐ NOUVEAU
GET /users/me/subscription - Mon abonnement actuel
POST /subscriptions/subscribe - Souscrire à un plan
PUT /subscriptions/change-plan - Changer de plan
POST /subscriptions/cancel - Annuler abonnement
POST /subscriptions/reactivate - Réactiver abonnement
GET /subscriptions/usage - Usage actuel vs limites
POST /subscriptions/trial - Démarrer essai gratuit
GET /subscriptions/invoice/:id - Télécharger facture
GET /admin/subscriptions - Gestion abonnements (admin)
PUT /admin/subscriptions/:id - Modifier abonnement (admin)

// PaymentController ⭐ NOUVEAU
GET /users/me/payments - Historique de mes paiements
POST /payments/create-intent - Créer intention de paiement Stripe
POST /payments/webhook/stripe - Webhook Stripe
POST /payments/webhook/paypal - Webhook PayPal
POST /payments/retry/:id - Retenter paiement échoué
GET /payments/:id/receipt - Reçu de paiement
POST /payments/refund/:id - Remboursement (admin)
GET /admin/payments - Gestion paiements (admin)
GET /admin/payments/analytics - Analytics revenus (admin)

// =============================================================================
// 📚 CONTENU LINGUISTIQUE (8 controllers)
// =============================================================================

// WordController
GET /words - Liste/recherche mots (résultats selon plan)
GET /words/:id - Détails d'un mot (audio premium selon plan)
POST /words - Créer mot (contributeurs+ ou premium)
PUT /words/:id - Modifier mot (vérification premium)
DELETE /words/:id - Supprimer mot
GET /words/featured - Mots en vedette
GET /words/trending - Mots tendance
GET /words/random - Mot aléatoire
POST /words/:id/like - Liker un mot (quota selon plan)
POST /words/:id/favorite - Mettre en favori (limite selon plan)
POST /words/:id/view - Incrémenter vues
GET /words/premium - Mots exclusifs premium ⭐ NOUVEAU

// WordExampleController
GET /words/:id/examples - Exemples d'un mot
POST /words/:id/examples - Ajouter exemple (limite selon plan)
PUT /examples/:id - Modifier exemple
DELETE /examples/:id - Supprimer exemple

// WordSynonymController
GET /words/:id/synonyms - Synonymes d'un mot
POST /words/:id/synonyms - Ajouter synonyme (premium requis)
PUT /synonyms/:id - Modifier synonyme
DELETE /synonyms/:id - Supprimer synonyme

// WordVariationController
GET /words/:id/variations - Variations d'un mot
POST /words/:id/variations - Ajouter variation (premium requis)
PUT /variations/:id - Modifier variation
DELETE /variations/:id - Supprimer variation

// PhraseController
GET /phrases - Liste/recherche phrases (filtres premium)
GET /phrases/:id - Détails d'une phrase
POST /phrases - Créer phrase (limite selon plan)
PUT /phrases/:id - Modifier phrase
DELETE /phrases/:id - Supprimer phrase
GET /phrases/category/:category - Phrases par catégorie
GET /phrases/difficulty/:level - Phrases par difficulté
POST /phrases/:id/like - Liker phrase (quota selon plan)
POST /phrases/:id/favorite - Favoriser phrase (limite selon plan)
GET /phrases/premium - Phrases exclusives premium ⭐ NOUVEAU

// PhraseVariationController
GET /phrases/:id/variations - Variations d'une phrase
POST /phrases/:id/variations - Ajouter variation (premium requis)
PUT /phrase-variations/:id - Modifier variation
DELETE /phrase-variations/:id - Supprimer variation

// AlphabetController
GET /alphabet - Alphabet complet
GET /alphabet/:letter - Détails d'une lettre (audio premium)
PUT /alphabet/:letter - Modifier lettre (admin)
GET /alphabet/:letter/words - Mots commençant par lettre

// ProverbController
GET /proverbs - Liste proverbes
GET /proverbs/:id - Détails proverbe (audio premium selon plan)
POST /proverbs - Créer proverbe (limite selon plan)
PUT /proverbs/:id - Modifier proverbe
DELETE /proverbs/:id - Supprimer proverbe
GET /proverbs/random - Proverbe aléatoire
GET /proverbs/featured - Proverbes en vedette
GET /proverbs/premium - Proverbes exclusifs premium ⭐ NOUVEAU

// =============================================================================
// 🏷️ CATÉGORISATION (2 controllers)
// =============================================================================

// CategoryController
GET /categories - Liste catégories
GET /categories/:id - Détails catégorie
POST /categories - Créer catégorie (admin)
PUT /categories/:id - Modifier catégorie
DELETE /categories/:id - Supprimer catégorie
GET /categories/hierarchy - Hiérarchie complète
GET /categories/:id/words - Mots d'une catégorie (pagination premium)
GET /categories/:id/phrases - Phrases d'une catégorie (pagination premium)
GET /categories/premium - Catégories premium ⭐ NOUVEAU

// TagController
GET /tags - Liste tags
GET /tags/:id - Détails tag
POST /tags - Créer tag (limite selon plan)
PUT /tags/:id - Modifier tag
DELETE /tags/:id - Supprimer tag
GET /tags/trending - Tags tendance
GET /tags/popular - Tags populaires
GET /tags/:id/content - Contenu d'un tag (résultats selon plan)

// =============================================================================
// 🎵 MULTIMÉDIA (2 controllers)
// =============================================================================

// AudioController
GET /audio - Liste enregistrements audio (qualité selon plan)
GET /audio/:id - Détails enregistrement (accès premium vérifié)
POST /audio - Upload audio (limite selon plan)
PUT /audio/:id - Modifier métadonnées audio
DELETE /audio/:id - Supprimer audio
POST /audio/:id/play - Incrémenter lectures
GET /content/:type/:id/audio - Audio d'un contenu spécifique (premium requis)
GET /audio/premium - Audio haute qualité premium ⭐ NOUVEAU

// ImageController
GET /images - Liste images
GET /images/:id - Détails image
POST /images - Upload image (limite selon plan)
PUT /images/:id - Modifier métadonnées
DELETE /images/:id - Supprimer image
GET /images/recent - Images récentes
GET /images/popular - Images populaires
GET /content/:type/:id/images - Images d'un contenu (résolution selon plan)

// =============================================================================
// 💫 INTERACTIONS UTILISATEURS (4 controllers)
// =============================================================================

// FavoriteController
GET /users/me/favorites - Mes favoris (limite selon plan)
POST /favorites - Ajouter aux favoris (quota vérifié)
DELETE /favorites/:id - Retirer des favoris
GET /users/me/favorites/collections - Collections de favoris (premium)
POST /favorites/collections - Créer collection (premium requis)
PUT /favorites/collections/:id - Modifier collection (premium)
GET /favorites/upgrade-info - Info upgrade pour plus de favoris ⭐ NOUVEAU

// LikeController
POST /likes - Liker contenu (quota quotidien selon plan)
DELETE /likes/:id - Unliker contenu
GET /content/:type/:id/likes - Likes d'un contenu
GET /users/me/likes - Mes likes (historique selon plan)

// RatingController
GET /content/:type/:id/ratings - Notes d'un contenu
POST /ratings - Noter contenu (premium pour notes détaillées)
PUT /ratings/:id - Modifier note
DELETE /ratings/:id - Supprimer note
GET /ratings/stats/:type/:id - Statistiques des notes (premium)

// UserContributionController
GET /contributions - Liste contributions (filtres premium)
GET /contributions/:id - Détails contribution
POST /contributions - Créer contribution (récompenses selon plan)
PUT /contributions/:id/approve - Approuver (modérateurs)
PUT /contributions/:id/reject - Rejeter (modérateurs)
GET /contributions/leaderboard - Classement contributeurs
GET /users/:id/contributions/stats - Stats contributions utilisateur
GET /contributions/rewards - Système de récompenses ⭐ NOUVEAU

// =============================================================================
// 💬 COMMUNAUTÉ (4 controllers)
// =============================================================================

// ForumCategoryController
GET /forum/categories - Catégories forum
GET /forum/categories/:id - Détails catégorie
POST /forum/categories - Créer catégorie (admin)
PUT /forum/categories/:id - Modifier catégorie
DELETE /forum/categories/:id - Supprimer catégorie
GET /forum/categories/hierarchy - Hiérarchie forum
GET /forum/categories/premium - Catégories premium ⭐ NOUVEAU

// ForumTopicController
GET /forum/topics - Liste sujets (filtres premium)
GET /forum/topics/:id - Détails sujet
POST /forum/topics - Créer sujet (limite quotidienne selon plan)
PUT /forum/topics/:id - Modifier sujet
DELETE /forum/topics/:id - Supprimer sujet
POST /forum/topics/:id/pin - Épingler sujet (modérateurs)
POST /forum/topics/:id/lock - Verrouiller sujet
POST /forum/topics/:id/solve - Marquer comme résolu
POST /forum/topics/:id/view - Incrémenter vues

// ForumPostController
GET /forum/topics/:id/posts - Posts d'un sujet
GET /forum/posts/:id - Détails post
POST /forum/topics/:id/posts - Créer post (quota selon plan)
PUT /forum/posts/:id - Modifier post
DELETE /forum/posts/:id - Supprimer post
POST /forum/posts/:id/best-answer - Marquer meilleure réponse
POST /forum/posts/:id/like - Liker post (quota selon plan)

// CommentController
GET /content/:type/:id/comments - Commentaires d'un contenu
POST /content/:type/:id/comments - Créer commentaire (limite selon plan)
PUT /comments/:id - Modifier commentaire
DELETE /comments/:id - Supprimer commentaire
POST /comments/:id/like - Liker commentaire (quota selon plan)
POST /comments/:id/flag - Signaler commentaire
GET /comments/recent - Commentaires récents

// =============================================================================
// 📅 ÉVÉNEMENTS (3 controllers)
// =============================================================================

// EventCategoryController
GET /events/categories - Catégories d'événements
POST /events/categories - Créer catégorie (admin)
PUT /events/categories/:id - Modifier catégorie
DELETE /events/categories/:id - Supprimer catégorie

// EventController
GET /events - Liste événements (priorité selon plan)
GET /events/:id - Détails événement
POST /events - Créer événement (premium pour événements privés)
PUT /events/:id - Modifier événement
DELETE /events/:id - Supprimer événement
GET /events/upcoming - Événements à venir
GET /events/featured - Événements en vedette
POST /events/:id/cancel - Annuler événement
GET /events/calendar - Vue calendrier (avancé pour premium)
GET /events/search - Recherche avancée (filtres premium)
GET /events/premium - Événements exclusifs premium ⭐ NOUVEAU

// EventRegistrationController
GET /events/:id/registrations - Inscriptions (organisateur)
POST /events/:id/register - S'inscrire à événement (priorité premium)
PUT /registrations/:id - Modifier inscription
DELETE /registrations/:id - Annuler inscription
POST /registrations/:id/checkin - Check-in événement
POST /registrations/:id/checkout - Check-out événement
GET /users/me/registrations - Mes inscriptions
POST /registrations/:id/feedback - Donner feedback (premium détaillé)

// =============================================================================
// 🚀 PROJETS (3 controllers)
// =============================================================================

// ProjectController
GET /projects - Liste projets (filtres premium)
GET /projects/:id - Détails projet
POST /projects - Créer projet (limite selon plan)
PUT /projects/:id - Modifier projet
DELETE /projects/:id - Supprimer projet
GET /projects/featured - Projets en vedette
POST /projects/:id/join - Rejoindre projet (premium prioritaire)
GET /projects/premium - Projets collaboratifs premium ⭐ NOUVEAU

// ProjectContributorController
GET /projects/:id/contributors - Contributeurs projet
POST /projects/:id/contributors - Ajouter contributeur
PUT /projects/:id/contributors/:userId - Modifier rôle (premium pour rôles avancés)
DELETE /projects/:id/contributors/:userId - Retirer contributeur
GET /users/me/projects - Mes projets

// SuggestionController
GET /suggestions - Liste suggestions (filtres premium)
GET /suggestions/:id - Détails suggestion
POST /suggestions - Créer suggestion (limite selon plan)
PUT /suggestions/:id - Modifier suggestion
DELETE /suggestions/:id - Supprimer suggestion
POST /suggestions/:id/approve - Approuver (modérateurs)
POST /suggestions/:id/reject - Rejeter
GET /suggestions/premium-feedback - Retours premium ⭐ NOUVEAU

// =============================================================================
// 📊 STATISTIQUES (4 controllers)
// =============================================================================

// SearchLogController
POST /search/log - Enregistrer recherche
GET /search/stats - Statistiques recherches (détails premium)
GET /search/trending - Recherches tendance
GET /search/popular - Recherches populaires
GET /search/analytics - Analytics avancées (premium) ⭐ NOUVEAU

// UserActivityController
GET /users/me/activity - Mon activité (historique selon plan)
GET /users/:id/activity - Activité utilisateur
POST /activity/log - Enregistrer activité
GET /activity/recent - Activité récente globale
GET /activity/insights - Insights personnalisés (premium) ⭐ NOUVEAU

// WordUsageStatsController
GET /words/:id/stats - Statistiques d'un mot (détails premium)
GET /words/stats/popular - Mots populaires
GET /words/stats/trending - Mots tendance
POST /words/:id/stats/view - Log vue mot
GET /words/analytics - Analytics mots avancées (premium) ⭐ NOUVEAU

// DailyStatsController
GET /stats/daily - Statistiques quotidiennes (basique/premium)
GET /stats/weekly - Statistiques hebdomadaires
GET /stats/monthly - Statistiques mensuelles (premium)
GET /stats/dashboard - Dashboard admin
GET /stats/revenue - Stats revenus (admin) ⭐ NOUVEAU

// =============================================================================
// 📢 COMMUNICATION (3 controllers)
// =============================================================================

// NotificationController
GET /notifications - Mes notifications
GET /notifications/unread - Notifications non lues
POST /notifications/:id/read - Marquer comme lu
POST /notifications/read-all - Marquer toutes comme lues
DELETE /notifications/:id - Supprimer notification
GET /notifications/settings - Paramètres notifications (premium personnalisé)
PUT /notifications/settings - Modifier paramètres
GET /notifications/premium - Notifications premium ⭐ NOUVEAU

// NewsletterController
POST /newsletter/subscribe - S'abonner newsletter
POST /newsletter/unsubscribe - Se désabonner
PUT /newsletter/preferences - Modifier préférences (premium granulaire)
GET /newsletter/confirm/:token - Confirmer abonnement
POST /newsletter/send - Envoyer newsletter (admin)
GET /newsletter/stats - Statistiques (admin)
GET /newsletter/premium-content - Contenu newsletter premium ⭐ NOUVEAU

// AnnouncementController
GET /announcements - Annonces publiques
GET /announcements/:id - Détails annonce
POST /announcements - Créer annonce (admin)
PUT /announcements/:id - Modifier annonce
DELETE /announcements/:id - Supprimer annonce
POST /announcements/:id/view - Incrémenter vues
POST /announcements/:id/click - Incrémenter clics
POST /announcements/:id/dismiss - Fermer annonce

// =============================================================================
// 🛠️ ADMINISTRATION (3 controllers)
// =============================================================================

// ModeratorActionController
GET /moderation/actions - Actions de modération
POST /moderation/actions - Créer action
GET /moderation/queue - File de modération (outils premium)
POST /moderation/content/:type/:id/approve - Approuver contenu
POST /moderation/content/:type/:id/reject - Rejeter contenu
GET /moderation/premium-tools - Outils modération premium ⭐ NOUVEAU

// ReportedContentController
GET /reports - Contenus signalés
POST /content/:type/:id/report - Signaler contenu (détails premium)
PUT /reports/:id/resolve - Résoudre signalement
GET /reports/stats - Statistiques signalements
GET /reports/premium-analytics - Analytics signalements (admin) ⭐ NOUVEAU

// SystemSettingsController
GET /admin/settings - Paramètres système
PUT /admin/settings - Modifier paramètres
GET /admin/settings/:key - Paramètre spécifique
PUT /admin/settings/:key - Modifier paramètre spécifique
GET /admin/business-settings - Paramètres business ⭐ NOUVEAU
PUT /admin/plans-config - Configuration des plans ⭐ NOUVEAU

// =============================================================================
// 🔗 INTÉGRATIONS (2 controllers)
// =============================================================================

// APIKeyController
GET /users/me/api-keys - Mes clés API
POST /users/me/api-keys - Créer clé API (limite selon plan)
PUT /api-keys/:id - Modifier clé API
DELETE /api-keys/:id - Supprimer clé API
POST /api-keys/:id/regenerate - Régénérer clé
GET /api-keys/usage - Usage API (quota selon plan) ⭐ NOUVEAU
GET /api-keys/premium-features - Fonctionnalités API premium ⭐ NOUVEAU

// ExternalIntegrationController
GET /integrations - Intégrations disponibles (premium pour certaines)
POST /integrations/:service/connect - Connecter service
DELETE /integrations/:service/disconnect - Déconnecter
POST /integrations/:service/sync - Synchroniser
GET /integrations/premium - Intégrations premium ⭐ NOUVEAU

// =============================================================================
// 🔍 RECHERCHE & NAVIGATION (2 controllers)
// =============================================================================

// SearchController
GET /search - Recherche globale (résultats selon plan)
GET /search/words - Recherche mots (filtres premium)
GET /search/phrases - Recherche phrases (filtres premium)
GET /search/suggestions - Suggestions recherche
GET /search/autocomplete - Autocomplétion (premium plus de résultats)
GET /search/advanced - Recherche avancée (premium) ⭐ NOUVEAU

// ExploreController
GET /explore - Page d'exploration (contenu selon plan)
GET /explore/categories - Explorer par catégories
GET /explore/difficulty - Explorer par difficulté (niveaux premium)
GET /explore/random - Contenu aléatoire
GET /explore/premium - Exploration premium ⭐ NOUVEAU

// =============================================================================
// 📱 API MOBILE (1 controller)
// =============================================================================

// MobileAppController
GET /mobile/config - Configuration app mobile (fonctionnalités selon plan)
POST /mobile/device/register - Enregistrer device
PUT /mobile/device/update - Mettre à jour device
POST /mobile/push/test - Test notification push
GET /mobile/premium-features - Fonctionnalités mobile premium ⭐ NOUVEAU

// =============================================================================
// 📈 ANALYTICS & REPORTING (2 controllers)
// =============================================================================

// AnalyticsController
GET /analytics/overview - Vue d'ensemble (détails selon plan)
GET /analytics/content - Analytics contenu (métriques premium)
GET /analytics/users - Analytics utilisateurs
GET /analytics/engagement - Analytics engagement (premium détaillé)
POST /analytics/events - Logger événements
GET /analytics/revenue - Analytics revenus (admin) ⭐ NOUVEAU
GET /analytics/conversion - Analytics conversion (admin) ⭐ NOUVEAU

// ReportController
GET /reports/usage - Rapport d'usage (détails selon plan)
GET /reports/content - Rapport contenu
GET /reports/users - Rapport utilisateurs
POST /reports/generate - Générer rapport personnalisé (premium)
GET /reports/export/:format - Exporter rapport (premium pour formats avancés)
GET /reports/business - Rapports business (admin) ⭐ NOUVEAU

// =============================================================================
// 🎯 RÉSUMÉ QUANTITATIF FINAL
// =============================================================================

/*
📊 ARCHITECTURE FINALE :

✅ 45 Controllers principaux (42 + 3 business)
✅ ~350 endpoints API (~300 + 50 premium)
✅ CRUD complet pour toutes les entités
✅ Authentification et autorisation
✅ Système freemium intégré
✅ Recherche avancée et filtrage
✅ Analytics et reporting (+ business)
✅ API mobile optimisée
✅ Intégrations externes prêtes
✅ Modération et administration
✅ Notifications multi-canaux
✅ Monétisation complète

🆕 NOUVEAUTÉS BUSINESS :

💰 3 Controllers business (Plan, Subscription, Payment)
🎯 50+ endpoints premium ajoutés
📊 Analytics revenus et conversion
🔒 Contrôle d'accès par plan
📈 Fonctionnalités freemium natives
💎 Contenu exclusif premium
🚀 Système d'upgrade contextuel

💡 FONCTIONNALITÉS FREEMIUM INTÉGRÉES :

🆓 Plan gratuit : fonctionnalités de base
💎 Plan premium : accès complet + audio HD
🏆 Plan pro : outils avancés + API + analytics

Chaque endpoint vérifie maintenant les permissions
selon le plan utilisateur et suggère des upgrades
contextuels pour maximiser les conversions ! 🚀
*/