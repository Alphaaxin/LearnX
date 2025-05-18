const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  skill: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  sessionMode: {
    type: DataTypes.ENUM('online', 'in-person'),
    allowNull: false
  },
  exchangeType: {
    type: DataTypes.ENUM('barter', 'paid'),
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  barterSkill: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  teacherId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

// Define association
Session.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Session, { foreignKey: 'teacherId', as: 'taughtSessions' });

module.exports = Session; 