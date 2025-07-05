  // models/UserPreference.js - Préférences utilisateur
  module.exports = (sequelize, DataTypes) => {
    const UserPreference = sequelize.define('UserPreference', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      interfaceLanguage: {
        type: DataTypes.STRING(10),
        defaultValue: 'fr' // fr, wo, en
      },
      emailNotifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      theme: {
        type: DataTypes.ENUM('light', 'dark', 'system'),
        defaultValue: 'system'
      }
    }, {
      timestamps: true
    });
  
    UserPreference.associate = (models) => {
      UserPreference.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return UserPreference;
  };