// models/media/Image.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  content_type: {
    type: DataTypes.ENUM('word', 'phrase', 'user_profile', 'event', 'category', 'general'),
    allowNull: false,
    comment: 'Type de contenu associé'
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: 'ID du contenu associé (nullable pour images générales)'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Chemin vers le fichier image'
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nom original du fichier'
  },
  file_size: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: 'Taille du fichier en bytes'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: [['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']]
    }
  },
  width: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Largeur en pixels'
  },
  height: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Hauteur en pixels'
  },
  alt_text: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Texte alternatif pour l\'accessibilité'
  },
  caption: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Légende de l\'image'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Titre de l\'image'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description détaillée'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Tags pour la recherche d\'images'
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Image principale pour ce contenu'
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  view_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  download_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  copyright_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Informations de copyright'
  },
  source_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'URL source si image externe'
  },
  license: {
    type: DataTypes.ENUM('cc0', 'cc_by', 'cc_by_sa', 'cc_by_nc', 'cc_by_nc_sa', 'proprietary', 'other'),
    allowNull: true,
    comment: 'Type de licence'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Métadonnées EXIF et autres'
  },
  uploaded_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'images',
  indexes: [
    { fields: ['content_type', 'content_id'] },
    { fields: ['content_type'] },
    { fields: ['content_id'] },
    { fields: ['is_primary'] },
    { fields: ['is_public'] },
    { fields: ['view_count'] },
    { fields: ['uploaded_by'] },
    { fields: ['approved_by'] },
    { fields: ['mime_type'] },
    { fields: ['license'] },
    {
      name: 'image_search_index',
      type: 'FULLTEXT',
      fields: ['alt_text', 'caption', 'title', 'description']
    }
  ]
});

// Méthodes d'instance
Image.prototype.incrementView = async function() {
  this.view_count += 1;
  await this.save(['view_count']);
};

Image.prototype.incrementDownload = async function() {
  this.download_count += 1;
  await this.save(['download_count']);
};

Image.prototype.getFileUrl = function() {
  return `${process.env.MEDIA_BASE_URL || '/media'}/${this.file_path}`;
};

Image.prototype.getThumbnailUrl = function(size = 'medium') {
  const sizeMap = {
    small: '150x150',
    medium: '300x300',
    large: '600x600'
  };
  
  const dimensions = sizeMap[size] || sizeMap.medium;
  return `${process.env.MEDIA_BASE_URL || '/media'}/thumbnails/${dimensions}/${this.file_path}`;
};

Image.prototype.getAspectRatio = function() {
  if (!this.width || !this.height) return null;
  return this.width / this.height;
};

Image.prototype.isPortrait = function() {
  const ratio = this.getAspectRatio();
  return ratio !== null && ratio < 1;
};

Image.prototype.isLandscape = function() {
  const ratio = this.getAspectRatio();
  return ratio !== null && ratio > 1;
};

Image.prototype.isSquare = function() {
  const ratio = this.getAspectRatio();
  return ratio !== null && Math.abs(ratio - 1) < 0.1;
};

// Méthodes de classe
Image.findByContent = function(contentType, contentId) {
  return this.findAll({
    where: { content_type: contentType, content_id: contentId, is_public: true },
    order: [['is_primary', 'DESC'], ['view_count', 'DESC']]
  });
};

Image.findPrimary = function(contentType, contentId) {
  return this.findOne({
    where: { 
      content_type: contentType, 
      content_id: contentId, 
      is_primary: true,
      is_public: true
    }
  });
};

Image.searchByTags = function(tags, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      tags: {
        [Op.overlap]: tags
      },
      is_public: true,
      ...options.where
    },
    order: [['view_count', 'DESC']],
    limit: options.limit || 20
  });
};

Image.getRecent = function(limit = 20) {
  return this.findAll({
    where: { is_public: true },
    order: [['created_at', 'DESC']],
    limit,
    include: ['uploader']
  });
};

Image.getPopular = function(limit = 20) {
  return this.findAll({
    where: { is_public: true },
    order: [['view_count', 'DESC']],
    limit,
    include: ['uploader']
  });
};

module.exports = Image;