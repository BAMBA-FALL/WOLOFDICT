// models/categorization/Category.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 100]
    }
  },
  slug: {
    type: DataTypes.STRING(120),
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
  parent_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    },
    comment: 'Pour créer une hiérarchie de catégories'
  },
  color_code: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    },
    defaultValue: '#3B82F6'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Nom de l\'icône (ex: lucide icon name)'
  },
  display_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  word_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de mots dans cette catégorie'
  },
  phrase_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de phrases dans cette catégorie'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Métadonnées additionnelles'
  }
}, {
  tableName: 'categories',
  indexes: [
    { fields: ['name'] },
    { fields: ['slug'] },
    { fields: ['parent_id'] },
    { fields: ['is_active'] },
    { fields: ['is_featured'] },
    { fields: ['display_order'] },
    { fields: ['word_count'] },
    { fields: ['phrase_count'] }
  ],
  hooks: {
    beforeSave: (category) => {
      if (category.changed('name') && !category.slug) {
        category.slug = category.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
    }
  }
});

// Méthodes d'instance
Category.prototype.getFullPath = async function() {
  const path = [this.name];
  let current = this;
  
  while (current.parent_id) {
    current = await Category.findByPk(current.parent_id);
    if (current) {
      path.unshift(current.name);
    }
  }
  
  return path.join(' > ');
};

Category.prototype.updateCounts = async function() {
  const { WordCategory, PhraseCategory } = require('../index');
  
  const wordCount = await WordCategory.count({ where: { category_id: this.id } });
  const phraseCount = await PhraseCategory.count({ where: { category_id: this.id } });
  
  await this.update({ word_count: wordCount, phrase_count: phraseCount });
};

// Méthodes de classe
Category.getHierarchy = async function() {
  const categories = await this.findAll({
    where: { is_active: true },
    order: [['display_order', 'ASC'], ['name', 'ASC']]
  });
  
  const buildTree = (parentId = null) => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat.toJSON(),
        children: buildTree(cat.id)
      }));
  };
  
  return buildTree();
};

Category.getFeatured = function(limit = 10) {
  return this.findAll({
    where: { is_featured: true, is_active: true },
    order: [['display_order', 'ASC']],
    limit
  });
};

module.exports = Category;