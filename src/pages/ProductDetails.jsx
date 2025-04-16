import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Rating,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ImageList,
  ImageListItem,
} from '@mui/material';
import {
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ReviewSection from '../components/ReviewSection';
import { motion } from 'framer-motion';
import '../styles/pages/Products.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await productsAPI.getById(id);
      setProduct(data);
      if (data.sizes && data.sizes.length > 0) {
        setSelectedSize(data.sizes[0]);
      }
      if (data.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0]);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load product details',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    const item = {
      productId: product._id,
      quantity,
      size: selectedSize,
      color: selectedColor,
    };

    addToCart(item);
    setSnackbar({
      open: true,
      message: 'Product added to cart',
      severity: 'success',
    });
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/product/${id}` } });
      return;
    }

    try {
      await productsAPI.toggleWishlist(id);
      fetchProduct(); // Refresh product data to update wishlist status
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update wishlist',
        severity: 'error',
      });
    }
  };

  const handleShare = () => {
    navigator.share({
      title: product.name,
      text: product.description,
      url: window.location.href,
    }).catch((error) => console.log('Error sharing', error));
  };

  const handleQuantityChange = (delta) => {
    setQuantity(Math.max(1, Math.min(10, quantity + delta)));
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container>
        <Typography>Product not found</Typography>
      </Container>
    );
  }

  const discountedPrice = product.discount
    ? product.price * (1 - product.discount / 100)
    : product.price;

  return (
    <Container maxWidth="lg" sx={{ py: 8, pt: '200px' }}>
      <Grid container spacing={4}>
        {/* Product Images */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <ImageList sx={{ width: 100 }} cols={1} rowHeight={100}>
              {product.images.map((image, index) => (
                <ImageListItem
                  key={index}
                  sx={{
                    cursor: 'pointer',
                    border: mainImage === index ? '2px solid primary.main' : 'none',
                    borderRadius: '15px',
                    overflow: 'hidden',
                  }}
                  onClick={() => setMainImage(index)}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${index + 1}`}
                    loading="lazy"
                    style={{ objectFit: 'cover' }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
            <Box
              sx={{
                flex: 1,
                position: 'relative',
                height: 600,
                backgroundColor: 'grey.100',
                borderRadius: '15px',
                overflow: 'hidden',
              }}
            >
              <img
                src={product.images[mainImage]}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          </Box>
        </Grid>

        {/* Product Info */}
        <Grid item xs={12} md={5}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {product.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Rating value={product.rating} readOnly precision={0.5} />
                  <Typography variant="body2" color="text.secondary">
                    ({product.numReviews} reviews)
                  </Typography>
                </Box>
              </Box>
              <Box>
                <IconButton 
                  onClick={handleToggleWishlist} 
                  color="primary"
                  sx={{ 
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.1)'
                  }}
                >
                  {product.isInWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <IconButton 
                  onClick={handleShare} 
                  color="primary"
                  sx={{ 
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.1)'
                  }}
                >
                  <ShareIcon />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" color="primary" gutterBottom>
                ${discountedPrice.toFixed(2)}
                {product.discount > 0 && (
                  <>
                    <Typography
                      component="span"
                      sx={{
                        textDecoration: 'line-through',
                        color: 'text.secondary',
                        ml: 2,
                      }}
                    >
                      ${product.price.toFixed(2)}
                    </Typography>
                    <Chip
                      label={`${product.discount}% OFF`}
                      color="error"
                      size="small"
                      sx={{ ml: 1, borderRadius: '50px' }}
                    />
                  </>
                )}
              </Typography>
            </Box>

            <Typography variant="body1" paragraph>
              {product.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Size
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {product.sizes.map((size) => (
                    <Box
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                    >
                      {size}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {product.colors.map((color) => (
                    <Box
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`size-option ${selectedColor === color ? 'selected' : ''}`}
                    >
                      {color}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Quantity Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Quantity
              </Typography>
              <div className="quantity-selector">
                <button 
                  className="quantity-button"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <RemoveIcon fontSize="small" />
                </button>
                <div className="quantity-display">{quantity}</div>
                <button 
                  className="quantity-button"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                >
                  <AddIcon fontSize="small" />
                </button>
              </div>
            </Box>

            {/* Add to Cart Button */}
            <motion.button
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </motion.button>

            {/* Additional Info */}
            <Paper sx={{ mt: 3, p: 2, borderRadius: '15px' }}>
              <Typography variant="subtitle2" gutterBottom>
                Product Details:
              </Typography>
              <Typography variant="body2" paragraph>
                • Category: {product.category}
                {product.brand && <><br />• Brand: {product.brand}</>}
                <br />• SKU: {product._id}
                <br />• Stock Status: {product.inStock ? 'In Stock' : 'Out of Stock'}
              </Typography>
            </Paper>
          </Box>
        </Grid>

        {/* Reviews Section */}
        <Grid item xs={12}>
          <ReviewSection productId={id} />
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ borderRadius: '15px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetails; 