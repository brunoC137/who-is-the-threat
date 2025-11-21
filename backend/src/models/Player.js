const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PlayerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  nickname: {
    type: String,
    trim: true,
    maxlength: [30, 'Nickname cannot be more than 30 characters']
  },
  email: {
    type: String,
    required: function() {
      return !this.isGuest;
    },
    unique: true,
    sparse: true, // Allows multiple null values for guest players
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.isGuest;
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  profileImage: {
    type: String,
    default: '',
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Profile image must be a valid URL to an image file'
    }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isGuest: {
    type: Boolean,
    default: false
  },
  decks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck'
  }]
}, {
  timestamps: true
});

// Hash password before saving (skip for guest players)
PlayerSchema.pre('save', async function(next) {
  if (!this.isModified('password') || this.isGuest) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
PlayerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Transform output to remove password
PlayerSchema.methods.toJSON = function() {
  const playerObject = this.toObject();
  delete playerObject.password;
  return playerObject;
};

module.exports = mongoose.model('Player', PlayerSchema);