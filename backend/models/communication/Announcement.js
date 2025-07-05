// models/communication/Announcement.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Announcement = sequelize.define('Announcement', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [5, 255]
    }
  },
  slug: {
    type: DataTypes.STRING(300),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [10, 10000]
    }
  },
  excerpt: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Résumé court pour les listes'
  },
  type: {
    type: DataTypes.ENUM(
      'info', 'warning', 'success', 'error',
      'maintenance', 'feature', 'event', 'celebration',
      'update', 'security', 'community', 'educational'
    ),
    allowNull: false,
    defaultValue: 'info'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal'
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'published', 'archived', 'expired'),
    allowNull: false,
    defaultValue: 'draft'
  },
  visibility: {
    type: DataTypes.ENUM('public', 'members_only', 'contributors_only', 'moderators_only', 'admins_only'),
    allowNull: false,
    defaultValue: 'public'
  },
  target_audience: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Critères de ciblage spécifiques'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_pinned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Épinglé en haut'
  },
  is_dismissible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Peut être fermé par l\'utilisateur'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de début d\'affichage'
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de fin d\'affichage'
  },
  scheduled_for: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Date de publication programmée'
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  view_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  click_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  dismissal_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: 'Nombre de fois fermé par les utilisateurs'
  },
  action_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'URL d\'action principale'
  },
  action_text: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Texte du bouton d\'action'
  },
  secondary_action_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  secondary_action_text: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Icône à afficher'
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    }
  },
  background_color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  banner_image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'Image de bannière pour les annonces importantes'
  },
  display_style: {
    type: DataTypes.ENUM('banner', 'modal', 'toast', 'inline', 'sidebar'),
    allowNull: false,
    defaultValue: 'banner'
  },
  display_position: {
    type: DataTypes.ENUM('top', 'bottom', 'center', 'top-right', 'top-left', 'bottom-right', 'bottom-left'),
    allowNull: false,
    defaultValue: 'top'
  },
  animation: {
    type: DataTypes.ENUM('none', 'fade', 'slide', 'bounce', 'pulse'),
    allowNull: false,
    defaultValue: 'fade'
  },
  auto_hide_delay: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Délai en secondes avant masquage automatique'
  },
  language: {
    type: DataTypes.ENUM('wolof', 'français', 'english', 'all'),
    allowNull: false,
    defaultValue: 'français'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Métadonnées supplémentaires'
  },
  tracking_params: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Paramètres de tracking (UTM, etc.)'
  },
  a_b_test_group: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Groupe de test A/B'
  },
  conversion_goal: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Objectif de conversion pour mesurer l\'efficacité'
  },
  conversion_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'announcements',
  indexes: [
    { fields: ['slug'] },
    { fields: ['type'] },
    { fields: ['priority'] },
    { fields: ['status'] },
    { fields: ['visibility'] },
    { fields: ['is_active'] },
    { fields: ['is_pinned'] },
    { fields: ['start_date'] },
    { fields: ['end_date'] },
    { fields: ['scheduled_for'] },
    { fields: ['published_at'] },
    { fields: ['language'] },
    { fields: ['created_by'] },
    { fields: ['approved_by'] },
    { fields: ['view_count'] },
    { fields: ['conversion_count'] },
    {
      name: 'announcement_search_index',
      type: 'FULLTEXT',
      fields: ['title', 'content', 'excerpt']
    }
  ],
  hooks: {
    beforeSave: (announcement) => {
      if (announcement.changed('title') && !announcement.slug) {
        announcement.slug = announcement.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 250);
      }
      
      // Auto-définir le statut basé sur les dates
      const now = new Date();
      if (announcement.scheduled_for && now < announcement.scheduled_for) {
        announcement.status = 'scheduled';
      } else if (announcement.end_date && now > announcement.end_date) {
        announcement.status = 'expired';
        announcement.is_active = false;
      } else if (announcement.start_date && now >= announcement.start_date) {
        if (announcement.status === 'draft' || announcement.status === 'scheduled') {
          announcement.status = 'published';
          announcement.published_at = announcement.published_at || now;
        }
      }
    }
  }
});

// Méthodes d'instance
Announcement.prototype.incrementView = async function() {
  this.view_count += 1;
  await this.save(['view_count']);
};

Announcement.prototype.incrementClick = async function() {
  this.click_count += 1;
  await this.save(['click_count']);
};

Announcement.prototype.incrementDismissal = async function() {
  this.dismissal_count += 1;
  await this.save(['dismissal_count']);
};

Announcement.prototype.incrementConversion = async function() {
  this.conversion_count += 1;
  await this.save(['conversion_count']);
};

Announcement.prototype.publish = async function() {
  this.status = 'published';
  this.published_at = new Date();
  this.is_active = true;
  await this.save(['status', 'published_at', 'is_active']);
};

Announcement.prototype.archive = async function() {
  this.status = 'archived';
  this.archived_at = new Date();
  this.is_active = false;
  await this.save(['status', 'archived_at', 'is_active']);
};

Announcement.prototype.schedule = async function(publishDate) {
  this.status = 'scheduled';
  this.scheduled_for = publishDate;
  await this.save(['status', 'scheduled_for']);
};

Announcement.prototype.approve = async function(approverId) {
  this.approved_by = approverId;
  this.approved_at = new Date();
  await this.save(['approved_by', 'approved_at']);
};

Announcement.prototype.isVisible = function() {
  const now = new Date();
  
  return this.is_active &&
         this.status === 'published' &&
         (!this.start_date || now >= this.start_date) &&
         (!this.end_date || now <= this.end_date);
};

Announcement.prototype.isScheduled = function() {
  return this.status === 'scheduled' && 
         this.scheduled_for && 
         new Date() < this.scheduled_for;
};

Announcement.prototype.isExpired = function() {
  return this.end_date && new Date() > this.end_date;
};

Announcement.prototype.getEngagementRate = function() {
  if (this.view_count === 0) return 0;
  return ((this.click_count + this.conversion_count) / this.view_count * 100).toFixed(2);
};

Announcement.prototype.getDismissalRate = function() {
  if (this.view_count === 0) return 0;
  return (this.dismissal_count / this.view_count * 100).toFixed(2);
};

Announcement.prototype.getConversionRate = function() {
  if (this.view_count === 0) return 0;
  return (this.conversion_count / this.view_count * 100).toFixed(2);
};

Announcement.prototype.canUserView = function(user) {
  if (!this.isVisible()) return false;
  
  switch (this.visibility) {
    case 'public':
      return true;
    case 'members_only':
      return user && user.id;
    case 'contributors_only':
      return user && ['contributor', 'moderator', 'expert', 'admin'].includes(user.role);
    case 'moderators_only':
      return user && ['moderator', 'expert', 'admin'].includes(user.role);
    case 'admins_only':
      return user && user.role === 'admin';
    default:
      return false;
  }
};

// Méthodes de classe
Announcement.getActive = function(userRole = null, options = {}) {
  const { Op } = require('sequelize');
  const now = new Date();
  
  let visibilityFilter = { visibility: 'public' };
  
  if (userRole) {
    const roleHierarchy = {
      'user': ['public', 'members_only'],
      'contributor': ['public', 'members_only', 'contributors_only'],
      'moderator': ['public', 'members_only', 'contributors_only', 'moderators_only'],
      'expert': ['public', 'members_only', 'contributors_only', 'moderators_only'],
      'admin': ['public', 'members_only', 'contributors_only', 'moderators_only', 'admins_only']
    };
    
    const allowedVisibilities = roleHierarchy[userRole] || ['public'];
    visibilityFilter = { visibility: { [Op.in]: allowedVisibilities } };
  }
  
  return this.findAll({
    where: {
      is_active: true,
      status: 'published',
      [Op.or]: [
        { start_date: null },
        { start_date: { [Op.lte]: now } }
      ],
      [Op.or]: [
        { end_date: null },
        { end_date: { [Op.gte]: now } }
      ],
      ...visibilityFilter,
      ...options.where
    },
    order: [
      ['is_pinned', 'DESC'],
      ['priority', 'DESC'],
      ['published_at', 'DESC']
    ],
    limit: options.limit,
    offset: options.offset,
    include: options.include || ['creator']
  });
};

Announcement.getPinned = function(userRole = null) {
  return this.getActive(userRole, {
    where: { is_pinned: true },
    limit: 3
  });
};

Announcement.getScheduled = function() {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      status: 'scheduled',
      scheduled_for: { [Op.lte]: new Date() }
    },
    order: [['scheduled_for', 'ASC']]
  });
};

Announcement.processScheduled = async function() {
  const scheduledAnnouncements = await this.getScheduled();
  
  for (const announcement of scheduledAnnouncements) {
    await announcement.publish();
  }
  
  return scheduledAnnouncements.length;
};

Announcement.expireOld = async function() {
  const { Op } = require('sequelize');
  const expired = await this.update(
    { 
      status: 'expired', 
      is_active: false 
    },
    {
      where: {
        end_date: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'expired' }
      }
    }
  );
  
  return expired[0]; // Nombre de lignes affectées
};

Announcement.getStatsByType = function(period = 'month') {
  const { Op } = require('sequelize');
  
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'week':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      };
      break;
    case 'month':
      dateFilter = {
        created_at: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
      break;
  }
  
  return this.findAll({
    where: dateFilter,
    attributes: [
      'type',
      [sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.fn('SUM', sequelize.col('view_count')), 'total_views'],
      [sequelize.fn('SUM', sequelize.col('click_count')), 'total_clicks'],
      [sequelize.fn('SUM', sequelize.col('conversion_count')), 'total_conversions'],
      [sequelize.fn('AVG', sequelize.col('view_count')), 'avg_views']
    ],
    group: ['type'],
    raw: true
  });
};

Announcement.getTopPerforming = function(limit = 10, metric = 'view_count') {
  const allowedMetrics = ['view_count', 'click_count', 'conversion_count'];
  const orderMetric = allowedMetrics.includes(metric) ? metric : 'view_count';
  
  return this.findAll({
    where: { status: 'published' },
    order: [[orderMetric, 'DESC']],
    limit,
    include: ['creator']
  });
};

Announcement.searchAnnouncements = function(query, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { content: { [Op.like]: `%${query}%` } },
        { excerpt: { [Op.like]: `%${query}%` } }
      ],
      ...options.where
    },
    order: [['published_at', 'DESC']],
    limit: options.limit || 20,
    offset: options.offset || 0,
    include: ['creator']
  });
};

module.exports = Announcement;