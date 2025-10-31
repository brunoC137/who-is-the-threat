const express = require('express');
const { body, validationResult } = require('express-validator');
const Deck = require('../models/Deck');
const Player = require('../models/Player');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all decks
// @route   GET /decks
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit;

    // Build query object
    let query = {};
    
    // Filter by owner if specified
    if (req.query.owner) {
      query.owner = req.query.owner;
    }
    
    // Filter by color identity if specified
    if (req.query.colors) {
      const colors = req.query.colors.split(',').map(c => c.toUpperCase());
      query.colorIdentity = { $in: colors };
    }
    
    // Filter by tags if specified
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      query.tags = { $in: tags };
    }

    // Search by name or commander
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { commander: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await Deck.countDocuments(query);
    const decks = await Deck.find(query)
      .populate('owner', 'name nickname profileImage')
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

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
      count: decks.length,
      total,
      pagination,
      data: decks
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single deck
// @route   GET /decks/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const deck = await Deck.findById(req.params.id)
      .populate('owner', 'name nickname profileImage');

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      });
    }

    res.status(200).json({
      success: true,
      data: deck
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new deck
// @route   POST /decks
// @access  Private
router.post('/', protect, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Deck name must be between 1 and 100 characters'),
  body('commander')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Commander name must be between 1 and 100 characters'),
  body('decklistLink')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Decklist link must be a valid URL'),
  body('deckImage')
    .optional(),
  body('colorIdentity')
    .optional()
    .isArray()
    .withMessage('Color identity must be an array'),
  body('colorIdentity.*')
    .optional()
    .isIn(['W', 'U', 'B', 'R', 'G', 'C'])
    .withMessage('Color identity must contain valid colors (W, U, B, R, G, C)'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag must be 30 characters or less')
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

    // Set owner to current user unless admin is creating for someone else
    let owner = req.user._id;
    if (req.body.owner && req.user.isAdmin) {
      owner = req.body.owner;
    }

    const deck = await Deck.create({
      ...req.body,
      owner
    });

    // Add deck to player's decks array
    await Player.findByIdAndUpdate(owner, {
      $push: { decks: deck._id }
    });

    const populatedDeck = await Deck.findById(deck._id)
      .populate('owner', 'name nickname profileImage');

    res.status(201).json({
      success: true,
      data: populatedDeck
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update deck
// @route   PUT /decks/:id
// @access  Private (owner or admin)
router.put('/:id', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Deck name must be between 1 and 100 characters'),
  body('commander')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Commander name must be between 1 and 100 characters'),
  body('decklistLink')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Decklist link must be a valid URL'),
  body('deckImage')
    .optional(),
  body('colorIdentity')
    .optional()
    .isArray()
    .withMessage('Color identity must be an array'),
  body('colorIdentity.*')
    .optional()
    .isIn(['W', 'U', 'B', 'R', 'G', 'C'])
    .withMessage('Color identity must contain valid colors (W, U, B, R, G, C)'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage('Each tag must be 30 characters or less')
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

    let deck = await Deck.findById(req.params.id);

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      });
    }

    // Check if user can update this deck
    if (deck.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this deck'
      });
    }

    // Remove undefined fields
    const fieldsToUpdate = { ...req.body };
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Don't allow changing owner unless admin
    if (fieldsToUpdate.owner && !req.user.isAdmin) {
      delete fieldsToUpdate.owner;
    }

    deck = await Deck.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    }).populate('owner', 'name nickname profileImage');

    res.status(200).json({
      success: true,
      data: deck
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete deck
// @route   DELETE /decks/:id
// @access  Private (owner or admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const deck = await Deck.findById(req.params.id);

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: 'Deck not found'
      });
    }

    // Check if user can delete this deck
    if (deck.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this deck'
      });
    }

    // Remove deck from player's decks array
    await Player.findByIdAndUpdate(deck.owner, {
      $pull: { decks: deck._id }
    });

    await deck.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Deck deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;