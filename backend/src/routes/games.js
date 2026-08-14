const express = require('express');
const { body, validationResult } = require('express-validator');
const Game = require('../models/Game');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

/**
 * Referential checks that express-validator cannot express on its own, because
 * they compare participants against each other rather than validating a single
 * field. Shared by POST and PUT so both verbs enforce the same rules.
 *
 * Returns an error message, or null when the participants are valid.
 */
const validateParticipantReferences = (players) => {
  const participantIds = players.map(p => p.player.toString());

  const winner = players.find(p => p.placement === 1);
  if (winner && winner.eliminatedBy) {
    return 'Winner (1st place) cannot have an eliminatedBy value';
  }
  if (winner && winner.eliminationCause) {
    return 'Winner (1st place) cannot have an eliminationCause';
  }

  for (const participant of players) {
    const participantId = participant.player.toString();

    if (participant.eliminatedBy) {
      const eliminatorId = participant.eliminatedBy.toString();

      if (eliminatorId === participantId) {
        return 'A player cannot be eliminated by themselves';
      }
      if (!participantIds.includes(eliminatorId)) {
        return 'EliminatedBy must reference a player in the game';
      }
    }

    if (!Array.isArray(participant.commanderDamage)) continue;

    const sources = participant.commanderDamage.map(entry => entry.from.toString());

    if (sources.some(source => source === participantId)) {
      return 'Commander damage cannot come from the player themselves';
    }
    if (sources.some(source => !participantIds.includes(source))) {
      return 'Commander damage must reference a player in the game';
    }
    if (new Set(sources).size !== sources.length) {
      return 'Commander damage can only have one entry per source player';
    }
  }

  return null;
};

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
      .populate('players.eliminatedBy', 'name nickname profileImage')
      .populate('players.borrowedFrom', 'name nickname profileImage')
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
      .populate('players.deck', 'name commander deckImage colorIdentity')
      .populate('players.eliminatedBy', 'name nickname profileImage')
      .populate('players.borrowedFrom', 'name nickname profileImage')
      .populate('players.commanderDamage.from', 'name nickname profileImage');

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
  body('players.*.borrowedFrom')
    .optional()
    .custom(value => {
      // Allow undefined, null, empty string, or valid ObjectId
      if (value === undefined || value === null || value === '') {
        return true;
      }
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('BorrowedFrom must be a valid MongoDB ObjectId or empty'),
  body('players.*.eliminationCause')
    .optional({ checkFalsy: true })
    .isIn(['life', 'poison', 'commanderDamage', 'conceded', 'other'])
    .withMessage('Elimination cause must be life, poison, commanderDamage, conceded or other'),
  body('players.*.poison')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Poison counters must be between 0 and 10'),
  body('players.*.commanderDamage')
    .optional()
    .isArray()
    .withMessage('Commander damage must be an array'),
  body('players.*.commanderDamage.*.from')
    .isMongoId()
    .withMessage('Commander damage source must be a valid MongoDB ObjectId'),
  body('players.*.commanderDamage.*.damage')
    .isInt({ min: 0, max: 21 })
    .withMessage('Commander damage must be between 0 and 21'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be between 1 and 600 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters'),
  body('commentary')
    .optional()
    .isArray({ max: 200 })
    .withMessage('Commentary must be an array of at most 200 entries'),
  body('commentary.*.text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Commentary text must be between 1 and 500 characters'),
  body('commentary.*.timestamp')
    .optional()
    .isISO8601()
    .withMessage('Commentary timestamp must be in ISO8601 format')
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

    // Cross-participant checks (eliminatedBy / commanderDamage references)
    const referenceError = validateParticipantReferences(req.body.players);
    if (referenceError) {
      return res.status(400).json({
        success: false,
        message: referenceError
      });
    }

    const game = await Game.create({
      ...req.body,
      createdBy: req.user._id
    });

    const populatedGame = await Game.findById(game._id)
      .populate('createdBy', 'name nickname')
      .populate('players.player', 'name nickname profileImage')
      .populate('players.deck', 'name commander deckImage')
      .populate('players.eliminatedBy', 'name nickname profileImage')
      .populate('players.borrowedFrom', 'name nickname profileImage')
      .populate('players.commanderDamage.from', 'name nickname profileImage');

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
    .optional()
    .custom(value => {
      // Allow undefined, null, empty string, or valid ObjectId
      if (value === undefined || value === null || value === '') {
        return true;
      }
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('EliminatedBy must be a valid MongoDB ObjectId or empty'),
  body('players.*.borrowedFrom')
    .optional()
    .custom(value => {
      // Allow undefined, null, empty string, or valid ObjectId
      if (value === undefined || value === null || value === '') {
        return true;
      }
      return /^[0-9a-fA-F]{24}$/.test(value);
    })
    .withMessage('BorrowedFrom must be a valid MongoDB ObjectId or empty'),
  body('players.*.eliminationCause')
    .optional({ checkFalsy: true })
    .isIn(['life', 'poison', 'commanderDamage', 'conceded', 'other'])
    .withMessage('Elimination cause must be life, poison, commanderDamage, conceded or other'),
  body('players.*.poison')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('Poison counters must be between 0 and 10'),
  body('players.*.commanderDamage')
    .optional()
    .isArray()
    .withMessage('Commander damage must be an array'),
  body('players.*.commanderDamage.*.from')
    .isMongoId()
    .withMessage('Commander damage source must be a valid MongoDB ObjectId'),
  body('players.*.commanderDamage.*.damage')
    .isInt({ min: 0, max: 21 })
    .withMessage('Commander damage must be between 0 and 21'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1, max: 600 })
    .withMessage('Duration must be between 1 and 600 minutes'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot be more than 500 characters'),
  body('commentary')
    .optional()
    .isArray({ max: 200 })
    .withMessage('Commentary must be an array of at most 200 entries'),
  body('commentary.*.text')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Commentary text must be between 1 and 500 characters'),
  body('commentary.*.timestamp')
    .optional()
    .isISO8601()
    .withMessage('Commentary timestamp must be in ISO8601 format')
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

      // Cross-participant checks (eliminatedBy / commanderDamage references)
      const referenceError = validateParticipantReferences(req.body.players);
      if (referenceError) {
        return res.status(400).json({
          success: false,
          message: referenceError
        });
      }
    }

    // Clean up the data
    const fieldsToUpdate = { ...req.body };

    // Remove undefined fields at top level
    Object.keys(fieldsToUpdate).forEach(key =>
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Clean up players array - convert empty strings to null for optional refs
    if (fieldsToUpdate.players) {
      fieldsToUpdate.players = fieldsToUpdate.players.map(player => ({
        ...player,
        eliminatedBy: player.eliminatedBy === '' || player.eliminatedBy === undefined ? null : player.eliminatedBy,
        eliminationCause: player.eliminationCause === '' || player.eliminationCause === undefined ? null : player.eliminationCause
      }));
    }

    game = await Game.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    })
    .populate('createdBy', 'name nickname')
    .populate('players.player', 'name nickname profileImage')
    .populate('players.deck', 'name commander deckImage')
    .populate('players.eliminatedBy', 'name nickname profileImage')
    .populate('players.borrowedFrom', 'name nickname profileImage')
    .populate('players.commanderDamage.from', 'name nickname profileImage');

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