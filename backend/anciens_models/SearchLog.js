  // models/SearchLog.js - Journal des recherches
  module.exports = (sequelize, DataTypes) => {
    const SearchLog = sequelize.define('SearchLog', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      term: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Terme recherché'
      },
      language: {
        type: DataTypes.ENUM('wolof', 'français'),
        allowNull: false,
        defaultValue: 'wolof'
      },
      hasResults: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        comment: 'Indique si la recherche a donné des résultats'
      },
      resultCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      userId: {
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
  
    SearchLog.associate = (models) => {
      SearchLog.belongsTo(models.User, { foreignKey: 'userId' });
    };
  
    return SearchLog;
  };