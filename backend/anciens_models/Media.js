  // models/Media.js - Fichiers médias (audio, images)
  module.exports = (sequelize, DataTypes) => {
    const Media = sequelize.define('Media', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM('audio', 'image', 'video', 'document'),
        allowNull: false
      },
      url: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      filesize: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      entityType: {
        type: DataTypes.ENUM('word', 'phrase', 'example', 'letter'),
        allowNull: false,
        comment: 'Type d\'entité associée'
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'ID de l\'entité associée'
      },
      uploaderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true,
      indexes: [
        { fields: ['entityType', 'entityId'] }
      ]
    });
  
    Media.associate = (models) => {
      Media.belongsTo(models.User, { as: 'uploader', foreignKey: 'uploaderId' });
    };
  
    return Media;
  };