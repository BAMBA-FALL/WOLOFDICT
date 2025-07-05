/ models/categorization/Tag.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50]
    }
  },
  slug: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    },
    defaultValue: '#6B7280'
  },
  usage_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre total d\'utilisations de ce tag'
  },
  is_trending: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'tags',
  indexes: [
    { fields: ['name'] },
    { fields: ['slug'] },
    { fields: ['usage_count'] },
    { fields: ['is_trending'] },
    { fields: ['is_featured'] },
    { fields: ['created_by'] }
  ],
  hooks: {
    beforeSave: (tag) => {
      if (tag.changed('name') && !tag.slug) {
        tag.slug = tag.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
    }
  }
});

// Méthodes d'instance
Tag.prototype.incrementUsage = async function() {
  this.usage_count += 1;
  await this.save(['usage_count']);
};

// Méthodes de classe
Tag.getTrending = function(limit = 10) {
  return this.findAll({
    where: { is_trending: true },
    order: [['usage_count', 'DESC']],
    limit
  });
};

Tag.getPopular = function(limit = 20) {
  return this.findAll({
    order: [['usage_count', 'DESC']],
    limit
  });
};

module.exports = Tag;
