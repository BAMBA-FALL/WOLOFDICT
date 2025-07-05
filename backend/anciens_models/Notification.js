  // models/Notification.js - Notifications utilisateur
  module.exports = (sequelize, DataTypes) => {
    const Notification = sequelize.define('Notification', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM('contribution_validated', 'contribution_rejected', 'mention', 'reply', 'system'),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      link: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Lien associé à la notification'
      },
      entityType: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      }
    }, {
      timestamps: true
    });
  
    Notification.associate = (models) => {
      Notification.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return Notification;
  };
  