import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Rating,
  Avatar,
  TextField,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Stack,
  Alert,
  IconButton,
  Tooltip,
  ButtonGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { reviewsAPI, productsAPI } from '../services/api';

// Separate error boundary component to catch model loading errors
function ModelErrorBoundary({children}) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>
    );
  }
  
  return (
    <React.Suspense fallback={null}>
      {React.cloneElement(children, {
        onError: () => setHasError(true)
      })}
    </React.Suspense>
  );
}

// Fixed Model component without state in render function
function Model({ url, onError }) {
  // Use default model if no URL is provided
  const modelUrl = url || '/server/uploads/models/ftm.glb';
  
  try {
    // Using useGLTF hook outside of render path
    const { scene } = useGLTF(modelUrl);
    return <primitive object={scene} />;
  } catch (err) {
    console.error("Error loading model:", err);
    if (onError) onError();
    
    // Return an empty group if there's an error
    return <group />;
  }
}

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    review: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [adding, setAdding] = useState(false);
  
  const { currentUser, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  
  const modelRef = useRef();
  const [modelLoadFailed, setModelLoadFailed] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data } = await productsAPI.getOne(id);
        
        setProduct(data);
        if (data.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0].name);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setReviewsLoading(true);
        const { data } = await reviewsAPI.getByProduct(id);
        setReviews(data);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    if (id) {
      fetchReviews();
    }
  }, [id]);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (event, newValue) => {
    setNewReview(prev => ({
      ...prev,
      rating: newValue
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please log in to submit a review');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      // Use the reviewsAPI with the correct parameter format
      await reviewsAPI.create(id, {
        rating: newReview.rating,
        title: newReview.title,
        review: newReview.review
      });
      
      // Refresh reviews using the API
      const { data } = await reviewsAPI.getByProduct(id);
      setReviews(data);
      
      // Reset form
      setNewReview({
        rating: 5,
        title: '',
        review: ''
      });
      
      setSuccess('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      setError('Please log in to add items to your cart');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id, quantity, selectedSize);
      setSuccess('Product added to cart successfully!');
      
      // Clear any previous error
      setError('');
    } catch (err) {
      setError('Failed to add product to cart. Please try again.');
      console.error('Add to cart error:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      setError('Please log in to manage favorites');
      return;
    }

    try {
      if (isFavorite(product._id)) {
        await removeFromFavorites(product._id);
      } else {
        await addToFavorites(product._id);
      }
      // Clear any previous error
      setError('');
    } catch (err) {
      console.error('Favorite toggle error:', err);
    }
  };

  const handleQuantityChange = (event) => {
    setQuantity(Math.max(1, parseInt(event.target.value) || 1));
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, pt: '200px', display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!product) {
    return (
      <Container sx={{ py: 8, pt: '200px' }}>
        <Typography>Product not found</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8, pt: '200px' }}>
      <Grid container spacing={4}>
        {/* 3D Model Viewer */}
        <Grid item xs={12} md={8}>
          <Paper
            style={{
              height: 500,
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {modelLoadFailed ? (
              <Box 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 3,
                  textAlign: 'center'
                }}
              >
                <Typography color="error" variant="h6" gutterBottom>
                  Unable to load 3D model
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We're having trouble loading the 3D model for this product. Please try again later.
                </Typography>
              </Box>
            ) : (
              <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} />
                <Suspense fallback={null}>
                  <ModelErrorBoundary>
                    <Model 
                      url={product?.modelUrl}
                      onError={() => setModelLoadFailed(true)} 
                    />
                  </ModelErrorBoundary>
                </Suspense>
                <OrbitControls />
              </Canvas>
            )}
          </Paper>
          <Typography variant="caption" display="block" textAlign="center" style={{ marginTop: 8 }}>
            {!modelLoadFailed && "Click and drag to rotate. Scroll to zoom."}
          </Typography>
        </Grid>

        {/* Product Information */}
        <Grid item xs={12} md={4}>
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h4" component="h1" gutterBottom>
                {product.name}
              </Typography>
              <Tooltip title={isFavorite(product._id) ? "Remove from favorites" : "Add to favorites"}>
                <IconButton 
                  onClick={handleFavoriteToggle}
                  color={isFavorite(product._id) ? "error" : "default"}
                  sx={{ ml: 1 }}
                >
                  {isFavorite(product._id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box display="flex" alignItems="center" mb={1}>
              <Rating value={product.ratings?.average || 0} precision={0.5} readOnly />
              <Typography variant="body2" color="text.secondary" ml={1}>
                {product.ratings?.average?.toFixed(1) || "0.0"} ({product.ratings?.count || 0} reviews)
              </Typography>
            </Box>
            <Typography variant="h5" color="primary" gutterBottom>
              ${product.price}
            </Typography>
            <Typography variant="body1" paragraph>
              {product.description}
            </Typography>

            <Typography variant="h6" gutterBottom>
              Category
            </Typography>
            <Typography variant="body1" paragraph>
              {product.category}
            </Typography>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Size
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel id="size-select-label">Select Size</InputLabel>
                  <Select
                    labelId="size-select-label"
                    id="size-select"
                    value={selectedSize}
                    label="Select Size"
                    onChange={(e) => setSelectedSize(e.target.value)}
                  >
                    {product.sizes.map((size) => (
                      <MenuItem 
                        key={size.name} 
                        value={size.name}
                        disabled={!size.inStock}
                      >
                        {size.name} {!size.inStock && " (Out of Stock)"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <Typography variant="h6" gutterBottom>
              Ingredients
            </Typography>
            <List dense>
              {product.ingredients && product.ingredients.map((ingredient, index) => (
                <ListItem key={index}>
                  <ListItemText primary={ingredient} />
                </ListItem>
              ))}
            </List>

            {/* Quantity and Add to Cart */}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            
            <Box mt={3} display="flex" alignItems="center">
              <Typography variant="body1" mr={2}>
                Quantity:
              </Typography>
              <ButtonGroup variant="outlined" size="small">
                <Button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Button disableRipple sx={{ cursor: 'default', '&:hover': { bgcolor: 'transparent' } }}>
                  {quantity}
                </Button>
                <Button 
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={product.stockQuantity && quantity >= product.stockQuantity}
                >
                  +
                </Button>
              </ButtonGroup>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<ShoppingCartIcon />}
              style={{ 
                marginTop: 20,
                backgroundColor: '#333333',
                color: '#FFFFFF',
                fontWeight: 500,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease'
              }}
              onClick={handleAddToCart}
              disabled={adding || !product.inStock || (product.stockQuantity && product.stockQuantity < 1)}
              sx={{
                '&:hover': {
                  backgroundColor: '#444444',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                }
              }}
            >
              {adding ? <CircularProgress size={24} color="inherit" /> : 'Add to Cart'}
            </Button>

            {!product.inStock && (
              <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                This product is currently out of stock
              </Typography>
            )}
          </Box>
        </Grid>
        
        {/* Reviews Section */}
        <Grid item xs={12} sx={{ mt: 6 }}>
          <Divider sx={{ my: 4 }} />
          <Typography variant="h4" component="h2" gutterBottom>
            Customer Reviews
          </Typography>
          
          {/* Review Summary */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Box sx={{ mr: 4 }}>
              <Typography variant="h2" component="span" sx={{ fontWeight: 'bold' }}>
                {product.ratings?.average?.toFixed(1) || "0.0"}
              </Typography>
              <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                / 5
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Rating value={product.ratings?.average || 0} precision={0.5} readOnly size="large" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Based on {product.ratings?.count || 0} reviews
              </Typography>
            </Box>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 4 }} />
            
            {/* Add Review Form */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" gutterBottom>
                Write a Review
              </Typography>
              
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
              
              <form onSubmit={handleSubmitReview}>
                <Box sx={{ mb: 2 }}>
                  <Typography component="legend">Your Rating</Typography>
                  <Rating
                    name="rating"
                    value={newReview.rating}
                    onChange={handleRatingChange}
                    size="large"
                  />
                </Box>
                
                <TextField
                  fullWidth
                  margin="normal"
                  label="Review Title"
                  name="title"
                  value={newReview.title}
                  onChange={handleReviewChange}
                  required
                  disabled={submitting || !isAuthenticated}
                />
                
                <TextField
                  fullWidth
                  margin="normal"
                  label="Your Review"
                  name="review"
                  value={newReview.review}
                  onChange={handleReviewChange}
                  multiline
                  rows={4}
                  required
                  disabled={submitting || !isAuthenticated}
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ 
                    mt: 2,
                    backgroundColor: '#333333',
                    '&:hover': {
                      backgroundColor: '#444444',
                    }
                  }}
                  disabled={submitting || !isAuthenticated}
                >
                  {submitting ? <CircularProgress size={24} /> : 'Submit Review'}
                </Button>
                
                {!isAuthenticated && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please log in to submit a review
                  </Typography>
                )}
              </form>
            </Box>
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          {/* Reviews List */}
          {reviewsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : reviews.length > 0 ? (
            <Stack spacing={3}>
              {reviews.map((review) => (
                <Card key={review._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      <Avatar 
                        src={review.user.profileImage} 
                        alt={review.user.name}
                        sx={{ mr: 2 }}
                      />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {review.user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      
                      {review.verified && (
                        <Chip 
                          label="Verified Purchase" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 'auto' }}
                        />
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Rating value={review.rating} readOnly />
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        {review.title}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1">
                      {review.review}
                    </Typography>
                    
                    {review.images && review.images.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                        {review.images.map((image, index) => (
                          <Box 
                            key={index}
                            component="img"
                            src={image}
                            alt={`Review image ${index + 1}`}
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    {review.replies && review.replies.length > 0 && (
                      <Box sx={{ mt: 2, ml: 5 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Replies:
                        </Typography>
                        {review.replies.map((reply, index) => (
                          <Box key={index} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #eee' }}>
                            <Typography variant="subtitle2">
                              {reply.user.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {new Date(reply.createdAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2">
                              {reply.comment}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No reviews yet. Be the first to review this product!
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

// Preload the default model
try {
  useGLTF.preload('/server/uploads/models/ftm.glb');
} catch (err) {
  console.error("Failed to preload default model:", err);
}

export default ProductDetail; 