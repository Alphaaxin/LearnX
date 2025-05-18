const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, username, email, password, role, bio, skills } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { email },
          { username }
        ] 
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Handle profile photo if uploaded
    let profilePhoto = null;
    if (req.file) {
      profilePhoto = `/uploads/${req.file.filename}`;
    }
    
    // Create new user
    const user = await User.create({
      name,
      username,
      email,
      password,
      role: role || 'learner',
      bio: bio || '',
      skills: skills ? (typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills) : [],
      profilePhoto
    });
    
    // Generate token
    const token = generateToken(user);
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Return user data (excluding password)
    const userData = { ...user.get() };
    delete userData.password;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken(user);
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Return user data (excluding password)
    const userData = { ...user.get() };
    delete userData.password;
    
    res.status(200).json({
      message: 'Login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Logout user
const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user data (excluding password)
    const userData = { ...user.get() };
    delete userData.password;
    
    res.status(200).json({ user: userData });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user', error: error.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    
    // Check if current password is correct
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword
}; 