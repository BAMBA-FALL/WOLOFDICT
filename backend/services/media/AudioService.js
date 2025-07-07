// =============================================================================
// 🎵 AUDIOSERVICE - INTÉGRATION OPTIMISÉE AVEC LOGGERSERVICE
// =============================================================================

const logger = require('./LoggerService');
const FileUploadService = require('./FileUploadService');
const AudioRecording = require('../../models/media/AudioRecording');

class AudioService {
  constructor() {
    this.isInitialized = false;
    this.name = 'AudioService';
    this.fileUploadService = null;
    this.models = null;
    
    // Formats audio supportés (logique métier)
    this.supportedFormats = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/flac'];
    
    // Configuration métier audio
    this.config = {
      maxDuration: 300, // 5 minutes max
      minDuration: 1,   // 1 seconde min
      preferredBitrates: [128, 192, 256, 320], // kbps
      preferredSampleRates: [22050, 44100, 48000], // Hz
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
      totalPlays: 0,
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
        logger.info('FileUploadService connecté à AudioService');
      } else {
        logger.warn('FileUploadService non disponible - fonctionnalités limitées');
      }

      // Charger les modèles
      try {
        this.models = require('../models');
        logger.info('Modèles chargés dans AudioService');
      } catch (error) {
        logger.warn('Modèles non disponibles, mode mock activé');
      }

      await this.setup();
      await this.updateStats();
      
      this.isInitialized = true;

      // ✅ AVANT : logger.info('AudioService initialisé avec succès');
      // ✅ APRÈS : Log enrichi avec contexte
      logger.logService('AudioService', 'initialize', 'success', {
        supportedFormats: this.supportedFormats.length,
        hasFileUploadService: !!this.fileUploadService,
        hasModels: !!this.models,
        qualityThresholds: Object.keys(this.config.qualityThresholds).length,
        initialStats: this.stats
      });
      
    } catch (error) {
      // ✅ Log d'erreur enrichi
      logger.logService('AudioService', 'initialize', 'error', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async setup() {
    // Vérification des dossiers de stockage audio métier
    logger.debug('Configuration AudioService - Vérification des dossiers métier');
  }

  /**
   * 🎵 Upload enregistrement audio avec logique métier complète
   */
  async uploadAudioRecording(file, metadata) {
    const startTime = Date.now();

    try {
      if (!this.isInitialized) {
        throw new Error('AudioService non initialisé');
      }

      if (!this.fileUploadService) {
        throw new Error('FileUploadService non disponible');
      }

      // ✅ Log de début d'opération
      logger.logBusinessEvent('audio_upload_start', {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        contentType: metadata.content_type,
        userId: metadata.uploaded_by,
        userPlan: metadata.userPlan
      });

      logger.info('Upload enregistrement audio démarré', {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      });

      // 1. Validation métier audio
      await this.validateAudioFile(file, metadata);

      // 2. Traitement technique via FileUploadService
      const uploadResult = await this.fileUploadService.handleUpload(file, {
        processImage: false, // Pas d'image pour audio
        uploadToCloud: metadata.uploadToCloud || metadata.userPlan === 'premium',
        userPlan: metadata.userPlan || 'free',
        s3Options: {
          public: metadata.isPublic || false,
          metadata: {
            contentType: metadata.content_type,
            contentId: metadata.content_id,
            uploadedBy: metadata.uploaded_by
          }
        }
      });

      // 3. Analyse métier audio (durée, bitrate, etc.)
      const audioAnalysis = await this.analyzeAudioFile(file, uploadResult);
      
      // 4. Calcul score qualité métier
      const qualityScore = this.calculateAudioQuality(audioAnalysis);

      // 5. Création en base avec logique métier
      const recording = await this.createAudioRecording({
        ...metadata,
        file_path: uploadResult.cloud?.url || uploadResult.original.path,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        duration: audioAnalysis.duration,
        bitrate: audioAnalysis.bitrate,
        sample_rate: audioAnalysis.sampleRate,
        channels: audioAnalysis.channels,
        quality_score: qualityScore,
        processing_status: 'completed',
        technical_metadata: {
          uploadResult: uploadResult.original,
          cloudInfo: uploadResult.cloud,
          analysis: audioAnalysis
        }
      });

      // 6. Post-traitement métier
      await this.postProcessAudioRecording(recording, metadata);

      // 7. Mise à jour statistiques
      await this.updateStatsAfterUpload(recording);

      const duration = Date.now() - startTime;

      // ✅ Log de performance
      logger.logPerformance('audio_upload_duration', duration, {
        threshold: 5000, // 5 secondes
        fileSize: file.size,
        fileName: file.originalname
      });

      // ✅ Log de succès métier
      logger.logBusinessEvent('audio_upload_success', {
        fileName: file.originalname,
        duration: audioAnalysis.duration,
        quality: qualityScore,
        userId: metadata.uploaded_by,
        processingTime: duration
      });

      logger.info('Enregistrement audio créé avec succès', { 
        id: recording.id,
        duration: audioAnalysis.duration,
        quality: qualityScore,
        cloud_stored: !!uploadResult.cloud
      });

      return {
        recording,
        uploadResult,
        analysis: audioAnalysis,
        qualityScore
      };

    } catch (error) {
      // ✅ Log d'erreur métier avec contexte
      logger.logBusinessEvent('audio_upload_error', {
        fileName: file.originalname,
        fileSize: file.size,
        error: error.message,
        userId: metadata.uploaded_by,
        processingTime: Date.now() - startTime
      });

      logger.error('Erreur upload audio métier:', error.message);
      throw error;
    }
  }

  /**
   * 📊 Incrémenter compteur de lecture avec logging
   */
  async incrementPlayCount(recordingId) {
    try {
      const recording = await AudioRecording.findByPk(recordingId);
      if (recording) {
        await recording.incrementPlay();

        // ✅ Log événement métier
        logger.logBusinessEvent('audio_play', {
          audioId: recordingId,
          contentType: recording.content_type,
          contentId: recording.content_id,
          newPlayCount: recording.play_count
        });

        return recording;
      }
      throw new Error('Enregistrement non trouvé');
    } catch (error) {
      logger.logService('AudioService', 'incrementPlayCount', 'error', {
        recordingId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 📥 Incrémenter compteur de téléchargements
   */
  async incrementDownloadCount(recordingId) {
    try {
      const recording = await AudioRecording.findByPk(recordingId);
      if (recording) {
        await recording.incrementDownload();
        this.stats.totalDownloads++;

        // ✅ Log événement métier
        logger.logBusinessEvent('audio_download', {
          audioId: recordingId,
          contentType: recording.content_type,
          contentId: recording.content_id,
          newDownloadCount: recording.download_count
        });

        return recording;
      }
      throw new Error('Enregistrement non trouvé');
    } catch (error) {
      logger.logService('AudioService', 'incrementDownloadCount', 'error', {
        recordingId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ⭐ Définir enregistrement principal
   */
  async setPrimaryRecording(recordingId, contentType, contentId) {
    try {
      if (this.models && this.models.AudioRecording) {
        // Retirer le statut primary des autres enregistrements
        await this.models.AudioRecording.update(
          { is_primary: false },
          { where: { content_type: contentType, content_id: contentId } }
        );

        // Définir le nouveau primary
        const recording = await this.models.AudioRecording.findByPk(recordingId);
        if (recording) {
          recording.is_primary = true;
          await recording.save();
          
          // ✅ Log événement métier
          logger.logBusinessEvent('audio_primary_set', {
            audioId: recordingId,
            contentType,
            contentId
          });

          logger.info('Enregistrement défini comme principal', {
            id: recordingId,
            contentType,
            contentId
          });
          
          return recording;
        }
      }
      throw new Error('Enregistrement non trouvé');
    } catch (error) {
      logger.logService('AudioService', 'setPrimaryRecording', 'error', {
        recordingId,
        contentType,
        contentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ✅ Vérifier enregistrement
   */
  async verifyRecording(recordingId, verifierId) {
    try {
      if (this.models && this.models.AudioRecording) {
        const recording = await this.models.AudioRecording.findByPk(recordingId);
        if (recording) {
          recording.is_verified = true;
          recording.verified_by = verifierId;
          recording.verified_at = new Date();
          await recording.save();
          
          // ✅ Log événement métier
          logger.logBusinessEvent('audio_verified', {
            audioId: recordingId,
            verifierId: verifierId,
            contentType: recording.content_type
          });

          logger.info('Enregistrement vérifié', { id: recordingId, verifierId });
          return recording;
        }
      }
      throw new Error('Enregistrement non trouvé');
    } catch (error) {
      logger.logService('AudioService', 'verifyRecording', 'error', {
        recordingId,
        verifierId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 🔍 Récupérer enregistrements par contenu
   */
  async getRecordingsByContent(contentType, contentId) {
    try {
      if (this.models && this.models.AudioRecording) {
        return await this.models.AudioRecording.findByContent(contentType, contentId);
      }
      return [];
    } catch (error) {
      logger.logService('AudioService', 'getRecordingsByContent', 'error', {
        contentType,
        contentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * ⭐ Récupérer enregistrement principal
   */
  async getPrimaryRecording(contentType, contentId) {
    try {
      if (this.models && this.models.AudioRecording) {
        return await this.models.AudioRecording.findPrimary(contentType, contentId);
      }
      return null;
    } catch (error) {
      logger.logService('AudioService', 'getPrimaryRecording', 'error', {
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
   * ✅ Validation métier spécifique audio
   */
  async validateAudioFile(file, metadata) {
    // Validation format
    if (!this.supportedFormats.includes(file.mimetype)) {
      throw new Error(`Format audio non supporté: ${file.mimetype}. Formats autorisés: ${this.supportedFormats.join(', ')}`);
    }

    // Validation taille selon plan utilisateur
    const maxSize = this.getMaxFileSizeForPlan(metadata.userPlan);
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux. Taille max pour plan ${metadata.userPlan}: ${this.formatFileSize(maxSize)}`);
    }

    // Validation métadonnées métier
    if (!metadata.content_type || !metadata.content_id) {
      throw new Error('content_type et content_id requis pour les enregistrements audio');
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
    if (!this.models || !this.models.AudioRecording) return;

    const limits = {
      free: { daily: 5, monthly: 50 },
      premium: { daily: 20, monthly: 200 },
      pro: { daily: 100, monthly: 1000 }
    };

    const userLimits = limits[userPlan] || limits.free;
    
    // Vérifier uploads du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dailyCount = await this.models.AudioRecording.count({
      where: {
        uploaded_by: userId,
        created_at: { [require('sequelize').Op.gte]: today }
      }
    });

    if (dailyCount >= userLimits.daily) {
      // ✅ Log de limitation atteinte
      logger.logBusinessEvent('upload_limit_reached', {
        userId: userId,
        userPlan: userPlan,
        dailyCount: dailyCount,
        dailyLimit: userLimits.daily,
        limitType: 'daily_uploads'
      });

      throw new Error(`Limite quotidienne atteinte (${userLimits.daily} uploads/jour pour plan ${userPlan})`);
    }
  }

  /**
   * 🔍 Analyse métier du fichier audio
   */
  async analyzeAudioFile(file, uploadResult) {
    try {
      // Utiliser FFprobe si disponible, sinon analyse basique
      if (await this.hasFFprobe()) {
        return await this.analyzeWithFFprobe(uploadResult.original.path);
      } else {
        // Analyse basique via headers/métadonnées
        return await this.analyzeBasic(file, uploadResult);
      }
    } catch (error) {
      logger.warn('Erreur analyse audio, utilisation valeurs par défaut:', error.message);
      return this.getDefaultAudioAnalysis(file);
    }
  }

  /**
   * 🎯 Analyse avancée avec FFprobe
   */
  async analyzeWithFFprobe(filePath) {
    try {
      // TODO: Implémenter avec ffprobe
      // const ffprobe = require('ffprobe');
      // const info = await ffprobe(filePath);
      
      // Pour le moment, simulation
      return {
        duration: 30.5,
        bitrate: 128,
        sampleRate: 44100,
        channels: 2,
        codec: 'mp3',
        format: 'mpeg'
      };
    } catch (error) {
      throw new Error('Erreur analyse FFprobe: ' + error.message);
    }
  }

  /**
   * 📊 Analyse basique sans FFprobe
   */
  async analyzeBasic(file, uploadResult) {
    // Estimation basique basée sur la taille et le format
    const estimatedDuration = this.estimateDurationFromSize(file.size, file.mimetype);
    
    return {
      duration: estimatedDuration,
      bitrate: this.estimateBitrate(file.size, estimatedDuration),
      sampleRate: 44100, // Valeur par défaut
      channels: 2, // Stéréo par défaut
      codec: this.getCodecFromMimetype(file.mimetype),
      format: file.mimetype.split('/')[1]
    };
  }

  /**
   * 📈 Calcul score qualité métier
   */
  calculateAudioQuality(audioAnalysis) {
    let score = 0;
    
    // Critères bitrate (30 points max)
    if (audioAnalysis.bitrate >= 320) score += 30;
    else if (audioAnalysis.bitrate >= 256) score += 25;
    else if (audioAnalysis.bitrate >= 192) score += 20;
    else if (audioAnalysis.bitrate >= 128) score += 15;
    else score += 5;
    
    // Critères sample rate (25 points max)
    if (audioAnalysis.sampleRate >= 48000) score += 25;
    else if (audioAnalysis.sampleRate >= 44100) score += 20;
    else if (audioAnalysis.sampleRate >= 22050) score += 10;
    else score += 5;
    
    // Critères durée (25 points max)
    if (audioAnalysis.duration >= this.config.minDuration && audioAnalysis.duration <= this.config.maxDuration) {
      score += 25;
    } else if (audioAnalysis.duration > this.config.maxDuration) {
      score += 10; // Pénalité pour durée excessive
    } else {
      score += 5; // Pénalité pour durée trop courte
    }
    
    // Critères channels (10 points max)
    if (audioAnalysis.channels === 2) score += 10; // Stéréo
    else if (audioAnalysis.channels === 1) score += 7; // Mono
    else score += 3;
    
    // Critères format (10 points max)
    const formatScores = {
      'flac': 10, 'wav': 9, 'ogg': 8, 'mp4': 7, 'mpeg': 6, 'webm': 5
    };
    score += formatScores[audioAnalysis.format] || 3;
    
    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * 💾 Création enregistrement en base avec modèle
   */
  async createAudioRecording(data) {
    try {
      if (this.models && this.models.AudioRecording) {
        return await this.models.AudioRecording.create(data);
      } else {
        // Mode mock
        const mockRecording = {
          id: Date.now(),
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        };
        logger.warn('Mode mock: AudioRecording simulé', { id: mockRecording.id });
        return mockRecording;
      }
    } catch (error) {
      logger.error('Erreur création AudioRecording:', error.message);
      throw error;
    }
  }

  /**
   * 🔄 Post-traitement métier après upload
   */
  async postProcessAudioRecording(recording, metadata) {
    try {
      // Définir comme primary si demandé
      if (metadata.is_primary) {
        await this.setPrimaryRecording(recording.id, recording.content_type, recording.content_id);
      }

      // Indexation pour recherche
      await this.indexAudioForSearch(recording);

      // Notification aux modérateurs si qualité faible
      if (recording.quality_score < this.config.qualityThresholds.acceptable) {
        await this.notifyLowQualityAudio(recording);
      }

      // Traitement automatique selon le type de contenu
      await this.processAudioByContentType(recording);

    } catch (error) {
      logger.warn('Erreur post-traitement audio:', error.message);
      // Non-bloquant
    }
  }

  async indexAudioForSearch(recording) {
    // TODO: Implémenter indexation pour recherche
    logger.debug('Indexation audio pour recherche', { id: recording.id });
  }

  async notifyLowQualityAudio(recording) {
    // TODO: Implémenter notification modérateurs
    logger.warn('Audio de faible qualité détecté', { 
      id: recording.id, 
      quality: recording.quality_score 
    });
  }

  async processAudioByContentType(recording) {
    // Traitement spécifique selon le type de contenu
    switch (recording.content_type) {
      case 'word':
        await this.processWordAudio(recording);
        break;
      case 'phrase':
        await this.processPhraseAudio(recording);
        break;
      case 'proverb':
        await this.processProverbAudio(recording);
        break;
      default:
        logger.debug('Type de contenu audio non spécialisé:', recording.content_type);
    }
  }

  async processWordAudio(recording) {
    // Logique spécifique aux mots
    logger.debug('Traitement audio mot', { id: recording.id });
  }

  async processPhraseAudio(recording) {
    // Logique spécifique aux phrases
    logger.debug('Traitement audio phrase', { id: recording.id });
  }

  async processProverbAudio(recording) {
    // Logique spécifique aux proverbes
    logger.debug('Traitement audio proverbe', { id: recording.id });
  }

  // =============================================================================
  // 📊 STATISTIQUES ET ANALYTICS
  // =============================================================================

  async updateStats() {
    try {
      if (!this.models || !this.models.AudioRecording) return;

      const stats = await this.models.AudioRecording.findAll({
        attributes: [
          [this.models.sequelize.fn('COUNT', '*'), 'total'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.col('play_count')), 'plays'],
          [this.models.sequelize.fn('SUM', this.models.sequelize.col('download_count')), 'downloads'],
          [this.models.sequelize.fn('AVG', this.models.sequelize.col('quality_score')), 'avgQuality']
        ],
        raw: true
      });

      if (stats && stats[0]) {
        this.stats.totalUploads = parseInt(stats[0].total) || 0;
        this.stats.totalPlays = parseInt(stats[0].plays) || 0;
        this.stats.totalDownloads = parseInt(stats[0].downloads) || 0;
        this.stats.averageQuality = parseFloat(stats[0].avgQuality) || 0;
      }

    } catch (error) {
      logger.error('Erreur mise à jour stats audio:', error.message);
    }
  }

  async updateStatsAfterUpload(recording) {
    this.stats.totalUploads++;
    
    // Mise à jour distribution formats
    const format = recording.mime_type;
    this.stats.formatDistribution[format] = (this.stats.formatDistribution[format] || 0) + 1;
    
    // Recalcul qualité moyenne
    this.stats.averageQuality = ((this.stats.averageQuality * (this.stats.totalUploads - 1)) + recording.quality_score) / this.stats.totalUploads;
  }

  getAudioStats() {
    return {
      ...this.stats,
      config: this.config,
      supportedFormats: this.supportedFormats
    };
  }

  // =============================================================================
  // 🔧 MÉTHODES UTILITAIRES
  // =============================================================================

  getMaxFileSizeForPlan(userPlan) {
    const limits = {
      free: 10 * 1024 * 1024,      // 10MB
      premium: 50 * 1024 * 1024,   // 50MB
      pro: 100 * 1024 * 1024       // 100MB
    };
    return limits[userPlan] || limits.free;
  }

  estimateDurationFromSize(fileSize, mimetype) {
    // Estimation basique : bitrate moyen selon format
    const avgBitrates = {
      'audio/mpeg': 128,
      'audio/mp4': 128,
      'audio/wav': 1411,
      'audio/flac': 800,
      'audio/ogg': 96,
      'audio/webm': 96
    };
    
    const bitrate = avgBitrates[mimetype] || 128;
    return (fileSize * 8) / (bitrate * 1000); // secondes
  }

  estimateBitrate(fileSize, duration) {
    if (duration <= 0) return 128;
    return Math.round((fileSize * 8) / (duration * 1000));
  }

  getCodecFromMimetype(mimetype) {
    const codecs = {
      'audio/mpeg': 'mp3',
      'audio/mp4': 'aac',
      'audio/wav': 'pcm',
      'audio/flac': 'flac',
      'audio/ogg': 'vorbis',
      'audio/webm': 'opus'
    };
    return codecs[mimetype] || 'unknown';
  }

  getDefaultAudioAnalysis(file) {
    return {
      duration: this.estimateDurationFromSize(file.size, file.mimetype),
      bitrate: 128,
      sampleRate: 44100,
      channels: 2,
      codec: this.getCodecFromMimetype(file.mimetype),
      format: file.mimetype.split('/')[1]
    };
  }

  formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  async hasFFprobe() {
    try {
      // Vérifier si ffprobe est disponible
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        exec('ffprobe -version', (error) => {
          resolve(!error);
        });
      });
    } catch {
      return false;
    }
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
      stats: this.stats,
      config: this.config,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new AudioService();