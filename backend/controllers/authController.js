const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, UserPreference, Notification } = require('../models');
const { Op } = require('sequelize');

// Configuration for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const authController = {
  /**
   * User registration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register: async (req, res) => {
    try {
      const { 
        username, 
        email, 
        password, 
        firstName, 
        lastName, 
        role = 'user',
        speciality,
        interfaceLanguage = 'fr'
      } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username, email, and password are required' 
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'Username or email already exists' 
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        speciality
      });

      // Create default user preferences
      await UserPreference.create({
        userId: newUser.id,
        interfaceLanguage
      });

      // Create welcome notification
      await Notification.create({
        userId: newUser.id,
        type: 'system',
        content: 'Bienvenue sur la plateforme de dictionnaire wolof ! Commencez votre voyage linguistique.',
        link: '/profile'
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser.id, 
          username: newUser.username, 
          role: newUser.role 
        }, 
        JWT_SECRET, 
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during registration',
        error: error.message 
      });
    }
  },

  /**
   * User login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username and password are required' 
        });
      }

      // Find user
      const user = await User.findOne({ 
        where: { username },
        include: [{ model: UserPreference }]
      });

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials' 
        });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username, 
          role: user.role 
        }, 
        JWT_SECRET, 
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          interfaceLanguage: user.UserPreference?.interfaceLanguage || 'fr'
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during login',
        error: error.message 
      });
    }
  },

  /**
   * Password reset request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'No user found with this email' 
        });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user.id }, 
        JWT_SECRET, 
        { expiresIn: '1h' }
      );

      // TODO: Send email with reset link
      // This would typically involve sending an email with a link 
      // containing the resetToken to the user's email address

      // Create a notification about password reset
      await Notification.create({
        userId: user.id,
        type: 'system',
        content: 'Une demande de réinitialisation de mot de passe a été effectuée.',
        link: '/reset-password'
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email',
        // Note: In a real app, don't send the token to the client
        // This is just for demonstration
        resetToken 
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during password reset request',
        error: error.message 
      });
    }
  },

  /**
   * Reset password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid or expired reset token' 
        });
      }

      // Find user
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      await user.update({ password: hashedPassword });

      // Create notification about password change
      await Notification.create({
        userId: user.id,
        type: 'system',
        content: 'Votre mot de passe a été réinitialisé avec succès.',
        link: '/profile'
      });

      res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during password reset',
        error: error.message 
      });
    }
  },

  /**
   * Verify JWT token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  verifyToken: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'No token provided' 
        });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Find user
      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'username', 'email', 'role']
      });

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token' 
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired' 
        });
      }
      console.error('Token verification error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error during token verification',
        error: error.message 
      });
    }
  }
};

module.exports = authController;