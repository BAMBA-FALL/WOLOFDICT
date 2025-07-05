// models/categorization/PhraseCategory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const PhraseCategory = sequelize.define('PhraseCategory', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  phrase_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'phrases',
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
    }
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'phrase_categories',
  indexes: [
    { fields: ['phrase_id'] },
    { fields: ['category_id'] },
    { fields: ['assigned_by'] },
    { fields: ['is_primary'] },
    { 
      fields: ['phrase_id', 'category_id'], 
      unique: true,
      name: 'unique_phrase_category'
    }
  ],
  hooks: {
    afterCreate: async (phraseCategory) => {
      const Category = require('./Category');
      const category = await Category.findByPk(phraseCategory.category_id);
      if (category) {
        await category.updateCounts();
      }
    },
    afterDestroy: async (phraseCategory) => {
      const Category = require('./Category');
      const category = await Category.findByPk(phraseCategory.category_id);
      if (category) {
        await category.updateCounts();
      }
    }
  }
});

module.exports = PhraseCategory;