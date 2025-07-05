// models/events/EventRegistration.js
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const EventRegistration = sequelize.define('EventRegistration', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  event_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'events',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  registration_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('registered', 'waiting_list', 'confirmed', 'attended', 'no_show', 'cancelled'),
    allowNull: false,
    defaultValue: 'registered'
  },
  attendance_status: {
    type: DataTypes.ENUM('pending', 'present', 'absent', 'partial'),
    allowNull: false,
    defaultValue: 'pending'
  },
  registration_source: {
    type: DataTypes.ENUM('website', 'email', 'social_media', 'referral', 'other'),
    allowNull: false,
    defaultValue: 'website'
  },
  special_requirements: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Besoins spéciaux ou demandes particulières'
  },
  dietary_restrictions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Restrictions alimentaires'
  },
  contact_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Informations de contact supplémentaires'
  },
  emergency_contact: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Contact d\'urgence'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed', 'free'),
    allowNull: false,
    defaultValue: 'free'
  },
  payment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  payment_method: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  payment_reference: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Référence de paiement'
  },
  confirmation_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Code de confirmation unique'
  },
  qr_code: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'QR code pour l\'entrée'
  },
  check_in_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Heure d\'arrivée à l\'événement'
  },
  check_out_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Heure de départ de l\'événement'
  },
  feedback_submitted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  feedback_rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback_comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  certificate_issued: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  certificate_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes internes sur l\'inscription'
  },
  reminded_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Dernière fois qu\'un rappel a été envoyé'
  },
  reminder_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'event_registrations',
  indexes: [
    { fields: ['event_id'] },
    { fields: ['user_id'] },
    { fields: ['status'] },
    { fields: ['attendance_status'] },
    { fields: ['payment_status'] },
    { fields: ['confirmation_code'] },
    { fields: ['registration_date'] },
    { fields: ['check_in_time'] },
    { fields: ['feedback_submitted'] },
    { fields: ['certificate_issued'] },
    { 
      fields: ['event_id', 'user_id'], 
      unique: true,
      name: 'unique_event_user_registration'
    }
  ],
  hooks: {
    beforeCreate: async (registration) => {
      // Générer un code de confirmation unique
      if (!registration.confirmation_code) {
        registration.confirmation_code = require('crypto')
          .randomBytes(8)
          .toString('hex')
          .toUpperCase();
      }
    },
    afterCreate: async (registration) => {
      // Mettre à jour le compteur de participants de l'événement
      const event = await registration.getEvent();
      if (event) {
        if (registration.status === 'registered' || registration.status === 'confirmed') {
          await event.increment('current_participants');
        } else if (registration.status === 'waiting_list') {
          await event.increment('waiting_list_count');
        }
      }
    },
    afterUpdate: async (registration) => {
      // Gérer les changements de statut
      if (registration.changed('status')) {
        const event = await registration.getEvent();
        if (event) {
          // Recalculer les compteurs
          const registeredCount = await EventRegistration.count({
            where: { 
              event_id: registration.event_id,
              status: ['registered', 'confirmed', 'attended']
            }
          });
          const waitingCount = await EventRegistration.count({
            where: { 
              event_id: registration.event_id,
              status: 'waiting_list'
            }
          });
          
          await event.update({
            current_participants: registeredCount,
            waiting_list_count: waitingCount
          });
        }
      }
    }
  }
});

// Méthodes d'instance
EventRegistration.prototype.confirm = async function() {
  this.status = 'confirmed';
  await this.save(['status']);
  
  // Ici, on pourrait envoyer un email de confirmation
};

EventRegistration.prototype.cancel = async function(reason) {
  this.status = 'cancelled';
  this.cancellation_reason = reason;
  this.cancelled_at = new Date();
  await this.save(['status', 'cancellation_reason', 'cancelled_at']);
  
  // Ici, on pourrait traiter le remboursement si nécessaire
};

EventRegistration.prototype.checkIn = async function() {
  this.attendance_status = 'present';
  this.check_in_time = new Date();
  await this.save(['attendance_status', 'check_in_time']);
};

EventRegistration.prototype.checkOut = async function() {
  this.check_out_time = new Date();
  await this.save(['check_out_time']);
  
  // Marquer comme ayant assisté si le check-in a eu lieu
  if (this.check_in_time) {
    this.status = 'attended';
    await this.save(['status']);
  }
};

EventRegistration.prototype.submitFeedback = async function(rating, comment) {
  this.feedback_rating = rating;
  this.feedback_comment = comment;
  this.feedback_submitted = true;
  await this.save(['feedback_rating', 'feedback_comment', 'feedback_submitted']);
};

EventRegistration.prototype.issueCertificate = async function(certificateUrl) {
  this.certificate_issued = true;
  this.certificate_url = certificateUrl;
  await this.save(['certificate_issued', 'certificate_url']);
};

EventRegistration.prototype.moveToWaitingList = async function() {
  this.status = 'waiting_list';
  await this.save(['status']);
};

EventRegistration.prototype.promoteFromWaitingList = async function() {
  this.status = 'registered';
  await this.save(['status']);
  
  // Ici, on pourrait envoyer une notification
};

EventRegistration.prototype.sendReminder = async function() {
  this.reminded_at = new Date();
  this.reminder_count += 1;
  await this.save(['reminded_at', 'reminder_count']);
  
  // Ici, on pourrait envoyer l'email de rappel
};

// Méthodes de classe
EventRegistration.findByEvent = function(eventId, options = {}) {
  return this.findAll({
    where: { 
      event_id: eventId,
      ...options.where
    },
    order: [['registration_date', 'ASC']],
    include: ['user'],
    ...options
  });
};

EventRegistration.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: { 
      user_id: userId,
      ...options.where
    },
    order: [['registration_date', 'DESC']],
    include: ['event'],
    ...options
  });
};

EventRegistration.getAttendanceStats = function(eventId) {
  return this.findAll({
    where: { event_id: eventId },
    attributes: [
      'attendance_status',
      [sequelize.fn('COUNT', '*'), 'count']
    ],
    group: ['attendance_status'],
    raw: true
  });
};

EventRegistration.getFeedbackStats = function(eventId) {
  return this.findOne({
    where: { 
      event_id: eventId,
      feedback_submitted: true
    },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('feedback_rating')), 'average_rating'],
      [sequelize.fn('COUNT', '*'), 'total_feedback']
    ],
    raw: true
  });
};

EventRegistration.getPendingReminders = function() {
  const { Op } = require('sequelize');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  
  return this.findAll({
    where: {
      status: ['registered', 'confirmed'],
      [Op.or]: [
        { reminded_at: null },
        { reminded_at: { [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    },
    include: [{
      model: require('./Event'),
      as: 'event',
      where: {
        start_date: {
          [Op.between]: [tomorrow, dayAfterTomorrow]
        },
        is_cancelled: false
      }
    }, {
      model: require('../user/User'),
      as: 'user'
    }]
  });
};

module.exports = EventRegistration;