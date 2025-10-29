const mongoose = require('mongoose');

const DeckSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Deck must have an owner']
  },
  name: {
    type: String,
    required: [true, 'Deck name is required'],
    trim: true,
    maxlength: [100, 'Deck name cannot be more than 100 characters']
  },
  commander: {
    type: String,
    required: [true, 'Commander is required'],
    trim: true,
    maxlength: [100, 'Commander name cannot be more than 100 characters']
  },
  decklistLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+$/i.test(v);
      },
      message: 'Decklist link must be a valid URL'
    }
  },
  deckImage: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Deck image must be a valid URL to an image file'
    }
  },
  colorIdentity: [{
    type: String,
    enum: ['W', 'U', 'B', 'R', 'G', 'C'], // White, Blue, Black, Red, Green, Colorless
    uppercase: true
  }],
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }]
}, {
  timestamps: true
});

// Index for efficient queries
DeckSchema.index({ owner: 1 });
DeckSchema.index({ name: 1, owner: 1 });
DeckSchema.index({ commander: 1 });
DeckSchema.index({ colorIdentity: 1 });
DeckSchema.index({ tags: 1 });

// Virtual for games count (to be populated if needed)
DeckSchema.virtual('gamesCount', {
  ref: 'Game',
  localField: '_id',
  foreignField: 'players.deck',
  count: true
});

module.exports = mongoose.model('Deck', DeckSchema);