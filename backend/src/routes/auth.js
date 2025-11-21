const express = require('express');
const { body, validationResult } = require('express-validator');
const Player = require('../models/Player');
const { sendTokenResponse, generateToken } = require('../utils/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Register user
// @route   POST /auth/register
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Nickname cannot be more than 30 characters'),
  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, nickname, email, password, profileImage } = req.body;

    // Check if user exists with this email
    const existingUser = await Player.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if there's a guest player with matching nickname
    let guestPlayer = null;
    if (nickname) {
      guestPlayer = await Player.findOne({ nickname, isGuest: true });
    }

    let user;
    if (guestPlayer) {
      // Convert guest player to registered user
      guestPlayer.email = email;
      guestPlayer.password = password;
      guestPlayer.name = name;
      guestPlayer.isGuest = false;
      if (profileImage) {
        guestPlayer.profileImage = profileImage;
      }
      
      user = await guestPlayer.save();
      
      // Send token response with additional flag
      const token = generateToken(user._id);
      
      return res.status(201).json({
        success: true,
        message: 'Account created successfully. Your guest player data has been preserved.',
        convertedFromGuest: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          nickname: user.nickname,
          email: user.email,
          profileImage: user.profileImage,
          isAdmin: user.isAdmin
        }
      });
    } else {
      // Create new user
      user = await Player.create({
        name,
        nickname,
        email,
        password,
        profileImage
      });

      sendTokenResponse(user, 201, res);
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check for user
    const user = await Player.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await Player.findById(req.user.id).populate('decks');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user details
// @route   PUT /auth/updatedetails
// @access  Private
router.put('/updatedetails', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('nickname')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Nickname cannot be more than 30 characters'),
  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      nickname: req.body.nickname,
      profileImage: req.body.profileImage
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await Player.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update password
// @route   PUT /auth/updatepassword
// @access  Private
router.put('/updatepassword', protect, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await Player.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @desc    Logout user / clear cookie
// @route   POST /auth/logout
// @access  Private
router.post('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;