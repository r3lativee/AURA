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
} from '@mui/icons-material';
import { productsAPI } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import ReviewSection from '../components/ReviewSection';

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
                borderRadius: 1,
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
                <IconButton onClick={handleToggleWishlist} color="primary">
                  {product.isInWishlist ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <IconButton onClick={handleShare} color="primary">
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
                      sx={{ ml: 1 }}
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Size</InputLabel>
                <Select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  label="Size"
                >
                  {product.sizes.map((size) => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Color</InputLabel>
                <Select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  label="Color"
                >
                  {product.colors.map((color) => (
                    <MenuItem key={color} value={color}>
                      {color}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Quantity Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Quantity</InputLabel>
              <Select
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                label="Quantity"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Add to Cart Button */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>

            {/* Additional Info */}
            <Paper sx={{ mt: 3, p: 2 }}>
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductDetails; 