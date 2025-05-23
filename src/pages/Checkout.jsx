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
  
  // Extract cart items array safely
  const cartItems = Array.isArray(cart) ? cart : (cart?.items || []);
  
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
    
    // Set payment method to Razorpay
    updatePaymentData('method', 'Razorpay');
    handleNext();
  };
  
  // Function to save a new payment method
  const savePaymentMethod = async () => {
    try {
      const paymentMethodData = {
        cardName: paymentData.cardName,
        cardNumber: paymentData.cardNumber,
        expiryDate: paymentData.expDate,
        cvv: paymentData.cvv,
        isDefault: savedPaymentMethods.length === 0 // Make default if first card
      };
      
      const response = await authAPI.addPaymentMethod(paymentMethodData);
      
      if (response.data?.success) {
        toast.success('Payment method saved');
        // Refresh payment methods
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Failed to save payment method:', error);
      toast.error('Failed to save payment method');
      // Don't block checkout if saving fails
    }
  };

  const handleOrderSubmit = async () => {
    try {
      // Show loading toast
      toast.loading('Initializing payment...', { id: 'payment-loading' });

      // Check if cart is empty
      if (cartItems.length === 0) {
        toast.error('Your cart is empty!');
        toast.dismiss('payment-loading');
        return;
      }

      // Format items for the order
      const orderItems = cartItems.map(item => {
        console.log('Cart item being processed:', item); // Debug item data
        return {
          productId: item.productId || item._id,
          name: item.name || 'Product', // Ensure name exists
          price: item.price || 0,
          quantity: item.quantity || 1,
          size: item.selectedSize || null
        };
      });

      // Format shipping address
      const formattedAddress = shippingData.useExistingAddress && user?.addresses?.length > 0
        ? user.addresses[shippingData.selectedAddressIndex]
        : {
            street: shippingData.street,
            city: shippingData.city,
            state: shippingData.state,
            pincode: shippingData.pincode,
            country: shippingData.country
          };
      
      // Step 1: Create Razorpay order
      console.log('Creating Razorpay order with amount:', Math.round(total * 100));
      try {
        const razorpayResponse = await ordersAPI.createRazorpayOrder(
          Math.round(total * 100) // Convert to smallest currency unit (paise)
        );
        
        if (!razorpayResponse.data || !razorpayResponse.data.id) {
          toast.error('Failed to create payment order');
          toast.dismiss('payment-loading');
          return;
        }
        
        const razorpayOrderId = razorpayResponse.data.id;
        
        // Dismiss loading toast
        toast.dismiss('payment-loading');
        
        // Check if Razorpay is loaded
        if (!window.Razorpay) {
          toast.error('Payment gateway not loaded. Please refresh the page and try again.');
          return;
        }
        
        // Step 2: Configure Razorpay checkout options
        const options = {
          key: 'rzp_test_VSdThjRMT7Nf1w', // Your Key ID from Razorpay
          amount: Math.round(total * 100), // Amount in smallest currency unit
          currency: 'INR',
          name: 'AURA',
          description: 'Purchase from AURA',
          order_id: razorpayOrderId,
          handler: async function(response) {
            try {
              // Show processing toast
              toast.loading('Processing your payment...', { id: 'verify-payment' });
              
              // Prepare order data to send with verification
              const orderData = {
                user: user._id,
                items: cartItems.map(item => ({
                  productId: item.product._id,
                  name: item.product.name,
                  price: item.product.price,
                  quantity: item.quantity,
                  size: item.size,
                  color: item.color
                })),
                shippingAddress: {
                  street: `${formattedAddress.street} ${formattedAddress.street2 || ''}`.trim(),
                  city: formattedAddress.city,
                  state: formattedAddress.state,
                  pincode: formattedAddress.pincode,
                  country: formattedAddress.country
                },
                totalAmount: total
              };
              
              // Step 4: Verify payment and create order in our system
              // Verify the payment
              const verifyResponse = await ordersAPI.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderData: orderData // Send order data with verification
              });
              
              if (!verifyResponse.data || !verifyResponse.data.success) {
                toast.error('Payment verification failed');
                toast.dismiss('verify-payment');
                return;
              }
              
              // Order created on server side during verification
              const orderId = verifyResponse.data.orderId;
              
              // Clear cart
              await clearCart();
              
              // Show success message
              toast.dismiss('verify-payment');
              toast.success('Payment successful! Order placed.');
              
              // Redirect to order confirmation
              navigate('/orders');
            } catch (error) {
              console.error('Payment processing error:', error);
              toast.dismiss('verify-payment');
              toast.error('Payment processing failed. Please try again.');
            }
          },
          modal: {
            ondismiss: function() {
              console.log('Payment modal dismissed');
              toast.error('Payment cancelled');
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
            contact: shippingData.phoneNumber || user?.phoneNumber || ''
          },
          notes: {
            address: `${formattedAddress.street}, ${formattedAddress.city}, ${formattedAddress.state}`
          },
          theme: {
            color: '#3a3a3a'
          }
        };
        
        // Step 3: Open Razorpay checkout
        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      } catch (paymentError) {
        toast.dismiss('payment-loading');
        console.error('Payment gateway error:', paymentError);
        toast.error('Payment gateway error. Please try again later.');
      }
    } catch (error) {
      toast.dismiss('payment-loading');
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to process checkout');
    }
  };

  // Function to save a new address to the user's profile
  const saveNewAddress = async () => {
    try {
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
      
      await updateProfile(addressData);
    } catch (error) {
      console.error('Failed to save address:', error);
      // Don't throw the error so order completion isn't affected
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

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          resolve(true);
        };
        script.onerror = () => {
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    const loadScript = async () => {
      if (window.Razorpay) {
        return true;
      }
      const res = await loadRazorpayScript();
      if (!res) {
        console.error('Razorpay script failed to load');
        toast.error('Payment gateway failed to load. Please refresh the page and try again.');
      }
      return res;
    };

    loadScript();
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

  const PaymentForm = () => (
    <form onSubmit={handlePaymentSubmit}>
      <Typography variant="h6" gutterBottom>
        Payment method
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            borderRadius: 2, 
            p: 3, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            cursor: 'pointer',
            '&:hover': { borderColor: 'primary.main' }
          }}
          onClick={() => {
            updatePaymentData('method', 'Razorpay');
            // Automatically proceed to next step when Razorpay is selected
            handleNext();
          }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box 
                component="img" 
                src="https://razorpay.com/favicon.png" 
                alt="Razorpay logo"
                sx={{ width: 30, mr: 2 }}
              />
              <Typography variant="body1">Razorpay</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Pay securely via Razorpay
            </Typography>
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={handleBack}>Back</Button>
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
        
    // Trigger Razorpay payment when review page is shown
    useEffect(() => {
      if (cartItems.length > 0) {
        handleOrderSubmit();
      }
    }, []);
        
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
          Payment Method
        </Typography>
        <Typography variant="body1">
          Razorpay
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="bold">
          Order Items
        </Typography>
        {cartItems.length === 0 ? (
          <Alert severity="warning">Your cart is empty!</Alert>
        ) : (
          <>
            {cartItems.map((item) => (
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
            disabled={cartItems.length === 0}
          >
            Proceed to Payment
          </Button>
        </Box>
        {cartItems.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Please add items to your cart before proceeding to payment.
          </Alert>
        )}
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