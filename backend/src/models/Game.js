const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Game must have a creator']
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  players: [{
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: true
    },
    deck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      required: true
    },
    placement: {
      type: Number,
      required: true,
      min: [1, 'Placement must be at least 1'],
      max: [6, 'Placement cannot be more than 6'] // Max 6 players per game
    },
    eliminatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: false
    },
    borrowedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Player',
      required: false
    }
  }],
  durationMinutes: {
    type: Number,
    min: [1, 'Duration must be at least 1 minute'],
    max: [600, 'Duration cannot be more than 10 hours (600 minutes)']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true
});

// Validation to ensure unique placements within a game
GameSchema.pre('save', function(next) {
  const placements = this.players.map(p => p.placement);
  const uniquePlacements = [...new Set(placements)];
  
  if (placements.length !== uniquePlacements.length) {
    return next(new Error('Each player must have a unique placement'));
  }
  
  // Ensure placements are consecutive starting from 1
  uniquePlacements.sort((a, b) => a - b);
  for (let i = 0; i < uniquePlacements.length; i++) {
    if (uniquePlacements[i] !== i + 1) {
      return next(new Error('Placements must be consecutive starting from 1'));
    }
  }
  
  // Ensure 1st place player doesn't have an eliminatedBy value
  const winner = this.players.find(p => p.placement === 1);
  if (winner && winner.eliminatedBy) {
    return next(new Error('Winner (1st place) cannot have an eliminatedBy value'));
  }
  
  next();
});

// Validation to ensure minimum 2 players
GameSchema.pre('save', function(next) {
  if (this.players.length < 2) {
    return next(new Error('A game must have at least 2 players'));
  }
  if (this.players.length > 6) {
    return next(new Error('A game cannot have more than 6 players'));
  }
  next();
});

// Index for efficient queries
GameSchema.index({ date: -1 });
GameSchema.index({ createdBy: 1 });
GameSchema.index({ 'players.player': 1 });
GameSchema.index({ 'players.deck': 1 });

module.exports = mongoose.model('Game', GameSchema);