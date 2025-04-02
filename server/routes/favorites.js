const express = require('express');
const Favorites = require('../models/Favorites');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user's favorites
router.get('/', auth, async (req, res) => {
  try {
    let favorites = await Favorites.findOne({ user: req.user._id })
      .populate('products');

    if (!favorites) {
      favorites = await Favorites.create({ user: req.user._id, products: [] });
    }

    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add product to favorites
router.post('/:productId', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let favorites = await Favorites.findOne({ user: req.user._id });
    if (!favorites) {
      favorites = new Favorites({ user: req.user._id, products: [] });
    }

    if (!favorites.products.includes(req.params.productId)) {
      favorites.products.push(req.params.productId);
      await favorites.save();
    }

    await favorites.populate('products');
    res.json(favorites);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove product from favorites
router.delete('/:productId', auth, async (req, res) => {
  try {
    const favorites = await Favorites.findOne({ user: req.user._id });
    if (!favorites) {
      return res.status(404).json({ message: 'Favorites not found' });
    }

    favorites.products = favorites.products.filter(
      productId => productId.toString() !== req.params.productId
    );

    await favorites.save();
    await favorites.populate('products');
    res.json(favorites);
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if product is in favorites
router.get('/:productId', auth, async (req, res) => {
  try {
    const favorites = await Favorites.findOne({ user: req.user._id });
    if (!favorites) {
      return res.json({ isFavorite: false });
    }

    const isFavorite = favorites.products.includes(req.params.productId);
    res.json({ isFavorite });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 