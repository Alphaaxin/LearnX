const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Session = require('./Session');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'paid', 'refunded', 'not_applicable'),
    defaultValue: 'unpaid'
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.UUID,
    references: {
      model: Session,
      key: 'id'
    }
  },
  learnerId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Define associations
Booking.belongsTo(Session, { foreignKey: 'sessionId' });
Session.hasMany(Booking, { foreignKey: 'sessionId' });

Booking.belongsTo(User, { foreignKey: 'learnerId', as: 'learner' });
User.hasMany(Booking, { foreignKey: 'learnerId', as: 'bookings' });

module.exports = Booking; 