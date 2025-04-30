import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import noDataAnimation from '/public/lottie/no data.json';
import loadingAnimation from '/public/lottie/loading.json';
import { 
  Container, 
  Grid, 
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  IconButton,
  Divider,
  Alert,
  Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Favorites = () => {
  const { favorites, loading, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [addingToCart, setAddingToCart] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageErrors, setImageErrors] = useState({});

  const handleRemoveFromFavorites = async (productId) => {
    try {
      await removeFromFavorites(productId);
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError('Failed to remove item from favorites');
    }
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      setError('Please log in to add items to your cart');
      return;
    }

    try {
      setAddingToCart(product._id);
      setError('');
      await addToCart(product._id, 1);
      setSuccess(`${product.name} added to cart!`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleRemoveAll = async () => {
    try {
      // Remove all favorites one by one
      const removePromises = favorites.map(fav => {
        const productId = fav._id || fav.product?._id;
        return removeFromFavorites(productId);
      });
      
      await Promise.all(removePromises);
      setSuccess('All items removed from favorites');
    } catch (err) {
      console.error('Error removing all favorites:', err);
      setError('Failed to remove all favorites');
    }
  };

  const handleImageError = (productId) => {
    setImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  // Helper function to get product image
  const getProductImage = (product) => {
    if (imageErrors[product._id]) {
      return null;
    }
    
    // Try to get image from different possible sources
    if (product.images && product.images.length > 0) {
      return product.images[0];
    }
    
    if (product.thumbnailUrl) {
      return product.thumbnailUrl;
    }
    
    if (product.image) {
      return product.image;
    }
    
    return null;
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 } 
    }
  };

  if (loading) {
    return (
      <Container sx={{ pt: '160px', pb: 8, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Lottie 
          animationData={loadingAnimation} 
          loop={true}
          style={{ width: '150px', height: '150px' }}
        />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, pt: '160px', minHeight: '100vh' }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Box textAlign="center" py={8}>
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{ 
                fontWeight: 400,
                fontSize: '1.5rem',
                mb: 2
              }}
            >
              Please log in to view your favorites
            </Typography>
            <Button 
              component={Link} 
              to="/login" 
              variant="contained" 
              sx={{ 
                mt: 2, 
                backgroundColor: '#fff',
                color: '#000',
                borderRadius: '20px',
                textTransform: 'none',
                padding: '10px 24px',
                fontWeight: 400,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }
              }}
            >
              Log In
            </Button>
          </Box>
        </motion.div>
      </Container>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, pt: '160px', minHeight: '100vh' }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <Box textAlign="center" py={8}>
            <Box sx={{ width: '250px', height: '250px', mx: 'auto', mb: 4 }}>
              <Lottie 
                animationData={noDataAnimation} 
                loop={true}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 400,
                fontSize: '1.5rem',
                mb: 2
              }}
            >
              Your wishlist is empty
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontWeight: 300, 
                mb: 4,
                maxWidth: '500px',
                mx: 'auto'
              }}
            >
              Save items you like by clicking the heart icon on products.
            </Typography>
            <Button 
              component={Link} 
              to="/products" 
              variant="contained" 
              sx={{ 
                backgroundColor: '#fff',
                color: '#000',
                borderRadius: '20px',
                textTransform: 'none',
                padding: '10px 24px',
                fontWeight: 400,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }
              }}
            >
              Browse Products
            </Button>
          </Box>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8, pt: '160px', minHeight: '100vh' }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 400, 
              fontSize: { xs: '1.8rem', sm: '2.2rem' },
              letterSpacing: '-0.5px'
            }}
          >
            Wishlist
          </Typography>
          <Button 
            startIcon={<DeleteIcon />} 
            onClick={handleRemoveAll}
            variant="outlined"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 300,
              fontSize: '0.9rem',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.02)'
              }
            }}
          >
            Remove All
          </Button>
        </Box>
        
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              color: '#ef5350',
              '& .MuiAlert-icon': { color: '#ef5350' },
              border: '1px solid rgba(211, 47, 47, 0.2)',
              borderRadius: '20px'
            }}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              backgroundColor: 'rgba(46, 125, 50, 0.1)',
              color: '#9ccc65',
              '& .MuiAlert-icon': { color: '#9ccc65' },
              border: '1px solid rgba(46, 125, 50, 0.2)',
              borderRadius: '20px'
            }}
          >
            {success}
          </Alert>
        )}

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <Grid container spacing={3}>
            {favorites.map((item) => {
              // Get the product data, handling both direct product and referenced product
              const product = item.product || item;
              
              // Skip if product is invalid or missing key data
              if (!product || !product._id || !product.name) {
                console.warn("Skipping invalid product in favorites:", product);
                return null;
              }
              
              const productImage = getProductImage(product);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={product._id}>
                  <motion.div variants={itemVariant}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      position: 'relative',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      overflow: 'hidden'
                    }}>
                      {productImage ? (
                        <CardMedia
                          component="img"
                          height="200"
                          image={productImage}
                          alt={product.name}
                          sx={{ objectFit: 'cover' }}
                          onError={() => handleImageError(product._id)}
                        />
                      ) : (
                        <Box 
                          sx={{ 
                            height: 200, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            bgcolor: 'rgba(255, 255, 255, 0.02)',
                            color: 'rgba(255, 255, 255, 0.3)'
                          }}
                        >
                          <Box sx={{ textAlign: 'center' }}>
                            <ImageNotSupportedIcon sx={{ fontSize: 40 }} />
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontWeight: 300
                              }}
                            >
                              No image available
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <IconButton 
                          onClick={() => handleRemoveFromFavorites(product._id)}
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.8)', 
                            bgcolor: 'rgba(0, 0, 0, 0.2)',
                            backdropFilter: 'blur(4px)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.4)'
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Typography 
                          variant="h6" 
                          component={Link} 
                          to={`/product/${product._id}`} 
                          sx={{ 
                            textDecoration: 'none', 
                            color: '#fff',
                            fontWeight: 400,
                            fontSize: '1.1rem',
                            display: 'block',
                            mb: 1
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontWeight: 300,
                            mb: 2
                          }}
                        >
                          {product.category}
                        </Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#fff',
                            fontWeight: 400,
                            fontSize: '1.1rem'
                          }}
                        >
                          ${product.price?.toFixed(2) || "0.00"}
                        </Typography>
                      </CardContent>

                      <CardActions sx={{ p: 3, pt: 0 }}>
                        <Button 
                          variant="contained"
                          fullWidth
                          startIcon={<ShoppingCartIcon />}
                          onClick={() => handleAddToCart(product)}
                          disabled={addingToCart === product._id}
                          sx={{
                            backgroundColor: '#fff',
                            color: '#000',
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontWeight: 400,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.8)'
                            }
                          }}
                        >
                          {addingToCart === product._id ? (
                            <CircularProgress size={24} color="inherit" />
                          ) : (
                            'Add to Cart'
                          )}
                        </Button>
                      </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default Favorites; 