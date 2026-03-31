const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const Player = require('../models/Player');
const { sendTokenResponse, generateToken } = require('../utils/auth');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

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

    // Prevent guest players from logging in
    if (user.isGuest) {
      return res.status(401).json({
        success: false,
        message: 'Guest players cannot login. Please register first.'
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

// @desc    Forgot password - send reset email
// @route   POST /auth/forgotpassword
// @access  Public
router.post('/forgotpassword', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const user = await Player.findOne({ email: req.body.email });

    // Always respond with success to avoid user enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Guerreiros do Segundo Lugar</h2>
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Click the button below to set a new password.</p>
        <p>This link will expire in <strong>10 minutes</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#6b7280;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        <p style="color:#6b7280;font-size:12px;">Or copy this link: ${resetUrl}</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset - Guerreiros do Segundo Lugar',
        html
      });

      // In development mode, also log the reset URL for easy testing
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔐 ========== PASSWORD RESET TOKEN ==========');
        console.log('Reset URL:', resetUrl);
        console.log('Token expires in 10 minutes');
        console.log('===========================================\n');
      }

      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      
      // Roll back token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Reset password using token
// @route   PUT /auth/resetpassword/:resettoken
// @access  Public
router.put('/resetpassword/:resettoken', [
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Hash the incoming token to compare with stored hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await Player.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;