// models/events/Event.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Event = sequelize.define('Event', {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [20, 5000]
    }
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Description courte pour les listes'
  },
  event_type: {
    type: DataTypes.ENUM('atelier', 'conférence', 'formation', 'webinaire', 'festival', 'rencontre', 'autre'),
    allowNull: false
  },
  category_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: {
      model: 'event_categories',
      key: 'id'
    }
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'UTC'
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Lieu physique ou plateforme en ligne'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Adresse complète pour événements physiques'
  },
  coordinates: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Coordonnées GPS { lat, lng }'
  },
  is_online: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  meeting_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'Lien de la réunion en ligne'
  },
  meeting_password: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Mot de passe pour la réunion'
  },
  registration_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    },
    comment: 'Lien d\'inscription externe'
  },
  registration_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  registration_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  max_participants: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: 'Nombre maximum de participants (null = illimité)'
  },
  current_participants: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  waiting_list_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_cancelled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  language: {
    type: DataTypes.ENUM('wolof', 'français', 'both', 'english'),
    allowNull: false,
    defaultValue: 'both'
  },
  difficulty_level: {
    type: DataTypes.ENUM('débutant', 'intermédiaire', 'avancé', 'tous_niveaux'),
    allowNull: false,
    defaultValue: 'tous_niveaux'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Prix en FCFA (null = gratuit)'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'XOF',
    comment: 'Code ISO de la devise'
  },
  organizer_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  organizer_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nom de l\'organisation si différent de l\'utilisateur'
  },
  organizer_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  organizer_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  organizer_website: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  speakers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Liste des intervenants'
  },
  agenda: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Programme détaillé'
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Prérequis et matériel nécessaire'
  },
  what_to_bring: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Ce qu\'il faut apporter'
  },
  target_audience: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Public cible'
  },
  learning_objectives: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Objectifs pédagogiques'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  social_links: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Liens vers réseaux sociaux'
  },
  feedback_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  certificate_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Délivrance de certificats'
  },
  recording_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  recording_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  view_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  like_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  share_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  reminder_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  follow_up_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'events',
  indexes: [
    { fields: ['slug'] },
    { fields: ['category_id'] },
    { fields: ['organizer_id'] },
    { fields: ['event_type'] },
    { fields: ['start_date'] },
    { fields: ['end_date'] },
    { fields: ['is_online'] },
    { fields: ['is_featured'] },
    { fields: ['is_public'] },
    { fields: ['is_cancelled'] },
    { fields: ['status'] },
    { fields: ['language'] },
    { fields: ['difficulty_level'] },
    { fields: ['registration_required'] },
    { fields: ['registration_deadline'] },
    { fields: ['view_count'] },
    {
      name: 'event_search_index',
      type: 'FULLTEXT',
      fields: ['title', 'description', 'short_description']
    },
    {
      name: 'event_location_index',
      fields: ['location', 'address']
    }
  ],
  hooks: {
    beforeSave: (event) => {
      if (event.changed('title') && !event.slug) {
        event.slug = event.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 250);
      }
      
      // Auto-définir le statut basé sur les dates
      const now = new Date();
      if (event.start_date && event.end_date) {
        if (now < event.start_date) {
          event.status = 'published';
        } else if (now >= event.start_date && now <= event.end_date) {
          event.status = 'ongoing';
        } else if (now > event.end_date) {
          event.status = 'completed';
        }
      }
    },
    afterCreate: async (event) => {
      // Mettre à jour le compteur de la catégorie
      if (event.category_id) {
        const category = await event.getCategory();
        if (category) {
          await category.updateEventCount();
        }
      }
    }
  }
});

// Méthodes d'instance
Event.prototype.incrementView = async function() {
  this.view_count += 1;
  await this.save(['view_count']);
};

Event.prototype.incrementLike = async function() {
  this.like_count += 1;
  await this.save(['like_count']);
};

Event.prototype.incrementShare = async function() {
  this.share_count += 1;
  await this.save(['share_count']);
};

Event.prototype.isRegistrationOpen = function() {
  const now = new Date();
  return !this.is_cancelled && 
         this.status === 'published' &&
         (!this.registration_deadline || now <= this.registration_deadline) &&
         (!this.max_participants || this.current_participants < this.max_participants);
};

Event.prototype.isFullyBooked = function() {
  return this.max_participants && this.current_participants >= this.max_participants;
};

Event.prototype.getAvailableSpots = function() {
  if (!this.max_participants) return null;
  return Math.max(0, this.max_participants - this.current_participants);
};

Event.prototype.getDuration = function() {
  if (!this.end_date) return null;
  return Math.abs(this.end_date - this.start_date) / (1000 * 60 * 60); // en heures
};

Event.prototype.isUpcoming = function() {
  return new Date() < this.start_date;
};

Event.prototype.isOngoing = function() {
  const now = new Date();
  return now >= this.start_date && (!this.end_date || now <= this.end_date);
};

Event.prototype.isPast = function() {
  return this.end_date && new Date() > this.end_date;
};

Event.prototype.cancel = async function(reason) {
  this.is_cancelled = true;
  this.status = 'cancelled';
  this.cancellation_reason = reason;
  await this.save(['is_cancelled', 'status', 'cancellation_reason']);
  
  // Ici, on pourrait ajouter la logique pour notifier les participants
};

// Méthodes de classe
Event.getUpcoming = function(limit = 10) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      start_date: { [Op.gte]: new Date() },
      is_public: true,
      is_cancelled: false,
      status: 'published'
    },
    order: [['start_date', 'ASC']],
    limit,
    include: ['organizer', 'category']
  });
};

Event.getFeatured = function(limit = 6) {
  return this.findAll({
    where: {
      is_featured: true,
      is_public: true,
      is_cancelled: false,
      status: 'published'
    },
    order: [['start_date', 'ASC']],
    limit,
    include: ['organizer', 'category']
  });
};

Event.searchEvents = function(query, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { location: { [Op.like]: `%${query}%` } }
      ],
      is_public: true,
      is_cancelled: false,
      ...options.where
    },
    order: [['start_date', 'ASC']],
    limit: options.limit || 20,
    offset: options.offset || 0,
    include: ['organizer', 'category']
  });
};

Event.getByDateRange = function(startDate, endDate, options = {}) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      [Op.or]: [
        {
          start_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        {
          end_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        {
          [Op.and]: [
            { start_date: { [Op.lte]: startDate } },
            { end_date: { [Op.gte]: endDate } }
          ]
        }
      ],
      is_public: true,
      is_cancelled: false,
      ...options.where
    },
    order: [['start_date', 'ASC']],
    include: ['organizer', 'category']
  });
};

module.exports = Event;