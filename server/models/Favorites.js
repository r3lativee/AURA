const mongoose = require('mongoose');

const favoritesSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Removing explicit index since user field is already marked as unique
// favoritesSchema.index({ user: 1 });

module.exports = mongoose.model('Favorites', favoritesSchema); 