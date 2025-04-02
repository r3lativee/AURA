import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import noDataAnimation from '/public/lottie/no data.json';
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

const Cart = () => {
  const navigate = useNavigate();
  const { cart, loading, updateCartItem, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

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

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8, pt: '200px' }}>
      <Typography variant="h4" gutterBottom component="h1" sx={{ mb: 4 }}>
        Your Cart
      </Typography>

      {cart.items && cart.items.length > 0 ? (
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#111', borderColor: '#333' }}>
              {cart.items.map((item) => (
                <Card 
                  key={item._id} 
                  sx={{ 
                    display: 'flex', 
                    mb: 2, 
                    backgroundColor: '#1a1a1a', 
                    borderRadius: 2,
                    border: '1px solid #333' 
                  }}
                >
                  <CardMedia
                    component="img"
                    sx={{ width: 120, height: 120, objectFit: 'cover' }}
                    image={item.product?.image || 'https://via.placeholder.com/120'}
                    alt={item.product?.name || 'Product image'}
                  />
                  <CardContent sx={{ flex: '1 0 auto', display: 'flex', flexDirection: 'column', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="h6" component="div" sx={{ color: 'white' }}>
                          {item.product?.name || 'Product'}
                        </Typography>
                        {item.size && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Size: {item.size}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          Price: ${item.price?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      <IconButton 
                        onClick={() => handleRemoveItem(item._id)}
                        sx={{ color: '#ff3b30' }}
                      >
                        <FiTrash2 />
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
                        sx={{ color: 'white' }}
                      >
                        <FiMinus />
                      </IconButton>
                      <Typography sx={{ mx: 2, color: 'white' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleQuantityChange(item._id, 1, item.quantity)}
                        sx={{ color: 'white' }}
                      >
                        <FiPlus />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              <Button 
                variant="outlined" 
                startIcon={<FiTrash2 />}
                onClick={handleClearCart}
                sx={{ 
                  mt: 2,
                  color: 'rgba(255, 255, 255, 0.8)',
                  borderColor: '#333',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                Clear Cart
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, backgroundColor: '#111', borderColor: '#333' }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Order Summary
              </Typography>
              <Divider sx={{ my: 2, backgroundColor: '#333' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: '#ccc' }}>Subtotal:</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>
                  ${cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: '#ccc' }}>Shipping:</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>$0.00</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1" sx={{ color: '#ccc' }}>Tax:</Typography>
                <Typography variant="body1" sx={{ color: 'white' }}>Calculated at checkout</Typography>
              </Box>
              <Divider sx={{ my: 2, backgroundColor: '#333' }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>Total:</Typography>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  ${cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleCheckout}
                sx={{ 
                  py: 1.5, 
                  backgroundColor: '#333333',
                  color: '#FFFFFF',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#444444',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  } 
                }}
              >
                Proceed to Checkout
              </Button>
              <Button 
                component={Link} 
                to="/products" 
                variant="contained" 
                fullWidth
                sx={{ 
                  mt: 2,
                  py: 1.5, 
                  backgroundColor: '#333333',
                  color: '#FFFFFF',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: '#444444',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                  } 
                }}
              >
                Continue Shopping
              </Button>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center',
            backgroundColor: '#111',
            borderRadius: 2,
            p: 4,
            border: '1px solid #333'
          }}
        >
          <Box sx={{ width: '250px', height: '250px', mx: 'auto', mb: 2 }}>
            <Lottie 
              animationData={noDataAnimation} 
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
          <Typography variant="h5" sx={{ mb: 3, color: 'white' }}>
            Your cart is empty
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: '#ccc' }}>
            Looks like you haven't added any products to your cart yet.
          </Typography>
          <Button 
            component={Link} 
            to="/products" 
            variant="contained" 
            sx={{ 
              py: 1.5, 
              px: 4,
              backgroundColor: '#333333',
              color: '#FFFFFF',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#444444',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
              } 
            }}
          >
            Start Shopping
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default Cart; 