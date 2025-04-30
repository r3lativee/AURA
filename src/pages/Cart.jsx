import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import noDataAnimation from '/public/lottie/no data.json';
import loadingAnimation from '/public/lottie/loading.json';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  CircularProgress,
  Divider,
  Paper,
} from '@mui/material';
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Format thumbnail URL to handle relative paths
  const formatThumbnailUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/120';
    
    // If it's already an absolute URL, return as is
    if (url.startsWith('http')) return url;
    
    // Add API URL prefix for relative paths
    if (url.startsWith('/') && import.meta.env.VITE_API_URL) {
      const baseUrl = import.meta.env.VITE_API_URL.endsWith('/') 
        ? import.meta.env.VITE_API_URL.slice(0, -1) 
        : import.meta.env.VITE_API_URL;
      return `${baseUrl}${url}`;
    }
    
    return url;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to view your cart');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleQuantityChange = async (itemId, quantity, currentQuantity) => {
    try {
      const newQuantity = currentQuantity + quantity;
      if (newQuantity < 1) return;
      
      await updateCartItem(itemId, newQuantity);
    } catch (error) {
      toast.error('Error updating quantity');
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await removeFromCart(itemId);
    } catch (error) {
      toast.error('Error removing item');
      console.error('Error removing item:', error);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (error) {
      toast.error('Error clearing cart');
      console.error('Error clearing cart:', error);
    }
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/checkout');
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

  const cartItemVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 } 
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          pt: '160px'
        }}
      >
        <Lottie 
          animationData={loadingAnimation} 
          loop={true}
          style={{ width: '150px', height: '150px' }}
        />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8, pt: '160px', minHeight: '100vh' }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            mb: 4, 
            fontWeight: 400, 
            fontSize: { xs: '1.8rem', sm: '2.2rem' },
            letterSpacing: '-0.5px'
          }}
        >
          Shopping Cart
        </Typography>

        {cart.items && cart.items.length > 0 ? (
          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Paper 
                sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  backgroundColor: '#050505', 
                  borderRadius: '20px', 
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {cart.items.map((item) => (
                    <motion.div key={item._id} variants={cartItemVariant}>
                      <Card 
                        sx={{ 
                          display: 'flex', 
                          mb: 2, 
                          backgroundColor: 'rgba(255, 255, 255, 0.02)', 
                          borderRadius: '20px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          overflow: 'hidden'
                        }}
                      >
                        <CardMedia
                          component="img"
                          sx={{ width: 120, height: 120, objectFit: 'cover' }}
                          image={formatThumbnailUrl(item.product?.thumbnailUrl)}
                          alt={item.product?.name || 'Product image'}
                        />
                        <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column', p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 400, fontSize: '1.1rem' }}>
                                {item.product?.name || 'Product'}
                              </Typography>
                              {item.size && (
                                <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300 }}>
                                  Size: {item.size}
                                </Typography>
                              )}
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300 }}>
                                Price: ${item.price?.toFixed(2) || '0.00'}
                              </Typography>
                            </Box>
                            <IconButton 
                              onClick={() => handleRemoveItem(item._id)}
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              <FiTrash2 size={18} />
                            </IconButton>
                          </Box>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mt: 'auto',
                              pt: 2
                            }}
                          >
                            <IconButton 
                              size="small" 
                              onClick={() => handleQuantityChange(item._id, -1, item.quantity)}
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                p: 0.8
                              }}
                            >
                              <FiMinus size={14} />
                            </IconButton>
                            <Typography sx={{ mx: 2, color: '#fff', fontWeight: 300 }}>
                              {item.quantity}
                            </Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => handleQuantityChange(item._id, 1, item.quantity)}
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '20px',
                                p: 0.8
                              }}
                            >
                              <FiPlus size={14} />
                            </IconButton>
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
                <Button 
                  variant="outlined" 
                  startIcon={<FiTrash2 />}
                  onClick={handleClearCart}
                  sx={{ 
                    mt: 2,
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
                  Clear Cart
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  backgroundColor: '#050505', 
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 400, fontSize: '1.1rem' }}>
                  Order Summary
                </Typography>
                <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300 }}>Subtotal:</Typography>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 300 }}>
                    ${cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300 }}>Shipping:</Typography>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 300 }}>$0.00</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300 }}>Tax:</Typography>
                  <Typography variant="body1" sx={{ color: '#fff', fontWeight: 300 }}>Calculated at checkout</Typography>
                </Box>
                <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 400 }}>Total:</Typography>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 400 }}>
                    ${cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </Typography>
                </Box>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={handleCheckout}
                  sx={{ 
                    py: 1.5, 
                    backgroundColor: '#fff',
                    color: '#000',
                    fontWeight: 400,
                    textTransform: 'none',
                    borderRadius: '20px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    } 
                  }}
                >
                  Proceed to Checkout
                </Button>
                <Button 
                  component={Link} 
                  to="/products" 
                  variant="outlined" 
                  fullWidth
                  sx={{ 
                    mt: 2,
                    py: 1.5, 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 400,
                    textTransform: 'none',
                    borderRadius: '20px',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)'
                    } 
                  }}
                >
                  Continue Shopping
                </Button>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box textAlign="center" py={8}>
            <Box sx={{ width: '250px', height: '250px', mx: 'auto', mb: 4 }}>
              <Lottie 
                animationData={noDataAnimation} 
                loop={true}
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ color: '#fff', fontWeight: 400, mb: 2 }}>
              Your cart is empty
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 300, mb: 4, maxWidth: '500px', mx: 'auto' }}>
              Looks like you haven't added anything to your cart yet.
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
        )}
      </motion.div>
    </Container>
  );
};

export default Cart; 