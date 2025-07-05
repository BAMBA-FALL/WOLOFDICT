// models/ValidationStatus.js
module.exports = (sequelize, DataTypes) => {
    const ValidationStatus = sequelize.define('ValidationStatus', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Nom du statut (ex: pending, validated, rejected)'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Description détaillée du statut'
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        comment: 'Code couleur HEX pour la UI'
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Ordre d\'affichage dans la UI'
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indique si c\'est le statut par défaut'
      },
      requiresAction: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indique si ce statut nécessite une action'
      }
    }, {
      timestamps: true
    });
  
    ValidationStatus.associate = (models) => {
      // Un statut peut être associé à plusieurs mots
      ValidationStatus.hasMany(models.Word, { foreignKey: 'validationStatusId' });
      
      // Un statut peut être associé à plusieurs traductions
      ValidationStatus.hasMany(models.Translation, { foreignKey: 'validationStatusId' });
      
      // Un statut peut être associé à plusieurs exemples
      ValidationStatus.hasMany(models.Example, { foreignKey: 'validationStatusId' });
      
      // Un statut peut être associé à plusieurs conjugaisons
      ValidationStatus.hasMany(models.Conjugation, { foreignKey: 'validationStatusId' });
    };
  
    return ValidationStatus;
  };