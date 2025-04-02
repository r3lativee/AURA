import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { ordersAPI, authAPI } from '../services/api';

const steps = ['Shipping address', 'Payment details', 'Review your order'];

const Checkout = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { cart, total, clearCart } = useCart();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to proceed with checkout');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Initialize shipping data with user's default address if available
  const [shippingData, setShippingData] = useState({
    fullName: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    useExistingAddress: true,
    selectedAddressIndex: 0,
    saveAddress: false,
  });
  
  // Populate form with user data when user object changes
  useEffect(() => {
    if (user) {
      // Find default address if exists
      const defaultAddressIndex = user.addresses && user.addresses.length > 0
        ? user.addresses.findIndex(addr => addr.isDefault)
        : -1;
      
      const addressIndex = defaultAddressIndex >= 0 ? defaultAddressIndex : 0;
      const selectedAddress = user.addresses && user.addresses.length > 0
        ? user.addresses[addressIndex]
        : null;
      
      setShippingData({
        fullName: user.name || '',
        phoneNumber: user.phoneNumber || '',
        street: selectedAddress?.street || '',
        city: selectedAddress?.city || '',
        state: selectedAddress?.state || '',
        pincode: selectedAddress?.pincode || '',
        country: selectedAddress?.country || 'India',
        useExistingAddress: !!(user.addresses && user.addresses.length > 0),
        selectedAddressIndex: addressIndex,
        saveAddress: false,
      });
    }
  }, [user]);

  const [paymentData, setPaymentData] = useState({
    cardName: '',
    cardNumber: '',
    expDate: '',
    cvv: '',
    saveCard: false,
  });

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddressChange = (e) => {
    const index = parseInt(e.target.value);
    if (user?.addresses && user.addresses[index]) {
      const selectedAddress = user.addresses[index];
      setShippingData({
        ...shippingData,
        selectedAddressIndex: index,
        street: selectedAddress.street || '',
        city: selectedAddress.city || '',
        state: selectedAddress.state || '',
        pincode: selectedAddress.pincode || '',
        country: selectedAddress.country || 'India',
      });
    }
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    
    // Validate fields
    if (!shippingData.useExistingAddress) {
      if (!shippingData.fullName || !shippingData.phoneNumber || !shippingData.street ||
          !shippingData.city || !shippingData.state || !shippingData.pincode) {
        toast.error('Please fill all required fields');
        return;
      }
      
      // Validate phone number
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(shippingData.phoneNumber.replace(/[^0-9]/g, ''))) {
        toast.error('Please enter a valid phone number');
        return;
      }
      
      // Validate pincode
      const pincodeRegex = /^\d{6}$/;
      if (!pincodeRegex.test(shippingData.pincode.replace(/[^0-9]/g, ''))) {
        toast.error('Please enter a valid 6-digit pincode');
        return;
      }
      
      // Save new address to profile if requested
      if (shippingData.saveAddress) {
        const addressData = {
          address: {
            street: shippingData.street,
            city: shippingData.city,
            state: shippingData.state,
            pincode: shippingData.pincode,
            country: shippingData.country,
            isDefault: user?.addresses?.length === 0 // Make default if first address
          }
        };
        
        updateProfile(addressData)
          .then(response => {
            toast.success('Address saved to your profile');
          })
          .catch(error => {
            console.error('Failed to save address:', error);
            toast.error('Failed to save address to profile');
          });
      }
    }
    
    handleNext();
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    
    // Validate payment fields
    if (!paymentData.cardName || !paymentData.cardNumber || !paymentData.expDate || !paymentData.cvv) {
      toast.error('Please fill all payment details');
      return;
    }
    
    // Validate card number
    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(paymentData.cardNumber.replace(/\s/g, ''))) {
      toast.error('Please enter a valid 16-digit card number');
      return;
    }
    
    // Validate expiry date
    const expDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expDateRegex.test(paymentData.expDate)) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return;
    }
    
    // Validate CVV
    const cvvRegex = /^\d{3,4}$/;
    if (!cvvRegex.test(paymentData.cvv)) {
      toast.error('Please enter a valid CVV');
      return;
    }
    
    handleNext();
  };

  const handleOrderSubmit = async () => {
    try {
      // Prepare shipping address from selected or entered data
      const shippingAddress = shippingData.useExistingAddress && user?.addresses?.length > 0
        ? user.addresses[shippingData.selectedAddressIndex]
        : {
            street: shippingData.street,
            city: shippingData.city,
            state: shippingData.state,
            pincode: shippingData.pincode,
            country: shippingData.country
          };
      
      // Create order object
      const orderData = {
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.selectedSize || null,
        })),
        shippingAddress,
        totalAmount: total,
        paymentMethod: 'Credit Card',
        paymentDetails: {
          cardName: paymentData.cardName,
          cardNumber: `**** **** **** ${paymentData.cardNumber.slice(-4)}`,
          expDate: paymentData.expDate
        }
      };
      
      // Make API call to create order
      const response = await ordersAPI.create(orderData);
      
      if (response.data && response.data.success) {
        toast.success('Order placed successfully!');
        clearCart();
        handleNext();
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    }
  };

  const ShippingForm = () => (
    <form onSubmit={handleShippingSubmit}>
      <Grid container spacing={3}>
        {user?.addresses && user.addresses.length > 0 && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={shippingData.useExistingAddress}
                  onChange={(e) => 
                    setShippingData({ 
                      ...shippingData, 
                      useExistingAddress: e.target.checked 
                    })
                  }
                  color="primary"
                />
              }
              label="Use saved address"
            />
            
            {shippingData.useExistingAddress && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Address</InputLabel>
                <Select
                  value={shippingData.selectedAddressIndex}
                  onChange={handleAddressChange}
                  label="Select Address"
                >
                  {user.addresses.map((address, index) => (
                    <MenuItem key={index} value={index}>
                      {address.street}, {address.city}, {address.state}, {address.pincode}
                      {address.isDefault ? ' (Default)' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>
        )}
        
        {(!shippingData.useExistingAddress || !user?.addresses || user.addresses.length === 0) && (
          <>
            <Grid item xs={12}>
              <TextField
                required
                id="fullName"
                name="fullName"
                label="Full Name"
                fullWidth
                value={shippingData.fullName}
                onChange={(e) => setShippingData({ ...shippingData, fullName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="phoneNumber"
                name="phoneNumber"
                label="Phone Number"
                fullWidth
                value={shippingData.phoneNumber}
                onChange={(e) => setShippingData({ ...shippingData, phoneNumber: e.target.value })}
                helperText="Required for delivery updates"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                id="street"
                name="street"
                label="Street Address"
                fullWidth
                multiline
                rows={2}
                value={shippingData.street}
                onChange={(e) => setShippingData({ ...shippingData, street: e.target.value })}
                helperText="House/Flat No., Street, Landmark"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="city"
                name="city"
                label="City"
                fullWidth
                value={shippingData.city}
                onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="state"
                name="state"
                label="State"
                fullWidth
                value={shippingData.state}
                onChange={(e) => setShippingData({ ...shippingData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="pincode"
                name="pincode"
                label="Pincode"
                fullWidth
                value={shippingData.pincode}
                onChange={(e) => setShippingData({ ...shippingData, pincode: e.target.value })}
                helperText="6-digit pincode"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="country"
                name="country"
                label="Country"
                fullWidth
                value={shippingData.country}
                onChange={(e) => setShippingData({ ...shippingData, country: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={shippingData.saveAddress}
                    onChange={(e) => setShippingData({ ...shippingData, saveAddress: e.target.checked })}
                  />
                }
                label="Save this address for future purchases"
              />
            </Grid>
          </>
        )}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button onClick={() => navigate('/cart')} sx={{ mr: 1 }}>
          Back to Cart
        </Button>
        <Button variant="contained" color="primary" type="submit">
          Next
        </Button>
      </Box>
    </form>
  );

  const PaymentForm = () => (
    <form onSubmit={handlePaymentSubmit}>
      <Typography variant="h6" gutterBottom>
        Payment method
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            required
            id="cardName"
            name="cardName"
            label="Name on card"
            fullWidth
            value={paymentData.cardName}
            onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            id="cardNumber"
            name="cardNumber"
            label="Card number"
            fullWidth
            value={paymentData.cardNumber}
            onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
            helperText="16-digit number without spaces"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="expDate"
            name="expDate"
            label="Expiry date"
            fullWidth
            value={paymentData.expDate}
            onChange={(e) => setPaymentData({ ...paymentData, expDate: e.target.value })}
            helperText="MM/YY"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            id="cvv"
            name="cvv"
            label="CVV"
            fullWidth
            value={paymentData.cvv}
            onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
            helperText="Last 3 or 4 digits on back of card"
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={paymentData.saveCard}
                onChange={(e) => setPaymentData({ ...paymentData, saveCard: e.target.checked })}
              />
            }
            label="Remember credit card details for next time"
          />
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={handleBack}>Back</Button>
        <Button variant="contained" color="primary" type="submit">
          Next
        </Button>
      </Box>
    </form>
  );

  const ReviewOrder = () => {
    const selectedAddress = shippingData.useExistingAddress && user?.addresses?.length > 0
      ? user.addresses[shippingData.selectedAddressIndex]
      : {
          street: shippingData.street,
          city: shippingData.city,
          state: shippingData.state,
          pincode: shippingData.pincode,
          country: shippingData.country
        };
        
    return (
      <>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Shipping Address
          </Typography>
          <Typography variant="body1">
            {shippingData.useExistingAddress ? user?.name : shippingData.fullName}
          </Typography>
          <Typography variant="body1">
            {selectedAddress.street}
          </Typography>
          <Typography variant="body1">
            {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
          </Typography>
          <Typography variant="body1">
            {selectedAddress.country}
          </Typography>
          <Typography variant="body1">
            Phone: {shippingData.useExistingAddress ? user?.phoneNumber : shippingData.phoneNumber}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold">
          Payment Details
        </Typography>
        <Typography variant="body1">
          Card Holder: {paymentData.cardName}
        </Typography>
        <Typography variant="body1">
          Card Number: **** **** **** {paymentData.cardNumber.slice(-4)}
        </Typography>
        <Typography variant="body1">
          Expiry Date: {paymentData.expDate}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold">
          Order Items
        </Typography>
        {cart.length === 0 ? (
          <Alert severity="warning">Your cart is empty!</Alert>
        ) : (
          <>
            {cart.map((item) => (
              <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography variant="body1">
                    {item.name} {item.selectedSize ? `(${item.selectedSize})` : ''}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {item.quantity}
                  </Typography>
                </Box>
                <Typography variant="body1">
                  ₹{item.price * item.quantity}
                </Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Total</Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                ₹{total}
              </Typography>
            </Box>
          </>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button onClick={handleBack}>Back</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOrderSubmit}
            disabled={cart.length === 0}
          >
            Place Order
          </Button>
        </Box>
      </>
    );
  };

  const OrderConfirmation = () => (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <Typography variant="h5" gutterBottom>
        Thank you for your order!
      </Typography>
      <Typography variant="body1">
        Your order has been placed successfully. You will receive an email confirmation shortly.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </Box>
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <ShippingForm />;
      case 1:
        return <PaymentForm />;
      case 2:
        return <ReviewOrder />;
      case 3:
        return <OrderConfirmation />;
      default:
        throw new Error('Unknown step');
    }
  };

  return (
    <Container component="main" maxWidth="lg" sx={{ pt: '200px', pb: 8 }}>
      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Checkout
        </Typography>
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {getStepContent(activeStep)}
      </Paper>
    </Container>
  );
};

export default Checkout; 