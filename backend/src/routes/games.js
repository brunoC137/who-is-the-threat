const express = require('express');
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all games
// @route   GET /games
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;

    // Build query object
    let query = {};
    
    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }
    
    // Filter by player
    if (req.query.player) {
      query['players.player'] = req.query.player;
    }
    
    // Filter by deck
    if (req.query.deck) {
      query['players.deck'] = req.query.deck;
    }

    const total = await Game.countDocuments(query);
    const games = await Game.find(query)
      .populate('createdBy', 'name nickname')
      .populate('players.player', 'name nickname profileImage')
      .populate('players.deck', 'name commander deckImage')
      .skip(startIndex)
      .limit(limit)
      .sort({ date: -1 });

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
      count: games.length,
      total,
      pagination,
      data: games
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single game
// @route   GET /games/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('createdBy', 'name nickname profileImage')
      .populate('players.player', 'name nickname profileImage')
      .populate('players.deck', 'name commander deckImage colorIdentity');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    res.status(200).json({
      success: true,
      data: game
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new game
// @route   POST /games
// @access  Private
router.post('/', protect, [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO8601 format'),
  body('players')
    .isArray({ min: 2, max: 6 })
    .withMessage('Game must have between 2 and 6 players'),
  body('players.*.player')
    .isMongoId()
    .withMessage('Player ID must be a valid MongoDB ObjectId'),
  body('players.*.deck')
    .isMongoId()
    .withMessage('Deck ID must be a valid MongoDB ObjectId'),
  body('players.*.placement')
    .isInt({ min: 1, max: 6 })
    .withMessage('Placement must be between 1 and 6'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be between 1 and 600 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters')
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

    // Validate placements are unique and consecutive
    const placements = req.body.players.map(p => p.placement);
    const uniquePlacements = [...new Set(placements)];
    
    if (placements.length !== uniquePlacements.length) {
      return res.status(400).json({
        success: false,
        message: 'Each player must have a unique placement'
      });
    }

    uniquePlacements.sort((a, b) => a - b);
    for (let i = 0; i < uniquePlacements.length; i++) {
      if (uniquePlacements[i] !== i + 1) {
        return res.status(400).json({
          success: false,
          message: 'Placements must be consecutive starting from 1'
        });
      }
    }

    // Validate no duplicate players
    const playerIds = req.body.players.map(p => p.player);
    const uniquePlayerIds = [...new Set(playerIds.map(id => id.toString()))];
    
    if (playerIds.length !== uniquePlayerIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Each player can only participate once in a game'
      });
    }

    const game = await Game.create({
      ...req.body,
      createdBy: req.user._id
    });

    const populatedGame = await Game.findById(game._id)
      .populate('createdBy', 'name nickname')
      .populate('players.player', 'name nickname profileImage')
      .populate('players.deck', 'name commander deckImage');

    res.status(201).json({
      success: true,
      data: populatedGame
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update game
// @route   PUT /games/:id
// @access  Private (creator or admin)
router.put('/:id', protect, [
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO8601 format'),
  body('players')
    .optional()
    .isArray({ min: 2, max: 6 })
    .withMessage('Game must have between 2 and 6 players'),
  body('players.*.player')
    .optional()
    .isMongoId()
    .withMessage('Player ID must be a valid MongoDB ObjectId'),
  body('players.*.deck')
    .optional()
    .isMongoId()
    .withMessage('Deck ID must be a valid MongoDB ObjectId'),
  body('players.*.placement')
    .optional()
    .isInt({ min: 1, max: 6 })
    .withMessage('Placement must be between 1 and 6'),
  body('players.*.eliminatedBy')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('EliminatedBy must be a valid MongoDB ObjectId'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be between 1 and 600 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters')
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

    let game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user can update this game
    if (game.createdBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this game'
      });
    }

    // If updating players, validate placements
    if (req.body.players) {
      const placements = req.body.players.map(p => p.placement);
      const uniquePlacements = [...new Set(placements)];
      
      if (placements.length !== uniquePlacements.length) {
        return res.status(400).json({
          success: false,
          message: 'Each player must have a unique placement'
        });
      }

      uniquePlacements.sort((a, b) => a - b);
      for (let i = 0; i < uniquePlacements.length; i++) {
        if (uniquePlacements[i] !== i + 1) {
          return res.status(400).json({
            success: false,
            message: 'Placements must be consecutive starting from 1'
          });
        }
      }

      // Validate no duplicate players
      const playerIds = req.body.players.map(p => p.player);
      const uniquePlayerIds = [...new Set(playerIds.map(id => id.toString()))];
      
      if (playerIds.length !== uniquePlayerIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Each player can only participate once in a game'
        });
      }

      // Validate eliminatedBy references
      const winner = req.body.players.find(p => p.placement === 1);
      if (winner && winner.eliminatedBy) {
        return res.status(400).json({
          success: false,
          message: 'Winner (1st place) cannot have an eliminatedBy value'
        });
      }

      // Validate that eliminatedBy references are players in the game
      for (const player of req.body.players) {
        if (player.eliminatedBy) {
          const eliminatorExists = playerIds.some(id => id.toString() === player.eliminatedBy.toString());
          if (!eliminatorExists) {
            return res.status(400).json({
              success: false,
              message: 'EliminatedBy must reference a player in the game'
            });
          }
        }
      }
    }

    // Remove undefined fields
    const fieldsToUpdate = { ...req.body };
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    game = await Game.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    })
    .populate('createdBy', 'name nickname')
    .populate('players.player', 'name nickname profileImage')
    .populate('players.deck', 'name commander deckImage');

    res.status(200).json({
      success: true,
      data: game
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete game
// @route   DELETE /games/:id
// @access  Private (creator or admin)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user can delete this game
    if (game.createdBy.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this game'
      });
    }

    await game.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Game deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;