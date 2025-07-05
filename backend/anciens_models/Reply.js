  // models/Reply.js - Réponses aux discussions
  module.exports = (sequelize, DataTypes) => {
    const Reply = sequelize.define('Reply', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      isAccepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indique si cette réponse a été acceptée comme solution'
      },
      discussionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Discussions',
          key: 'id'
        }
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      parentReplyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Replies',
          key: 'id'
        }
      }
    }, {
      timestamps: true,
      paranoid: true
    });
  
    Reply.associate = (models) => {
      Reply.belongsTo(models.Discussion, { foreignKey: 'discussionId' });
      Reply.belongsTo(models.User, { as: 'author', foreignKey: 'authorId' });
      Reply.belongsTo(models.Reply, { as: 'parentReply', foreignKey: 'parentReplyId' });
      Reply.hasMany(models.Reply, { as: 'childReplies', foreignKey: 'parentReplyId' });
    };
  
    return Reply;
  };
  