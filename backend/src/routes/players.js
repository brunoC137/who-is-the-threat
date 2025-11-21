const express = require('express');
const { body, validationResult } = require('express-validator');
const Player = require('../models/Player');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @desc    Create guest player
// @route   POST /players/guest
// @access  Private
router.post('/guest', protect, [
  body('nickname')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Nickname must be between 2 and 30 characters')
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

    const { nickname } = req.body;

    // Check if guest player with this nickname already exists
    const existingGuest = await Player.findOne({ nickname, isGuest: true });
    if (existingGuest) {
      return res.status(400).json({
        success: false,
        message: 'A guest player with this nickname already exists'
      });
    }

    // Check if registered player with this nickname already exists
    const existingRegistered = await Player.findOne({ nickname, isGuest: false });
    if (existingRegistered) {
      return res.status(400).json({
        success: false,
        message: 'A registered player with this nickname already exists'
      });
    }

    // Create guest player
    const guestPlayer = await Player.create({
      name: nickname,
      nickname: nickname,
      isGuest: true
    });

    res.status(201).json({
      success: true,
      data: guestPlayer
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Check if guest player exists by nickname
// @route   GET /players/guest/check/:nickname
// @access  Public
router.get('/guest/check/:nickname', async (req, res, next) => {
  try {
    const guestPlayer = await Player.findOne({ 
      nickname: req.params.nickname, 
      isGuest: true 
    });

    res.status(200).json({
      success: true,
      exists: !!guestPlayer,
      data: guestPlayer
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all players
// @route   GET /players
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;

    const total = await Player.countDocuments();
    const players = await Player.find()
      .populate('decks', 'name commander')
      .skip(startIndex)
      .limit(limit)
      .sort({ name: 1 });

    const pagination = {};
    if (startIndex + limit < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: players.length,
      total,
      pagination,
      data: players
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single player
// @route   GET /players/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id)
      .populate('decks', 'name commander deckImage colorIdentity tags');

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update player
// @route   PUT /players/:id
// @access  Private (own profile) or Admin
router.put('/:id', protect, [
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
    .withMessage('Profile image must be a valid URL'),
  body('isAdmin')
    .optional()
    .isBoolean()
    .withMessage('isAdmin must be a boolean value')
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

    let player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if user can update this player
    if (player._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this player'
      });
    }

    // Only admins can change isAdmin status
    if (req.body.isAdmin !== undefined && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can change admin status'
      });
    }

    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      nickname: req.body.nickname,
      profileImage: req.body.profileImage
    };

    // Add isAdmin only if user is admin
    if (req.user.isAdmin && req.body.isAdmin !== undefined) {
      fieldsToUpdate.isAdmin = req.body.isAdmin;
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    player = await Player.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).populate('decks', 'name commander');

    res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete player
// @route   DELETE /players/:id
// @access  Admin only
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const player = await Player.findById(req.params.id);

    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Don't allow deletion of the last admin
    if (player.isAdmin) {
      const adminCount = await Player.countDocuments({ isAdmin: true });
      if (adminCount === 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await player.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;