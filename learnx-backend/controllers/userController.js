const { User, Session, Review } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Session,
          as: 'taughtSessions',
          where: { isActive: true },
          required: false
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get average rating for teacher
    if (user.role === 'teacher' || user.role === 'both') {
      const sessions = await Session.findAll({
        where: { teacherId: user.id },
        include: [
          {
            model: Review,
            attributes: ['rating']
          }
        ]
      });
      
      let totalRating = 0;
      let ratingCount = 0;
      
      sessions.forEach(session => {
        session.Reviews.forEach(review => {
          totalRating += review.rating;
          ratingCount++;
        });
      });
      
      user.dataValues.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      user.dataValues.reviewCount = ratingCount;
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile', error: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, bio, skills } = req.body;
    
    console.log("Update profile request:", { body: req.body, file: req.file });
    
    // Update fields
    if (name) user.name = name;
    if (bio) user.bio = bio;
    if (skills) user.skills = typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills;
    
    // Handle profile photo update
    if (req.file) {
      console.log("Profile photo received:", req.file);
      
      // Remove old profile photo if exists
      if (user.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '..', user.profilePhoto);
        console.log("Checking for old photo at:", oldPhotoPath);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
          console.log("Deleted old photo");
        }
      }
      
      // Set new profile photo
      user.profilePhoto = `/uploads/${req.file.filename}`;
      console.log("Set new profile photo path:", user.profilePhoto);
    } else if (req.body.profilePhoto && req.body.profilePhoto.startsWith('data:image')) {
      console.log("Received Base64 encoded image");
      
      // Handle Base64 encoded image
      const base64Data = req.body.profilePhoto.split(';base64,').pop();
      const fileType = req.body.profilePhoto.split(';')[0].split('/')[1];
      const fileName = `${uuidv4()}.${fileType}`;
      const filePath = path.join(__dirname, '../uploads', fileName);
      
      // Remove old profile photo if exists
      if (user.profilePhoto) {
        const oldPhotoPath = path.join(__dirname, '..', user.profilePhoto);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
          console.log("Deleted old photo");
        }
      }
      
      // Write the new image file
      fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
      console.log("Saved Base64 image to:", filePath);
      
      // Update user profile
      user.profilePhoto = `/uploads/${fileName}`;
      console.log("Set new profile photo path:", user.profilePhoto);
    } else {
      console.log("No profile photo file in request");
    }
    
    await user.save();
    
    // Return updated user data (excluding password)
    const userData = { ...user.get() };
    delete userData.password;
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

// Get teachers
const getTeachers = async (req, res) => {
  try {
    const { skill } = req.query;
    
    const whereClause = {
      [Op.or]: [
        { role: 'teacher' },
        { role: 'both' }
      ]
    };
    
    // Filter by skill if provided
    if (skill) {
      whereClause.skills = {
        [Op.contains]: [skill]
      };
    }
    
    const teachers = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: 'Failed to get teachers', error: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getTeachers
}; 