const bcrypt = require('bcryptjs');
const { 
  User, 
  UserPreference, 
  Contribution, 
  Word, 
  Translation, 
  Example, 
  Favorite,
  Notification,
  VocabularyList
} = require('../models');
const { Op } = require('sequelize');

const userController = {
  /**
   * Get user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const user = await User.findByPk(userId, {
        attributes: { 
          exclude: ['password'] 
        },
        include: [
          { 
            model: UserPreference,
            attributes: ['interfaceLanguage', 'emailNotifications', 'theme']
          },
          {
            model: Contribution,
            limit: 10,
            order: [['createdAt', 'DESC']],
            include: [
              { model: Word, attributes: ['term'] },
              { model: Translation, attributes: ['text'] },
              { model: Example, attributes: ['textWolof'] }
            ]
          },
          {
            model: Favorite,
            limit: 5,
            include: [
              { 
                model: Word, 
                attributes: ['term', 'pronunciation'] 
              }
            ]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Get user stats
      const stats = {
        wordsAdded: await Word.count({ where: { createdBy: userId } }),
        translationsAdded: await Translation.count({ where: { createdBy: userId } }),
        examplesAdded: await Example.count({ where: { createdBy: userId } }),
        vocabularyLists: await VocabularyList.count({ where: { creatorId: userId } })
      };

      res.status(200).json({
        success: true,
        user: {
          ...user.toJSON(),
          stats
        }
      });
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error fetching user profile',
        error: error.message 
      });
    }
  },

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        firstName, 
        lastName, 
        email, 
        speciality,
        interfaceLanguage,
        emailNotifications,
        theme
      } = req.body;

      // Find user
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Validate email uniqueness if changed
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(409).json({ 
            success: false, 
            message: 'Email already in use' 
          });
        }
      }

      // Update user
      await user.update({
        firstName,
        lastName,
        email,
        speciality
      });

      // Update user preferences
      const [userPreference, created] = await UserPreference.findOrCreate({
        where: { userId },
        defaults: {
          interfaceLanguage,
          emailNotifications,
          theme
        }
      });

      if (!created) {
        await userPreference.update({
          interfaceLanguage,
          emailNotifications,
          theme
        });
      }

      // Create notification
      await Notification.create({
        userId,
        type: 'system',
        content: 'Votre profil a été mis à jour avec succès.',
        link: '/profile'
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          ...user.toJSON(),
          userPreference: userPreference.toJSON()
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error updating profile',
        error: error.message 
      });
    }
  },

  /**
   * Changer le mot de passe de l'utilisateur
   * @param {Object} req - Objet de requête Express
   * @param {Object} res - Objet de réponse Express
   */
  changerMotDePasse: async (req, res) => {
    try {
      const userId = req.user.id;
      const { ancienMotDePasse, nouveauMotDePasse } = req.body;

      // Vérifier que tous les champs sont présents
      if (!ancienMotDePasse || !nouveauMotDePasse) {
        return res.status(400).json({ 
          success: false, 
          message: 'Tous les champs sont requis' 
        });
      }

      // Trouver l'utilisateur
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'Utilisateur non trouvé' 
        });
      }

      // Vérifier l'ancien mot de passe
      const estMotDePasseValide = await bcrypt.compare(ancienMotDePasse, user.password);
      
      if (!estMotDePasseValide) {
        return res.status(401).json({ 
          success: false, 
          message: 'Ancien mot de passe incorrect' 
        });
      }

      // Vérifier la force du nouveau mot de passe
      if (nouveauMotDePasse.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: 'Le mot de passe doit contenir au moins 8 caractères' 
        });
      }

      // Hacher le nouveau mot de passe
      const salt = await bcrypt.genSalt(10);
      const nouveauMotDePasseHache = await bcrypt.hash(nouveauMotDePasse, salt);

      // Mettre à jour le mot de passe
      await user.update({ password: nouveauMotDePasseHache });

      // Créer une notification
      await Notification.create({
        userId,
        type: 'system',
        content: 'Votre mot de passe a été modifié avec succès.',
        link: '/profile'
      });

      res.status(200).json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      });
    } catch (error) {
      console.error('Erreur de changement de mot de passe :', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur lors du changement de mot de passe',
        error: error.message 
      });
    }
  },

  /**
   * Obtenir les contributions de l'utilisateur
   * @param {Object} req - Objet de requête Express
   * @param {Object} res - Objet de réponse Express
   */
  obtenirContributions: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limite = 10, type } = req.query;

      // Paramètres de pagination
      const offset = (page - 1) * limite;

      // Conditions de filtrage
      const conditions = { 
        where: { createdBy: userId } 
      };

      // Options de requête
      const options = {
        offset,
        limit: parseInt(limite),
        order: [['createdAt', 'DESC']]
      };

      // Filtrer par type de contribution si spécifié
      if (type) {
        conditions.where.entityType = type;
      }

      // Récupérer les contributions
      const { count, rows: contributions } = await Contribution.findAndCountAll({
        ...conditions,
        ...options,
        include: [
          { model: Word, attributes: ['term'] },
          { model: Translation, attributes: ['text'] },
          { model: Example, attributes: ['textWolof'] }
        ]
      });

      res.status(200).json({
        success: true,
        contributions,
        pagination: {
          total: count,
          page: parseInt(page),
          limite: parseInt(limite),
          totalPages: Math.ceil(count / limite)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des contributions :', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur lors de la récupération des contributions',
        error: error.message 
      });
    }
  },

  /**
   * Obtenir les listes de vocabulaire de l'utilisateur
   * @param {Object} req - Objet de requête Express
   * @param {Object} res - Objet de réponse Express
   */
  obtenirListesVocabulaire: async (req, res) => {
    try {
      const userId = req.user.id;
      const { page = 1, limite = 10, difficulty } = req.query;

      // Paramètres de pagination
      const offset = (page - 1) * limite;

      // Conditions de requête
      const conditions = { 
        where: { 
          creatorId: userId 
        } 
      };

      // Filtrer par difficulté si spécifié
      if (difficulty) {
        conditions.where.difficulty = difficulty;
      }

      // Options de requête
      const options = {
        offset,
        limit: parseInt(limite),
        order: [['createdAt', 'DESC']]
      };

      // Récupérer les listes de vocabulaire
      const { count, rows: vocabularyLists } = await VocabularyList.findAndCountAll({
        ...conditions,
        ...options,
        include: [
          { 
            model: Word, 
            as: 'words',
            through: { attributes: ['notes', 'mastered'] }
          }
        ]
      });

      res.status(200).json({
        success: true,
        vocabularyLists,
        pagination: {
          total: count,
          page: parseInt(page),
          limite: parseInt(limite),
          totalPages: Math.ceil(count / limite)
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des listes de vocabulaire :', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur lors de la récupération des listes de vocabulaire',
        error: error.message 
      });
    }
  },

  /**
   * Créer une liste de vocabulaire
   * @param {Object} req - Objet de requête Express
   * @param {Object} res - Objet de réponse Express
   */
  creerListeVocabulaire: async (req, res) => {
    try {
      const userId = req.user.id;
      const { 
        name, 
        description, 
        isPublic = false, 
        difficulty = 'mixte', 
        category,
        mots 
      } = req.body;

      // Créer la liste de vocabulaire
      const nouvelleListeVocabulaire = await VocabularyList.create({
        name,
        description,
        isPublic,
        difficulty,
        category,
        creatorId: userId
      });

      // Ajouter des mots à la liste si fournis
      if (mots && mots.length > 0) {
        const itemsListe = mots.map((motId, index) => ({
          vocabularyListId: nouvelleListeVocabulaire.id,
          wordId: motId,
          order: index
        }));

        await VocabularyListItem.bulkCreate(itemsListe);
      }

      // Créer une notification
      await Notification.create({
        userId,
        type: 'system',
        content: `Nouvelle liste de vocabulaire créée : ${name}`,
        link: `/vocabulary-lists/${nouvelleListeVocabulaire.id}`
      });

      res.status(201).json({
        success: true,
        message: 'Liste de vocabulaire créée avec succès',
        listeVocabulaire: nouvelleListeVocabulaire
      });
    } catch (error) {
      console.error('Erreur lors de la création de la liste de vocabulaire :', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur serveur lors de la création de la liste de vocabulaire',
        error: error.message 
      });
    }
  }
};

module.exports = userController;