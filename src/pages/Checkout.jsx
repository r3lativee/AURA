import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  FormLabel,
  RadioGroup,
  FormControlLabel as MuiFormControlLabel,
  Radio,
  FormHelperText,
} from '@mui/material';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { ordersAPI, authAPI } from '../services/api';
import InputWithFocusLock from '../components/InputWithFocusLock';
import '../styles/formFix.css';

const steps = ['Shipping address', 'Payment details', 'Review your order'];

const Checkout = () => {
  const [activeStep, setActiveStep] = useState(0);
  const { cart, total, clearCart } = useCart();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [useExistingCard, setUseExistingCard] = useState(false);
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to proceed with checkout');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Fetch saved payment methods if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchPaymentMethods();
    }
  }, [isAuthenticated]);
  
  // Function to fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      const response = await authAPI.getPaymentMethods();
      if (response.data?.success && response.data?.paymentMethods) {
        setSavedPaymentMethods(response.data.paymentMethods);
        setUseExistingCard(response.data.paymentMethods.length > 0);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Don't show an error toast here, just log it
      // The user can still proceed with checkout by entering payment info
    }
  };
  
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
    upiId: '',
    saveUpi: false,
    method: 'upi', // Default to UPI payment
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
    if (e) {
    e.preventDefault();
    }
    
    // Always use Razorpay
    setPaymentData({
      ...paymentData,
      method: 'razorpay'
    });
    
    // Move to next step
    handleNext();
  };
  
  const savePaymentMethod = async () => {
    try {
      const paymentMethodData = {
        paymentMethod: {
          method: paymentData.method,
          upiId: paymentData.upiId,
          isDefault: savedPaymentMethods.length === 0 // Make default if first payment method
        }
      };
      
      const response = await authAPI.addPaymentMethod(paymentMethodData);
      
      if (response.data.success) {
        toast.success('Payment method saved to your profile');
        fetchPaymentMethods(); // Refresh the list
      } else {
        toast.error('Failed to save payment method');
      }
    } catch (error) {
      console.error('Failed to save payment method:', error);
      toast.error('Failed to save payment method');
    }
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
      
      // Extract cart items array safely
      const cartItems = Array.isArray(cart) ? cart : (cart?.items || []);
      
      // Create order object
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.selectedSize || null,
        })),
        shippingAddress,
        totalAmount: total,
        paymentMethod: paymentData.method === 'razorpay' ? 'Razorpay' : 'UPI',
        paymentDetails: paymentData.method === 'razorpay' 
          ? { method: 'razorpay' }
          : { 
              method: 'upi',
              upiId: paymentData.upiId
        }
      };
      
      console.log('Submitting order with data:', JSON.stringify(orderData));
      
      // For Razorpay payment, we need to create an order first
      if (paymentData.method === 'razorpay') {
        // Call your backend to create a Razorpay order
        const response = await ordersAPI.createRazorpayOrder({ 
          amount: total * 100, // Amount in paise
          currency: 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            userEmail: user.email,
            items: cartItems.map(item => item.name).join(', ')
          }
        });
        
        if (response.data && response.data.id) {
          const razorpayOptions = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_M1QTLqpvgMzQNE', // Replace with your Razorpay Key ID
            amount: total * 100, // Amount in smallest currency unit
            currency: 'INR',
            name: 'AURA',
            description: 'Purchase from AURA',
            order_id: response.data.id,
            handler: async function (response) {
              // Payment was successful, create the order
              const paymentResult = {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature
              };
              
              // Verify the payment
              try {
                const verificationResponse = await ordersAPI.verifyRazorpayPayment({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature
                });
                
                if (!verificationResponse.data || !verificationResponse.data.success) {
                  toast.error('Payment verification failed. Please contact support.');
                  return;
                }
                
                // Payment verified, create the order
                const orderResponse = await ordersAPI.create({
                  ...orderData,
                  paymentDetails: {
                    ...orderData.paymentDetails,
                    ...paymentResult
                  }
                });
                
                if (orderResponse.data && orderResponse.data.success) {
                  toast.success('Order placed successfully!');
                  clearCart();
                  handleNext();
                } else {
                  toast.error('Failed to place order. Please contact support.');
                }
              } catch (error) {
                console.error('Failed to verify Razorpay payment:', error);
                toast.error('Failed to verify Razorpay payment. Please try again.');
              }
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phoneNumber
            },
            theme: {
              color: '#646cff'
            }
          };
          
          // Initialize Razorpay checkout
          const razorpay = new window.Razorpay(razorpayOptions);
          razorpay.open();
          
        } else {
          toast.error('Failed to create Razorpay order. Please try another payment method.');
        }
      } else {
        // UPI payment
      const response = await ordersAPI.create(orderData);
      
      if (response.data && response.data.success) {
          toast.success('Order placed successfully! Please complete the UPI payment using the details provided.');
        clearCart();
        handleNext();
      } else {
        toast.error('Failed to place order. Please try again.');
        }
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    }
  };

  // Modify the setShippingData handling to use a memoized callback to avoid re-renders
  const updateShippingData = useCallback((field, value) => {
    setShippingData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Also for payment data
  const updatePaymentData = useCallback((field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

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
              <InputWithFocusLock
                required
                id="fullName"
                name="fullName"
                label="Full Name"
                fullWidth
                value={shippingData.fullName}
                onChange={(e) => updateShippingData('fullName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <InputWithFocusLock
                required
                id="phoneNumber"
                name="phoneNumber"
                label="Phone Number"
                fullWidth
                value={shippingData.phoneNumber}
                onChange={(e) => updateShippingData('phoneNumber', e.target.value)}
                helperText="Required for delivery updates"
              />
            </Grid>
            <Grid item xs={12}>
              <InputWithFocusLock
                required
                id="street"
                name="street"
                label="Street Address"
                fullWidth
                multiline
                rows={2}
                value={shippingData.street}
                onChange={(e) => updateShippingData('street', e.target.value)}
                helperText="House/Flat No., Street, Landmark"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                required
                id="city"
                name="city"
                label="City"
                fullWidth
                value={shippingData.city}
                onChange={(e) => updateShippingData('city', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                required
                id="state"
                name="state"
                label="State"
                fullWidth
                value={shippingData.state}
                onChange={(e) => updateShippingData('state', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                required
                id="pincode"
                name="pincode"
                label="Pincode"
                fullWidth
                value={shippingData.pincode}
                onChange={(e) => updateShippingData('pincode', e.target.value)}
                helperText="6-digit pincode"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                required
                id="country"
                name="country"
                label="Country"
                fullWidth
                value={shippingData.country}
                onChange={(e) => updateShippingData('country', e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={shippingData.saveAddress}
                    onChange={(e) => updateShippingData('saveAddress', e.target.checked)}
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

  const PaymentForm = () => {
    return (
      <React.Fragment>
      <Typography variant="h6" gutterBottom>
          Payment Method
      </Typography>
        
      <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Payment Method</FormLabel>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
                <img 
                  src="https://razorpay.com/assets/razorpay-glyph.svg" 
                  alt="Razorpay"
                  style={{ height: 20, marginRight: 8 }}
                />
                <Typography>
                  Razorpay (Credit/Debit Card, UPI, Netbanking)
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                You will be redirected to Razorpay to complete your payment securely.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => {
                  setPaymentData({
                    ...paymentData,
                    method: 'razorpay'
                  });
                  handleNext();
                }}
                sx={{ mt: 2, mb: 2, maxWidth: 200 }}
              >
                Pay Now
              </Button>
              </FormControl>
          </Grid>
            </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 3 }}>
          <Button onClick={handleBack}>
            Back
        </Button>
      </Box>
      </React.Fragment>
  );
  };

  const ReviewOrder = () => {
    // Extract cart items
    const cartItems = Array.isArray(cart) ? cart : (cart?.items || []);
        
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Order Summary
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Shipping
            </Typography>
            <Typography gutterBottom>
              {user?.name}
            </Typography>
            <Typography gutterBottom>
              {shippingData.useExistingAddress && user?.addresses?.length > 0 ? (
                <>
                  {user.addresses[shippingData.selectedAddressIndex].street}, {user.addresses[shippingData.selectedAddressIndex].city}, {user.addresses[shippingData.selectedAddressIndex].state} - {user.addresses[shippingData.selectedAddressIndex].pincode}, {user.addresses[shippingData.selectedAddressIndex].country}
                </>
              ) : (
                <>
                  {shippingData.street}, {shippingData.city}, {shippingData.state} - {shippingData.pincode}, {shippingData.country}
                </>
              )}
            </Typography>
          </Grid>
          
          <Grid item container direction="column" xs={12} sm={6}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Payment Details
        </Typography>
            <Grid container>
              <Grid item xs={6}>
                <Typography gutterBottom>Method:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography gutterBottom>
                  {paymentData.method === 'razorpay' ? 'Razorpay' : 'UPI'}
        </Typography>
              </Grid>
              
              {paymentData.method === 'razorpay' ? (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    You will be redirected to Razorpay to complete your payment securely.
        </Typography>
                </Grid>
              ) : (
                <>
                  <Grid item xs={6}>
                    <Typography gutterBottom>UPI ID:</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography gutterBottom>{paymentData.upiId}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Please ensure your UPI ID is correct. You'll need to authorize this payment through your UPI app.
        </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>
          <List disablePadding>
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <ListItem key={item.productId} sx={{ py: 1, px: 0 }}>
                  <ListItemAvatar>
                    <Avatar src={item.image} alt={item.name} variant="square" sx={{ width: 60, height: 60, mr: 2 }} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.name}
                    secondary={item.selectedSize ? `Size: ${item.selectedSize}` : ''}
                  />
                  <Typography variant="body2">
                    {item.quantity} x ₹{item.price.toFixed(2)}
                  </Typography>
                </ListItem>
              ))
            ) : (
              <Typography variant="body1" color="text.secondary">
                No items in cart
              </Typography>
            )}
            
            <ListItem sx={{ py: 1, px: 0 }}>
              <ListItemText primary="Total" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                ₹{total.toFixed(2)}
              </Typography>
            </ListItem>
          </List>
        </Box>
      </Box>
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
        return <ShippingForm key="shipping-form" />;
      case 1:
        return <PaymentForm key="payment-form" />;
      case 2:
        return <ReviewOrder key="review-form" />;
      case 3:
        return <OrderConfirmation key="confirmation" />;
      default:
        throw new Error('Unknown step');
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ mb: 8, py: 8, pt: '200px' }}>
      <Paper 
        sx={{ 
          px: { xs: 2, md: 4 }, 
          py: { xs: 3, md: 5 },
          position: 'relative',
          zIndex: 5,
          transform: 'none !important',
          isolation: 'isolate',
          backgroundColor: '#1A1A1A',
          borderRadius: '15px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
        className="checkout-form-container"
      >
        <Typography component="h1" variant="h4" align="center" sx={{ mb: 4, fontWeight: 'medium' }}>
          Checkout
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <div className="form-focus-fix-container" style={{ position: 'relative', zIndex: 10, transform: 'none !important' }}>
          {getStepContent(activeStep)}
        </div>
      </Paper>
    </Container>
  );
};

export default Checkout; 