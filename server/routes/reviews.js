const express = require('express');
const Review = require('../models/Review');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all reviews for a product
router.get('/product/:productId', async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name profileImage')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// Get user's reviews
router.get('/my-reviews', auth, async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name images')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// Create a review
router.post('/', auth, async (req, res, next) => {
  try {
    const { productId, rating, title, review, images } = req.body;

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({
        message: 'You have already reviewed this product'
      });
    }

    const newReview = new Review({
      user: req.user._id,
      product: productId,
      rating,
      title,
      review,
      images
    });

    const savedReview = await newReview.save();
    
    // Fix: Use separate populate calls or path option instead of chaining
    await savedReview.populate('user', 'name profileImage');
    await savedReview.populate('product', 'name images');

    res.status(201).json(savedReview);
  } catch (error) {
    next(error);
  }
});

// Update a review
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const allowedUpdates = ['rating', 'title', 'review', 'images'];
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        review[key] = req.body[key];
      }
    });

    const updatedReview = await review.save();
    // Fix: Use separate populate calls
    await updatedReview.populate('user', 'name profileImage');
    await updatedReview.populate('product', 'name images');

    res.json(updatedReview);
  } catch (error) {
    next(error);
  }
});

// Delete a review
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review or is admin
    if (!req.user.isAdmin && review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await review.remove();
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Like/Unlike a review
router.post('/:id/like', auth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const likeIndex = review.likes.indexOf(req.user._id);
    
    if (likeIndex === -1) {
      // Like the review
      review.likes.push(req.user._id);
    } else {
      // Unlike the review
      review.likes.splice(likeIndex, 1);
    }

    await review.save();
    res.json({ likes: review.likes.length });
  } catch (error) {
    next(error);
  }
});

// Add reply to a review (admin only)
router.post('/:id/reply', adminAuth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.replies.push({
      user: req.user._id,
      comment: req.body.comment
    });

    const updatedReview = await review.save();
    // Fix: Use single populate call
    await updatedReview.populate('replies.user', 'name profileImage');

    res.status(201).json(updatedReview);
  } catch (error) {
    next(error);
  }
});

// Delete reply from a review (admin only)
router.delete('/:id/reply/:replyId', adminAuth, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.replies = review.replies.filter(
      reply => reply._id.toString() !== req.params.replyId
    );

    await review.save();
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 