// models/media/AudioRecording.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const AudioRecording = sequelize.define('AudioRecording', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  content_type: {
    type: DataTypes.ENUM('word', 'phrase', 'alphabet', 'proverb'),
    allowNull: false,
    comment: 'Type de contenu associé'
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: 'ID du contenu associé (polymorphe)'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Chemin vers le fichier audio'
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
  duration: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    comment: 'Durée en secondes'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: [['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm']]
    }
  },
  bitrate: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Bitrate en kbps'
  },
  sample_rate: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Fréquence d\'échantillonnage en Hz'
  },
  speaker_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nom du locuteur'
  },
  speaker_origin: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Origine géographique du locuteur'
  },
  speaker_gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true
  },
  speaker_age_range: {
    type: DataTypes.ENUM('child', 'young_adult', 'adult', 'elderly'),
    allowNull: true
  },
  quality_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    },
    comment: 'Note de qualité de 1 à 5'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Vérifié par un expert linguistique'
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Enregistrement principal pour ce contenu'
  },
  play_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  download_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  transcription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Transcription automatique ou manuelle'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Métadonnées additionnelles'
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verified_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'audio_recordings',
  indexes: [
    { fields: ['content_type', 'content_id'] },
    { fields: ['content_type'] },
    { fields: ['content_id'] },
    { fields: ['speaker_origin'] },
    { fields: ['quality_rating'] },
    { fields: ['is_verified'] },
    { fields: ['is_primary'] },
    { fields: ['play_count'] },
    { fields: ['created_by'] },
    { fields: ['verified_by'] }
  ]
});

// Méthodes d'instance
AudioRecording.prototype.incrementPlay = async function() {
  this.play_count += 1;
  await this.save(['play_count']);
};

AudioRecording.prototype.incrementDownload = async function() {
  this.download_count += 1;
  await this.save(['download_count']);
};

AudioRecording.prototype.getFileUrl = function() {
  // Dans un environnement réel, ceci retournerait l'URL complète
  return `${process.env.MEDIA_BASE_URL || '/media'}/${this.file_path}`;
};

AudioRecording.prototype.formatDuration = function() {
  if (!this.duration) return 'N/A';
  
  const minutes = Math.floor(this.duration / 60);
  const seconds = Math.floor(this.duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Méthodes de classe
AudioRecording.findByContent = function(contentType, contentId) {
  return this.findAll({
    where: { content_type: contentType, content_id: contentId },
    order: [['is_primary', 'DESC'], ['quality_rating', 'DESC'], ['play_count', 'DESC']]
  });
};

AudioRecording.findPrimary = function(contentType, contentId) {
  return this.findOne({
    where: { 
      content_type: contentType, 
      content_id: contentId, 
      is_primary: true 
    }
  });
};

AudioRecording.getTopPlayed = function(limit = 10) {
  return this.findAll({
    order: [['play_count', 'DESC']],
    limit,
    include: ['creator']
  });
};

module.exports = AudioRecording;
