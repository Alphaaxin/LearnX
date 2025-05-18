const User = require('./User');
const Session = require('./Session');
const Booking = require('./Booking');
const Message = require('./Message');
const Review = require('./Review');

// All associations are defined in their respective model files
// This file is used to export all models from a single point

module.exports = {
  User,
  Session,
  Booking,
  Message,
  Review
}; 