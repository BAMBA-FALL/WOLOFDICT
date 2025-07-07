// =============================================================================
// 🖼️ IMAGESERVICE - INTÉGRATION OPTIMISÉE AVEC LOGGERSERVICE
// =============================================================================

const logger = require('./LoggerService');
const FileUploadService = require('./FileUploadService');
const Image = require('../../models/media/Image');

class ImageService {
  constructor() {
    this.isInitialized = false;
    this.name = 'ImageService';
    this.fileUploadService = null;
    this.models = null;
    
    // Formats image supportés (logique métier)
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
    
    // Tailles de thumbnails métier
    this.thumbnailSizes = {
      tiny: { width: 64, height: 64 },
      small: { width: 150, height: 150 },
      medium: { width: 300, height: 300 },
      large: { width: 600, height: 600 },
      xlarge: { width: 1200, height: 1200 }
    };
    
    // Configuration métier image
    this.config = {
      maxFileSize: {
        free: 5 * 1024 * 1024,      // 5MB
        premium: 20 * 1024 * 1024,  // 20MB
        pro: 50 * 1024 * 1024       // 50MB
      },
      qualityThresholds: {
        excellent: 90,
        good: 70,
        acceptable: 50,
        poor: 30
      }
    };
    
    // Statistiques métier
    this.stats = {
      totalUploads: 0,
      totalViews: 0,
      totalDownloads: 0,
      averageQuality: 0,
      formatDistribution: {}
    };
  }

  async initialize() {
    try {
      // Initialiser FileUploadService si nécessaire
      if (FileUploadService && !FileUploadService.isInitialized) {
        await FileUploadService.initialize();
      }
      this.fileUploadService = FileUploadService;
      
      if (this.fileUploadService && this.fileUploadService.isInitialized) {
        logger.info('FileUploadService connecté à ImageService');
      } else {
        logger.warn('FileUploadService non disponible - fonctionnalités limitées');
      }

      // Charger les modèles
      try {
        this.models = require('../models');
        logger.info('Modèles chargés dans ImageService');
      } catch (error) {
        logger.warn('Modèles non disponibles, mode mock activé');
      }

      await this.setup();
      await this.updateStats();
      
      this.isInitialized = true;

      // ✅ AVANT : logger.info('ImageService initialisé avec succès');
      // ✅ APRÈS : Log enrichi avec contexte
      logger.logService('ImageService', 'initialize', 'success', {
        supportedFormats: this.supportedFormats.length,
        hasFileUploadService: !!this.fileUploadService,
        thumbnailSizes: Object.keys(this.thumbnailSizes).length,
        hasModels: !!this.models,
        qualityThresholds: Object.keys(this.config.qualityThresholds).length,
        initialStats: this.stats
      });
      
    } catch (error) {
      // ✅ Log d'erreur enrichi
      logger.logService('ImageService', 'initialize', 'error', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async setup() {
    // Vérification des dossiers de stockage image métier
    logger.debug('Configuration ImageService - Vérification des dossiers métier');
  }

  /**
   * 🖼️ Upload image avec logique métier complète
   */
  async uploadImage(file, metadata) {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        throw new Error('ImageService non initialisé');
      }

      if (!this.fileUploadService) {
        throw new Error('FileUploadService non disponible');
      }

      // ✅ Log de début avec validation
      logger.logBusinessEvent('image_upload_start', {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        contentType: metadata.content_type,
        userId: metadata.uploaded_by,
        userPlan: metadata.userPlan
      });

      logger.info('Upload image démarré', {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      // Validation métier
      await this.validateImageFile(file, metadata);

      // Traitement technique
      const uploadResult = await this.fileUploadService.handleUpload(file, {
        processImage: true,
        uploadToCloud: metadata.uploadToCloud || metadata.userPlan === 'premium',
        userPlan: metadata.userPlan || 'free',
        s3Options: {
          public: metadata.isPublic || true,
          metadata: {
            contentType: metadata.content_type,
            contentId: metadata.content_id,
            uploadedBy: metadata.uploaded_by
          }
        }
      });

      // Analyse et thumbnails
      const imageAnalysis = await this.analyzeImageFile(file, uploadResult);
      const businessThumbnails = await this.generateBusinessThumbnails(uploadResult, metadata);
      const qualityScore = this.calculateImageQuality(imageAnalysis);

      // Création en base avec logique métier
      const image = await this.createImage({
        ...metadata,
        file_path: uploadResult.cloud?.url || uploadResult.original.path,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        width: imageAnalysis.width,
        height: imageAnalysis.height,
        aspect_ratio: imageAnalysis.aspectRatio,
        color_space: imageAnalysis.colorSpace,
        has_alpha: imageAnalysis.hasAlpha,
        quality_score: qualityScore,
        processing_status: 'completed',
        thumbnails: businessThumbnails,
        technical_metadata: {
          uploadResult: uploadResult.original,
          cloudInfo: uploadResult.cloud,
          analysis: imageAnalysis
        }
      });

      // Post-traitement métier
      await this.postProcessImage(image, metadata);

      // Mise à jour statistiques
      await this.updateStatsAfterUpload(image);

      const processingTime = Date.now() - startTime;

      // ✅ Log de performance avec seuils
      logger.logPerformance('image_processing_duration', processingTime, {
        threshold: 3000, // 3 secondes
        fileSize: file.size,
        dimensions: `${imageAnalysis.width}x${imageAnalysis.height}`,
        format: file.mimetype
      });

      // ✅ Log de succès métier détaillé
      logger.logBusinessEvent('image_upload_success', {
        fileName: file.originalname,
        dimensions: `${imageAnalysis.width}x${imageAnalysis.height}`,
        qualityScore: qualityScore,
        thumbnailsGenerated: Object.keys(businessThumbnails).length,
        cloudStored: !!uploadResult.cloud,
        userId: metadata.uploaded_by,
        processingTime: processingTime
      });

      logger.info('Image créée avec succès', { 
        id: image.id,
        dimensions: `${imageAnalysis.width}x${imageAnalysis.height}`,
        quality: qualityScore,
        cloud_stored: !!uploadResult.cloud
      });

      return { image, uploadResult, analysis: imageAnalysis };

    } catch (error) {
      // ✅ Log d'erreur avec diagnostic
      logger.logBusinessEvent('image_upload_error', {
        fileName: file.originalname,
        fileSize: file.size,
        error: error.message,
        errorType: error.constructor.name,
        userId: metadata.uploaded_by,
        processingTime: Date.now() - startTime,
        validationPassed: !error.message.includes('Validation')
      });

      logger.error('Erreur upload image métier:', error.message);
      throw error;
    }
  }

  /**
   * 👁️ Incrémenter compteur de vues avec logging
   */
  async incrementViewCount(imageId) {
    try {
      const image = await this.models.Image.findByPk(imageId);
      if (image) {
        await image.incrementView();
        this.stats.totalViews++;

        // ✅ Log événement métier
        logger.logBusinessEvent('image_view', {
          imageId: imageId,
          contentType: image.content_type,
          contentId: image.content_id,
          newViewCount: image.view_count
        });

        return image;
      }
      throw new Error('Image non trouvée');
    } catch (error) {
      logger.logService('ImageService', 'incrementViewCount', 'error', {
        imageId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 📥 Incrémenter compteur de téléchargements
   */
  async incrementDownloadCount(imageId) {
    try {
      const image = await this.models.Image.findByPk(imageId);
      if (image) {
        await image.incrementDownload();
        this.stats.totalDownloads++;

        // ✅ Log événement métier
        logger.logBusinessEvent('image_download', {
          imageId: imageId,
          contentType: image.content_type,
          contentId: image.content_id,
          newDownloadCount: image.download_count
        });

        return image;
      }
      throw new Error('Image non trouvée');
    } catch (error) {
      logger.logService('ImageService', 'incrementDownloadCount', 'error', {
        imageId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ⭐ Définir image principale
   */
  async setPrimaryImage(imageId, contentType, contentId) {
    try {
      if (this.models && this.models.Image) {
        // Retirer le statut primary des autres images
        await this.models.Image.update(
          { is_primary: false },
          { where: { content_type: contentType, content_id: contentId } }
        );

        // Définir la nouvelle primary
        const image = await this.models.Image.findByPk(imageId);
        if (image) {
          image.is_primary = true;
          await image.save();
          
          // ✅ Log événement métier
          logger.logBusinessEvent('image_primary_set', {
            imageId: imageId,
            contentType,
            contentId
          });

          logger.info('Image définie comme principale', {
            id: imageId,
            contentType,
            contentId
          });
          
          return image;
        }
      }
      throw new Error('Image non trouvée');
    } catch (error) {
      logger.logService('ImageService', 'setPrimaryImage', 'error', {
        imageId,
        contentType,
        contentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 🔍 Récupérer images par contenu
   */
  async getImagesByContent(contentType, contentId) {
    try {
      if (this.models && this.models.Image) {
        return await this.models.Image.findByContent(contentType, contentId);
      }
      return [];
    } catch (error) {
      logger.logService('ImageService', 'getImagesByContent', 'error', {
        contentType,
        contentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ⭐ Récupérer image principale
   */
  async getPrimaryImage(contentType, contentId) {
    try {
      if (this.models && this.models.Image) {
        return await this.models.Image.findPrimary(contentType, contentId);
      }
      return null;
    } catch (error) {
      logger.logService('ImageService', 'getPrimaryImage', 'error', {
        contentType,
        contentId,
        error: error.message
      });
      throw error;
    }
  }

  // =============================================================================
  // 🛠️ MÉTHODES UTILITAIRES MÉTIER
  // =============================================================================

  /**
   * ✅ Validation métier spécifique image
   */
  async validateImageFile(file, metadata) {
    // Validation format
    if (!this.supportedFormats.includes(file.mimetype)) {
      throw new Error(`Format image non supporté: ${file.mimetype}. Formats autorisés: ${this.supportedFormats.join(', ')}`);
    }

    // Validation taille selon plan utilisateur
    const maxSize = this.config.maxFileSize[metadata.userPlan] || this.config.maxFileSize.free;
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux. Taille max pour plan ${metadata.userPlan}: ${this.formatFileSize(maxSize)}`);
    }

    // Validation métadonnées métier
    if (!metadata.content_type) {
      throw new Error('content_type requis pour les images');
    }

    // Validation limites par utilisateur
    if (metadata.uploaded_by) {
      await this.validateUserUploadLimits(metadata.uploaded_by, metadata.userPlan);
    }
  }

  /**
   * 📈 Validation des limites utilisateur
   */
  async validateUserUploadLimits(userId, userPlan) {
    try {
      // Vérification des limites...
      const dailyCount = await this.models.Image.count({
        where: {
          uploaded_by: userId,
          created_at: {
            [require('sequelize').Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const limits = {
        free: { daily: 10, monthly: 100 },
        premium: { daily: 50, monthly: 500 },
        pro: { daily: 200, monthly: 2000 }
      };

      const userLimits = limits[userPlan] || limits.free;
      
      if (dailyCount >= userLimits.daily) {
        // ✅ Log de limitation atteinte
        logger.logBusinessEvent('upload_limit_reached', {
          userId: userId,
          userPlan: userPlan,
          dailyCount: dailyCount,
          dailyLimit: userLimits.daily,
          limitType: 'daily_uploads'
        });

        throw new Error(`Limite quotidienne atteinte`);
      }
    } catch (error) {
      if (error.message.includes('Limite')) {
        // ✅ Log spécifique pour les limites
        logger.logAudit('upload_limit_violation', userId, 'daily_uploads', 'denied', {
          userPlan: userPlan,
          attemptedAction: 'image_upload'
        });
      }
      throw error;
    }
  }

  /**
   * 🔍 Analyse métier du fichier image
   */
  async analyzeImageFile(file, uploadResult) {
    try {
      // TODO: Utiliser sharp ou jimp pour analyse réelle
      // Pour le moment, simulation
      return {
        width: 1920,
        height: 1080,
        aspectRatio: 1.7778,
        colorSpace: 'srgb',
        hasAlpha: false,
        channels: 3,
        density: 72
      };
    } catch (error) {
      logger.warn('Erreur analyse image, utilisation valeurs par défaut:', error.message);
      return this.getDefaultImageAnalysis(file);
    }
  }

  /**
   * 🖼️ Génération des thumbnails métier
   */
  async generateBusinessThumbnails(uploadResult, metadata) {
    try {
      const thumbnails = {};
      
      // Génération selon le plan utilisateur
      const sizesToGenerate = this.getThumbnailSizesForPlan(metadata.userPlan);
      
      for (const sizeName of sizesToGenerate) {
        const size = this.thumbnailSizes[sizeName];
        if (size) {
          // TODO: Implémenter génération réelle avec sharp
          thumbnails[sizeName] = `thumbnails/${sizeName}/${uploadResult.original.filename}`;
        }
      }
      
      return thumbnails;
    } catch (error) {
      logger.warn('Erreur génération thumbnails:', error.message);
      return {};
    }
  }

  /**
   * 📈 Calcul score qualité métier
   */
  calculateImageQuality(imageAnalysis) {
    let score = 0;
    
    // Critères résolution (40 points max)
    const pixels = imageAnalysis.width * imageAnalysis.height;
    if (pixels >= 3840 * 2160) score += 40; // 4K+
    else if (pixels >= 1920 * 1080) score += 35; // FullHD
    else if (pixels >= 1280 * 720) score += 25; // HD
    else if (pixels >= 800 * 600) score += 15; // Standard
    else score += 5; // Petite
    
    // Critères aspect ratio (15 points max)
    const ratio = imageAnalysis.aspectRatio;
    if (ratio >= 0.8 && ratio <= 1.2) score += 15; // Carré/proche carré
    else if (ratio >= 1.3 && ratio <= 1.8) score += 12; // 16:9, 4:3
    else score += 8; // Autres ratios
    
    // Critères espace couleur (15 points max)
    if (imageAnalysis.colorSpace === 'srgb') score += 15;
    else if (imageAnalysis.colorSpace === 'adobe-rgb') score += 12;
    else score += 8;
    
    // Critères canaux (15 points max)
    if (imageAnalysis.channels >= 3) score += 15; // Couleur
    else score += 8; // Niveaux de gris
    
    // Critères transparence (15 points max)
    if (imageAnalysis.hasAlpha) score += 10; // Avec alpha
    else score += 15; // Sans alpha (plus simple à traiter)
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 💾 Création image en base avec modèle
   */
  async createImage(data) {
    try {
      if (this.models && this.models.Image) {
        return await this.models.Image.create(data);
      } else {
        // Mode mock
        const mockImage = {
          id: Date.now(),
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        };
        logger.warn('Mode mock: Image simulée', { id: mockImage.id });
        return mockImage;
      }
    } catch (error) {
      logger.error('Erreur création Image:', error.message);
      throw error;
    }
  }

  /**
   * 🔄 Post-traitement métier après upload
   */
  async postProcessImage(image, metadata) {
    try {
      // Définir comme primary si demandé
      if (metadata.is_primary) {
        await this.setPrimaryImage(image.id, image.content_type, image.content_id);
      }

      // Indexation pour recherche
      await this.indexImageForSearch(image);

      // Notification aux modérateurs si qualité faible
      if (image.quality_score < this.config.qualityThresholds.acceptable) {
        await this.notifyLowQualityImage(image);
      }

      // Traitement automatique des tags
      await this.processImageTags(image);

    } catch (error) {
      logger.warn('Erreur post-traitement image:', error.message);
      // Non-bloquant
    }
  }

  async indexImageForSearch(image) {
    // TODO: Implémenter indexation pour recherche
    logger.debug('Indexation image pour recherche', { id: image.id });
  }

  async notifyLowQualityImage(image) {
    // TODO: Implémenter notification modérateurs
    logger.warn('Image de faible qualité détectée', { 
      id: image.id, 
      quality: image.quality_score 
    });
  }

  async processImageTags(image) {
    // TODO: Implémenter traitement automatique des tags
    logger.debug('Traitement tags image', { id: image.id });
  }

  // =============================================================================
  // 📊 STATISTIQUES ET ANALYTICS
  // =============================================================================

  async updateStats() {
    try {
      if (!this.models || !this.models.Image) return;

      const stats = await this.models.Image.findAll({
        attributes: [
          [this.models.sequelize.fn('COUNT', '*'), 'total'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.col('view_count')), 'views'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.col('download_count')), 'downloads'],
          [this.models.sequelize.fn('AVG', this.models.sequelize.col('quality_score')), 'avgQuality']
        ],
        raw: true
      });

      if (stats && stats[0]) {
        this.stats.totalUploads = parseInt(stats[0].total) || 0;
        this.stats.totalViews = parseInt(stats[0].views) || 0;
        this.stats.totalDownloads = parseInt(stats[0].downloads) || 0;
        this.stats.averageQuality = parseFloat(stats[0].avgQuality) || 0;
      }

    } catch (error) {
      logger.error('Erreur mise à jour stats image:', error.message);
    }
  }

  async updateStatsAfterUpload(image) {
    this.stats.totalUploads++;
    
    // Mise à jour distribution formats
    const format = image.mime_type;
    this.stats.formatDistribution[format] = (this.stats.formatDistribution[format] || 0) + 1;
    
    // Recalcul qualité moyenne
    this.stats.averageQuality = ((this.stats.averageQuality * (this.stats.totalUploads - 1)) + image.quality_score) / this.stats.totalUploads;
  }

  getImageStats() {
    return {
      ...this.stats,
      config: this.config,
      supportedFormats: this.supportedFormats
    };
  }

  // =============================================================================
  // 🔧 MÉTHODES UTILITAIRES
  // =============================================================================

  getThumbnailSizesForPlan(userPlan) {
    const planSizes = {
      free: ['tiny', 'small'],
      premium: ['tiny', 'small', 'medium', 'large'],
      pro: ['tiny', 'small', 'medium', 'large', 'xlarge']
    };
    return planSizes[userPlan] || planSizes.free;
  }

  getDefaultImageAnalysis(file) {
    return {
      width: 1920,
      height: 1080,
      aspectRatio: 1.7778,
      colorSpace: 'srgb',
      hasAlpha: false,
      channels: 3,
      density: 72
    };
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  getSizeCategory(image) {
    if (!image.width || !image.height) return 'Unknown';
    
    const pixels = image.width * image.height;
    if (pixels >= 3840 * 2160) return '4K+';
    if (pixels >= 1920 * 1080) return 'FullHD';
    if (pixels >= 1280 * 720) return 'HD';
    if (pixels >= 800 * 600) return 'Standard';
    return 'Small';
  }

  // =============================================================================
  // 🔧 ADMINISTRATION ET MAINTENANCE
  // =============================================================================

  async cleanup() {
    this.isInitialized = false;
    logger.info(this.name + ' nettoyé');
  }

  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      hasFileUploadService: !!this.fileUploadService?.isInitialized,
      hasModels: !!this.models,
      supportedFormats: this.supportedFormats,
      thumbnailSizes: this.thumbnailSizes,
      stats: this.stats,
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ImageService();