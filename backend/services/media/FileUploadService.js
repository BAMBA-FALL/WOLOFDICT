// =============================================================================
// 🌍 WOLOFDICT - FILE UPLOAD SERVICE TECHNIQUE PUR
// Service technique d'upload avec Multer + AWS S3 + Sharp (pas de logique métier)
// =============================================================================

const path = require('path');
const fs = require('fs').promises;
const logger = require('./LoggerService');

class FileUploadService {
  constructor() {
    this.isInitialized = false;
    this.name = 'FileUploadService';
    this.multer = null;
    this.s3 = null;
    this.sharp = null;
    
    // Configuration technique pure
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    
    // Types MIME techniques (pas de logique métier)
    this.allowedMimeTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/flac'],
      document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    };
    
    // Statistiques techniques
    this.stats = {
      totalUploads: 0,
      totalProcessed: 0,
      totalErrors: 0,
      s3Uploads: 0
    };
  }

  async initialize() {
    try {
      // Charger Multer (requis)
      try {
        this.multer = require('multer');
        logger.info('Multer chargé pour upload de fichiers');
      } catch (error) {
        logger.error('Multer requis pour FileUploadService');
        throw new Error('Multer non disponible');
      }

      // Charger Sharp pour traitement d'images (optionnel)
      try {
        this.sharp = require('sharp');
        logger.info('Sharp chargé pour traitement d\'images');
      } catch (error) {
        logger.warn('Sharp non disponible - traitement d\'images limité');
      }

      // Charger AWS S3 si configuré (optionnel)
      try {
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          const AWS = require('aws-sdk');
          this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'us-east-1'
          });
          logger.info('AWS S3 configuré pour stockage cloud');
        }
      } catch (error) {
        logger.warn('AWS S3 non configuré - stockage local uniquement');
      }

      // Créer les dossiers d'upload
      await this.createUploadDirectories();

      // Configurer Multer
      this.setupMulter();
      
      this.isInitialized = true;
      logger.info('FileUploadService initialisé avec succès', {
        hasSharp: !!this.sharp,
        hasS3: !!this.s3,
        uploadPath: this.uploadPath
      });
      
    } catch (error) {
      logger.error('Erreur initialisation FileUploadService:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🏗️ CONFIGURATION TECHNIQUE
  // =============================================================================

  async createUploadDirectories() {
    try {
      const directories = [
        this.uploadPath,
        path.join(this.uploadPath, 'images'),
        path.join(this.uploadPath, 'audio'),
        path.join(this.uploadPath, 'documents'),
        path.join(this.uploadPath, 'temp'),
        path.join(this.uploadPath, 'processed')
      ];

      for (const dir of directories) {
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir, { recursive: true });
          logger.debug(`Dossier créé: ${dir}`);
        }
      }
    } catch (error) {
      logger.error('Erreur création dossiers upload:', error.message);
      throw error;
    }
  }

  setupMulter() {
    // Configuration stockage technique
    const storage = this.multer.diskStorage({
      destination: (req, file, cb) => {
        let uploadDir = this.uploadPath;
        
        // Tri technique par type MIME
        if (file.mimetype.startsWith('image/')) {
          uploadDir = path.join(this.uploadPath, 'images');
        } else if (file.mimetype.startsWith('audio/')) {
          uploadDir = path.join(this.uploadPath, 'audio');
        } else {
          uploadDir = path.join(this.uploadPath, 'documents');
        }
        
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Génération nom de fichier sécurisé
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const safeName = this.sanitizeFilename(file.fieldname + '-' + uniqueSuffix + ext);
        cb(null, safeName);
      }
    });

    // Configuration upload technique
    this.upload = this.multer({
      storage: storage,
      limits: {
        fileSize: this.maxFileSize,
        files: 10
      },
      fileFilter: (req, file, cb) => {
        this.validateFile(file, cb);
      }
    });

    // Middleware spécialisés
    this.uploadSingle = (fieldName) => {
      return this.upload.single(fieldName);
    };

    this.uploadMultiple = (fieldName, maxCount = 5) => {
      return this.upload.array(fieldName, maxCount);
    };

    this.uploadFields = (fields) => {
      return this.upload.fields(fields);
    };
  }

  /**
   * ✅ Validation technique des fichiers
   */
  validateFile(file, callback) {
    try {
      // Vérifier le type MIME technique
      const allAllowedTypes = Object.values(this.allowedMimeTypes).flat();
      if (!allAllowedTypes.includes(file.mimetype)) {
        return callback(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
      }

      // Vérifier l'extension technique
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
        '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.flac',
        '.pdf', '.txt', '.doc', '.docx'
      ];
      
      if (!allowedExtensions.includes(ext)) {
        return callback(new Error(`Extension non autorisée: ${ext}`));
      }

      // Vérifier la sécurité du nom de fichier
      if (!/^[a-zA-Z0-9._-]+$/.test(path.basename(file.originalname, ext))) {
        return callback(new Error('Nom de fichier contient des caractères non autorisés'));
      }

      callback(null, true);
    } catch (error) {
      callback(error);
    }
  }

  // =============================================================================
  // 🖼️ TRAITEMENT TECHNIQUE D'IMAGES
  // =============================================================================

  /**
   * 🖼️ Traitement technique d'image avec Sharp
   */
  async processImage(filePath, options = {}) {
    if (!this.sharp) {
      logger.warn('Sharp non disponible - traitement d\'image ignoré');
      return { 
        original: filePath,
        processed: null,
        metadata: null
      };
    }

    try {
      const {
        resize = null,
        quality = 85,
        format = 'jpeg',
        generateThumbnail = true,
        watermark = null
      } = options;

      const fileInfo = path.parse(filePath);
      const processedDir = path.join(this.uploadPath, 'processed');
      
      let sharpImage = this.sharp(filePath);
      
      // Obtenir les métadonnées techniques
      const metadata = await sharpImage.metadata();
      
      const results = {
        original: filePath,
        metadata: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
          size: metadata.size,
          space: metadata.space,
          channels: metadata.channels,
          density: metadata.density,
          hasAlpha: metadata.hasAlpha,
          exif: metadata.exif || {}
        }
      };

      // Redimensionner si demandé (technique)
      if (resize && resize.width && resize.height) {
        sharpImage = sharpImage.resize(resize.width, resize.height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Ajouter watermark si fourni (technique)
      if (watermark && await this.fileExists(watermark)) {
        sharpImage = sharpImage.composite([{
          input: watermark,
          gravity: 'southeast'
        }]);
      }

      // Sauvegarder la version traitée
      const mainOutputPath = path.join(processedDir, `${fileInfo.name}_processed.${format}`);
      await sharpImage
        .toFormat(format, { quality })
        .toFile(mainOutputPath);
      
      results.processed = mainOutputPath;

      // Générer thumbnail technique si demandé
      if (generateThumbnail) {
        const thumbPath = path.join(processedDir, `${fileInfo.name}_thumb.${format}`);
        await this.sharp(filePath)
          .resize(300, 300, {
            fit: 'cover',
            position: 'center'
          })
          .toFormat(format, { quality: 70 })
          .toFile(thumbPath);
        
        results.thumbnail = thumbPath;
      }

      logger.debug('Image traitée techniquement:', {
        original: fileInfo.name,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      });

      return results;

    } catch (error) {
      logger.error('Erreur traitement technique image:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // ☁️ TRAITEMENT TECHNIQUE AWS S3
  // =============================================================================

  /**
   * ☁️ Upload technique vers S3
   */
  async uploadToS3(filePath, s3Key, options = {}) {
    if (!this.s3) {
      throw new Error('AWS S3 non configuré');
    }

    try {
      const fileContent = await fs.readFile(filePath);
      const contentType = this.getMimeTypeFromPath(filePath);

      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: fileContent,
        ContentType: contentType,
        ACL: options.public ? 'public-read' : 'private',
        Metadata: options.metadata || {}
      };

      const result = await this.s3.upload(uploadParams).promise();
      
      this.stats.s3Uploads++;
      
      logger.debug('Fichier uploadé vers S3:', {
        key: s3Key,
        bucket: result.Bucket,
        size: fileContent.length
      });

      return {
        url: result.Location,
        key: result.Key,
        bucket: result.Bucket,
        etag: result.ETag
      };

    } catch (error) {
      logger.error('Erreur upload technique S3:', error.message);
      throw error;
    }
  }

  /**
   * 🗑️ Suppression technique de S3
   */
  async deleteFromS3(s3Key) {
    if (!this.s3) {
      throw new Error('AWS S3 non configuré');
    }

    try {
      await this.s3.deleteObject({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key
      }).promise();

      logger.debug('Fichier supprimé de S3:', s3Key);
      return { success: true };
    } catch (error) {
      logger.error('Erreur suppression technique S3:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 📤 MÉTHODE PRINCIPALE D'UPLOAD (TECHNIQUE PURE)
  // =============================================================================

  /**
   * 📤 Traitement technique d'upload (pas de logique métier)
   */
  async handleUpload(file, options = {}) {
    try {
      if (!file) {
        throw new Error('Aucun fichier fourni');
      }

      this.stats.totalUploads++;

      const {
        processImage: shouldProcessImage = true,
        uploadToCloud = false,
        generateThumbnail = true,
        quality = 85,
        resize = null,
        watermark = null,
        s3Options = {}
      } = options;

      // Résultat technique de base
      let result = {
        original: {
          filename: file.filename,
          originalname: file.originalname,
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          fieldname: file.fieldname
        }
      };

      // Traitement technique spécifique selon le type
      if (file.mimetype.startsWith('image/') && shouldProcessImage) {
        const imageOptions = {
          generateThumbnail,
          quality,
          resize,
          watermark
        };
        
        const processedImage = await this.processImage(file.path, imageOptions);
        result.processed = processedImage;
        this.stats.totalProcessed++;
      }

      // Upload technique vers le cloud si demandé
      if (uploadToCloud && this.s3) {
        const s3Key = this.generateS3Key(file);
        const s3Result = await this.uploadToS3(file.path, s3Key, s3Options);
        result.cloud = s3Result;
      }

      logger.debug('Upload technique terminé:', {
        filename: file.originalname,
        size: file.size,
        processed: !!result.processed,
        cloud: !!result.cloud
      });

      return result;

    } catch (error) {
      this.stats.totalErrors++;
      logger.error('Erreur traitement technique upload:', error.message);
      throw error;
    }
  }

  // =============================================================================
  // 🛠️ UTILITAIRES TECHNIQUES
  // =============================================================================

  /**
   * 🗑️ Suppression technique de fichier
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.debug('Fichier supprimé techniquement:', filePath);
      return { success: true };
    } catch (error) {
      logger.error('Erreur suppression technique fichier:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🧹 Nettoyage technique des fichiers temporaires
   */
  async cleanupTempFiles(maxAge = 24 * 60 * 60 * 1000) { // 24h par défaut
    try {
      const tempDir = path.join(this.uploadPath, 'temp');
      
      let deletedCount = 0;
      
      try {
        const files = await fs.readdir(tempDir);
        
        for (const file of files) {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);
          
          if (Date.now() - stats.mtime.getTime() > maxAge) {
            await this.deleteFile(filePath);
            deletedCount++;
          }
        }
      } catch (error) {
        // Dossier temp n'existe pas ou autre erreur
        logger.debug('Erreur accès dossier temp:', error.message);
      }
      
      if (deletedCount > 0) {
        logger.info(`Nettoyage technique: ${deletedCount} fichiers temporaires supprimés`);
      }
      
      return { cleaned: deletedCount };
    } catch (error) {
      logger.error('Erreur nettoyage technique fichiers temporaires:', error.message);
      return { cleaned: 0, error: error.message };
    }
  }

  /**
   * 🔧 Génération clé S3 technique
   */
  generateS3Key(file) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 50);
    
    return `uploads/${timestamp}/${baseName}-${random}${ext}`;
  }

  /**
   * 🏷️ Détection type MIME technique
   */
  getMimeTypeFromPath(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      
      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'audio/mp4',
      '.webm': 'audio/webm',
      '.flac': 'audio/flac',
      
      // Documents
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * 🧹 Nettoyage nom de fichier technique
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * 📁 Vérification existence fichier
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 📊 Informations techniques fichier
   */
  getFileInfo(filePath) {
    return path.parse(filePath);
  }

  /**
   * 📊 Statistiques techniques
   */
  getTechnicalStats() {
    return {
      ...this.stats,
      uploadPath: this.uploadPath,
      maxFileSize: this.maxFileSize,
      hasSharp: !!this.sharp,
      hasS3: !!this.s3,
      allowedTypes: Object.keys(this.allowedMimeTypes).reduce((acc, key) => {
        acc[key] = this.allowedMimeTypes[key].length;
        return acc;
      }, {})
    };
  }

  // =============================================================================
  // 🔧 ADMINISTRATION ET MAINTENANCE
  // =============================================================================

  /**
   * 📋 Statut technique du service
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      dependencies: {
        hasMulter: !!this.multer,
        hasSharp: !!this.sharp,
        hasS3: !!this.s3
      },
      configuration: {
        uploadPath: this.uploadPath,
        maxFileSize: this.maxFileSize,
        s3Bucket: process.env.AWS_S3_BUCKET || null
      },
      stats: this.stats,
      allowedTypes: this.allowedMimeTypes,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🧹 Nettoyage du service
   */
  async cleanup() {
    try {
      // Nettoyage technique final
      await this.cleanupTempFiles();
      
      this.isInitialized = false;
      logger.info(this.name + ' nettoyé');
      
      return { success: true };
    } catch (error) {
      logger.error('Erreur nettoyage FileUploadService:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FileUploadService();