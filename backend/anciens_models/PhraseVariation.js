  // models/PhraseVariation.js - Variations d'une phrase
  module.exports = (sequelize, DataTypes) => {
    const PhraseVariation = sequelize.define('PhraseVariation', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      wolof: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Variation de la phrase en wolof'
      },
      francais: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Traduction française de la variation'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      phraseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Phrases',
          key: 'id'
        }
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    PhraseVariation.associate = (models) => {
      PhraseVariation.belongsTo(models.Phrase, { foreignKey: 'phraseId' });
      PhraseVariation.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
    };
  
    return PhraseVariation;
  };
  