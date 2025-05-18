const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Session = require('./Session');
const Booking = require('./Booking');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reviewerId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.UUID,
    references: {
      model: Session,
      key: 'id'
    }
  },
  bookingId: {
    type: DataTypes.UUID,
    references: {
      model: Booking,
      key: 'id'
    }
  }
}, {
  timestamps: true
});

// Define associations
Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });
User.hasMany(Review, { foreignKey: 'reviewerId', as: 'givenReviews' });

Review.belongsTo(Session, { foreignKey: 'sessionId' });
Session.hasMany(Review, { foreignKey: 'sessionId' });

Review.belongsTo(Booking, { foreignKey: 'bookingId' });
Booking.hasOne(Review, { foreignKey: 'bookingId' });

module.exports = Review; 