import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Rating,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
} from '@mui/material';
import { 
  FavoriteBorder, 
  Favorite, 
  ThumbUp, 
  Reply as ReplyIcon,
  MoreVert,
  Star,
  StarBorder,
  StarHalf
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ReviewSection = ({ productId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [hoverRating, setHoverRating] = useState(-1);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    review: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState([0, 0, 0, 0, 0]);

  const reviewListRef = useRef(null);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  useEffect(() => {
    if (reviews.length > 0) {
      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      setAverageRating(totalRating / reviews.length);

      // Calculate rating counts
      const counts = [0, 0, 0, 0, 0];
      reviews.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          counts[review.rating - 1]++;
        }
      });
      setRatingCounts(counts);
    } else {
      setAverageRating(0);
      setRatingCounts([0, 0, 0, 0, 0]);
    }
  }, [reviews]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await reviewsAPI.getByProduct(productId);
      setReviews(data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setError('Failed to load reviews. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (newValue) => {
    setNewReview(prev => ({
      ...prev,
      rating: newValue
    }));
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to submit a review');
      return;
    }

    if (!newReview.title.trim() || !newReview.review.trim()) {
      toast.error('Please provide both a title and review');
      return;
    }

    try {
      setSubmitting(true);
      
      // Ensure the review data is properly formatted for the API
      const reviewData = {
        productId: productId, // Make sure productId is properly passed
        rating: newReview.rating,
        title: newReview.title,
        review: newReview.review
      };
      
      // Use the reviewsAPI.create method with the correct format
      await reviewsAPI.create(productId, {
        rating: newReview.rating,
        title: newReview.title,
        review: newReview.review
      });
      
      setOpenDialog(false);
      setNewReview({ 
        rating: 5, 
        title: '', 
        review: '' 
      });
      
      toast.success('Review submitted successfully!');
      
      // Fetch updated reviews
      fetchReviews();
    } catch (error) {
      console.error('Failed to submit review:', error);
      
      // Handle unauthorized errors specifically
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        // Optionally redirect to login
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReview = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to like reviews');
      return;
    }

    try {
      await reviewsAPI.likeReview(reviewId);
      fetchReviews(); // Refresh reviews to update like status
    } catch (error) {
      console.error('Failed to like review:', error);
      toast.error('Failed to like review');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  const ratingVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2, rotate: 3, transition: { duration: 0.2 } },
    tap: { scale: 0.9, rotate: -3, transition: { duration: 0.1 } }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 6 }} component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <Divider sx={{ mb: 4 }} />
      
      <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
        Customer Reviews
      </Typography>

      {/* Review Summary Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        component={motion.div}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', color: '#4a90e2' }}>
                {averageRating.toFixed(1)}
              </Typography>
              <Box sx={{ my: 1, display: 'flex', justifyContent: 'center' }}>
                <Rating 
                  value={averageRating} 
                  precision={0.5} 
                  readOnly 
                  size="large"
                  sx={{ 
                    '& .MuiRating-iconFilled': {
                      color: '#4a90e2',
                    }
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ pl: { md: 4 } }}>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Box 
                  key={rating} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1 
                  }}
                  component={motion.div}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + (5-rating)*0.1 }}
                >
                  <Typography variant="body2" sx={{ minWidth: 30 }}>
                    {rating}
                  </Typography>
                  <Rating value={1} max={1} readOnly size="small" sx={{ mx: 1 }} />
                  <Box
                    sx={{
                      flexGrow: 1,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      height: 8,
                      mr: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${reviews.length > 0 ? (ratingCounts[rating - 1] / reviews.length) * 100 : 0}%` 
                      }}
                      transition={{ duration: 0.8, delay: 0.4 + (5-rating)*0.1 }}
                      style={{
                        height: '100%',
                        backgroundColor: '#4a90e2',
                        borderRadius: 4
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>
                    {ratingCounts[rating - 1]}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
        
        {isAuthenticated && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => setOpenDialog(true)}
              sx={{ 
                px: 4, 
                borderRadius: 8,
                background: 'linear-gradient(45deg, #4a90e2, #357abd)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 8px 15px rgba(0,0,0,0.2)'
                }
              }}
              component={motion.button}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              Write a Review
            </Button>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Box 
          sx={{ 
            textAlign: 'center', 
            py: 6,
            opacity: 0.7 
          }}
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.3 }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No reviews yet
          </Typography>
          <Typography color="text.secondary">
            Be the first to share your experience with this product.
          </Typography>
        </Box>
      ) : (
        <Box ref={reviewListRef}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Stack spacing={3}>
              {reviews.map((review, index) => (
                <motion.div 
                  key={review._id} 
                  variants={itemVariants}
                  custom={index}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      backdropFilter: 'blur(4px)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar 
                        src={review.user?.profileImage} 
                        alt={review.user?.name || 'User'}
                        sx={{ 
                          width: 50, 
                          height: 50,
                          mr: 2,
                          bgcolor: '#4a90e2'
                        }}
                      >
                        {review.user?.name?.charAt(0) || 'U'}
                      </Avatar>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {review.user?.name || 'Anonymous User'}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {review.verified && (
                              <Chip 
                                label="Verified Purchase" 
                                size="small" 
                                color="primary" 
                                sx={{ mr: 1, bgcolor: 'rgba(74, 144, 226, 0.1)', color: '#4a90e2' }}
                              />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(review.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                          <Rating 
                            value={review.rating} 
                            readOnly 
                            size="small"
                            sx={{ 
                              '& .MuiRating-iconFilled': {
                                color: '#4a90e2',
                              }
                            }}
                          />
                        </Box>
                        
                        {review.title && (
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 'bold',
                              mb: 1 
                            }}
                          >
                            {review.title}
                          </Typography>
                        )}
                        
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                          {review.review}
                        </Typography>
                        
                        {/* Review Actions */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                          <Tooltip title="Like this review">
                            <IconButton 
                              size="small" 
                              onClick={() => handleLikeReview(review._id)}
                              sx={{ color: review.likes?.includes(user?._id) ? 'error.main' : 'text.secondary' }}
                              component={motion.button}
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {review.likes?.includes(user?._id) ? (
                                <Favorite fontSize="small" />
                              ) : (
                                <FavoriteBorder fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          
                          {review.likes?.length > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mr: 3 }}>
                              {review.likes.length} {review.likes.length === 1 ? 'like' : 'likes'}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Review Replies */}
                    {review.replies && review.replies.length > 0 && (
                      <Box sx={{ ml: 7, mt: 2 }}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                          Replies:
                        </Typography>
                        
                        <Stack spacing={2}>
                          {review.replies.map((reply, idx) => (
                            <Box 
                              key={idx} 
                              sx={{ 
                                p: 2, 
                                borderRadius: 1, 
                                bgcolor: 'rgba(0, 0, 0, 0.2)',
                                borderLeft: '3px solid #4a90e2'
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="subtitle2">
                                  {reply.user?.name || 'Store Admin'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(reply.createdAt)}
                                </Typography>
                              </Box>
                              <Typography variant="body2">
                                {reply.comment}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        </Box>
      )}

      {/* Review Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={motion.div}
        PaperComponent={motion.div}
        PaperProps={{
          initial: { y: 50, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { type: "spring", stiffness: 300, damping: 30 }
        }}
      >
        <DialogTitle>
          <Typography variant="h5">Write a Review</Typography>
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ py: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
              How would you rate this product?
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              position: 'relative'
            }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <motion.div
                  key={value}
                  variants={ratingVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  style={{ display: 'inline-flex' }}
                >
                  <IconButton
                    onClick={() => handleRatingChange(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(-1)}
                    sx={{
                      color: (hoverRating !== -1 ? value <= hoverRating : value <= newReview.rating) 
                        ? '#FFD700' 
                        : 'rgba(255, 255, 255, 0.3)',
                      padding: '8px',
                      transition: 'color 0.2s',
                    }}
                  >
                    <Star fontSize="large" />
                  </IconButton>
                </motion.div>
              ))}
              
              <Typography 
                variant="body1" 
                sx={{ 
                  ml: 2,
                  color: 'text.secondary',
                  minWidth: 100
                }}
              >
                {newReview.rating === 1 && 'Poor'}
                {newReview.rating === 2 && 'Fair'}
                {newReview.rating === 3 && 'Good'}
                {newReview.rating === 4 && 'Very Good'}
                {newReview.rating === 5 && 'Excellent'}
              </Typography>
            </Box>
            
            <TextField
              margin="dense"
              label="Review Title"
              fullWidth
              name="title"
              value={newReview.title}
              onChange={handleReviewChange}
              sx={{ mb: 3 }}
              InputLabelProps={{
                sx: { color: 'rgba(255, 255, 255, 0.7)' }
              }}
            />
            
            <TextField
              label="Your Review"
              fullWidth
              multiline
              rows={5}
              name="review"
              value={newReview.review}
              onChange={handleReviewChange}
              placeholder="Share your experience with this product..."
              InputLabelProps={{
                sx: { color: 'rgba(255, 255, 255, 0.7)' }
              }}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            onClick={handleSubmitReview}
            disabled={submitting || !newReview.title.trim() || !newReview.review.trim()}
            component={motion.button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            sx={{
              background: 'linear-gradient(45deg, #4a90e2, #357abd)',
              px: 3
            }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Submit Review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewSection; 