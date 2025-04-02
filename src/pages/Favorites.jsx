import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Lottie from 'lottie-react';
import noDataAnimation from '/public/lottie/no data.json';
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
  Alert
} from '@mui/material';
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, pt: '200px', display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, pt: '200px' }}>
        <Box textAlign="center" py={8}>
          <Typography variant="h5" gutterBottom>
            Please log in to view your favorites
          </Typography>
          <Button 
            component={Link} 
            to="/login" 
            variant="contained" 
            sx={{ mt: 2, bgcolor: '#333', '&:hover': { bgcolor: '#444' } }}
          >
            Log In
          </Button>
        </Box>
      </Container>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, pt: '200px' }}>
        <Box textAlign="center" py={8}>
          <Box sx={{ width: '250px', height: '250px', mx: 'auto', mb: 2 }}>
            <Lottie 
              animationData={noDataAnimation} 
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
          <Typography variant="h5" gutterBottom>
            Your wishlist is empty
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Save items you like by clicking the heart icon on products.
          </Typography>
          <Button 
            component={Link} 
            to="/products" 
            variant="contained" 
            sx={{ bgcolor: '#333', '&:hover': { bgcolor: '#444' } }}
          >
            Browse Products
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8, pt: '200px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Wishlist
        </Typography>
        <Button 
          startIcon={<DeleteIcon />} 
          onClick={handleRemoveAll}
          color="error"
          variant="outlined"
        >
          Remove All
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

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
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
                      bgcolor: '#f5f5f5',
                      color: '#999'
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <ImageNotSupportedIcon sx={{ fontSize: 40 }} />
                      <Typography variant="body2">No image available</Typography>
                    </Box>
                  </Box>
                )}
                
                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <IconButton 
                    onClick={() => handleRemoveFromFavorites(product._id)}
                    sx={{ color: 'error.main', bgcolor: 'rgba(255,255,255,0.8)' }}
                  >
                    <FavoriteIcon />
                  </IconButton>
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component={Link} to={`/product/${product._id}`} 
                    sx={{ textDecoration: 'none', color: 'inherit' }}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {product.category}
                  </Typography>
                  <Typography variant="h6" color="primary" gutterBottom>
                    ${product.price?.toFixed(2) || "0.00"}
                  </Typography>
                  <Box 
                    sx={{ 
                      mt: 1, 
                      color: product.inStock ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}
                  >
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </Box>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={addingToCart === product._id ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock || addingToCart === product._id}
                    sx={{ 
                      bgcolor: '#333', 
                      '&:hover': { bgcolor: '#444' },
                      '&.Mui-disabled': { bgcolor: '#888', color: 'white' }
                    }}
                  >
                    {addingToCart === product._id ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      
      <Box mt={6} textAlign="center">
        <Button 
          component={Link} 
          to="/products" 
          variant="outlined" 
          sx={{ minWidth: 200 }}
        >
          Continue Shopping
        </Button>
      </Box>
    </Container>
  );
};

export default Favorites; 