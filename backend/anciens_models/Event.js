  // models/Event.js - Événements
  module.exports = (sequelize, DataTypes) => {
    const Event = sequelize.define('Event', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      organizer: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      registrationLink: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Type d\'événement (atelier, conférence, etc.)'
      },
      image: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      isFeatured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
  
    Event.associate = (models) => {
      Event.belongsTo(models.User, { as: 'creator', foreignKey: 'createdBy' });
    };
  
    return Event;
  };