module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      lastName: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      role: {
        type: DataTypes.ENUM('admin', 'expert', 'contributor', 'user'),
        defaultValue: 'user'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      speciality: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Domaine d\'expertise pour les experts'
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      timestamps: true, // Ajoute createdAt et updatedAt
      paranoid: true // Soft delete (deletedAt)
    });
  
    User.associate = (models) => {
      User.hasMany(models.Word, { as: 'addedWords', foreignKey: 'createdBy' });
      User.hasMany(models.Word, { as: 'validatedWords', foreignKey: 'validatedBy' });
      User.hasMany(models.Translation, { as: 'addedTranslations', foreignKey: 'createdBy' });
      User.hasMany(models.Contribution, { foreignKey: 'userId' });
    };
  
    return User;
  };