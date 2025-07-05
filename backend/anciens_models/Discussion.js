  // models/Discussion.js - Forums de discussion
  module.exports = (sequelize, DataTypes) => {
    const Discussion = sequelize.define('Discussion', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      views: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      isClosed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isSticky: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      authorId: {
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
  
    Discussion.associate = (models) => {
      Discussion.belongsTo(models.User, { as: 'author', foreignKey: 'authorId' });
      Discussion.hasMany(models.Reply, { foreignKey: 'discussionId' });
      Discussion.belongsToMany(models.Tag, { through: 'DiscussionTags' });
    };
  
    return Discussion;
  };