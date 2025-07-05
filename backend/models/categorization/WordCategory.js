// models/categorization/WordCategory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const WordCategory = sequelize.define('WordCategory', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  word_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'words',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  assigned_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  confidence_score: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 1
    },
    comment: 'Score de confiance pour la catégorisation automatique'
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indique si c\'est la catégorie principale du mot'
  }
}, {
  tableName: 'word_categories',
  indexes: [
    { fields: ['word_id'] },
    { fields: ['category_id'] },
    { fields: ['assigned_by'] },
    { fields: ['is_primary'] },
    { 
      fields: ['word_id', 'category_id'], 
      unique: true,
      name: 'unique_word_category'
    }
  ],
  hooks: {
    afterCreate: async (wordCategory) => {
      const Category = require('./Category');
      const category = await Category.findByPk(wordCategory.category_id);
      if (category) {
        await category.updateCounts();
      }
    },
    afterDestroy: async (wordCategory) => {
      const Category = require('./Category');
      const category = await Category.findByPk(wordCategory.category_id);
      if (category) {
        await category.updateCounts();
      }
    }
  }
});

module.exports = WordCategory;