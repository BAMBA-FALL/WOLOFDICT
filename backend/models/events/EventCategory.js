// models/events/EventCategory.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const EventCategory = sequelize.define('EventCategory', {
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
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    },
    defaultValue: '#10B981'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Nom de l\'icône'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  event_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  display_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'event_categories',
  indexes: [
    { fields: ['slug'] },
    { fields: ['is_active'] },
    { fields: ['display_order'] },
    { fields: ['event_count'] }
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
EventCategory.prototype.updateEventCount = async function() {
  const { Event } = require('../index');
  const count = await Event.count({ where: { category_id: this.id } });
  await this.update({ event_count: count });
};

module.exports = EventCategory;
