import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import InputWithFocusLock from '../components/InputWithFocusLock';
import { motion } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { authAPI } from '../services/api';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    profileImage: '',
  });

  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    isDefault: false
  });

  useEffect(() => {
    if (user) {
      const defaultAddress = user.addresses?.find(addr => addr.isDefault) || user.addresses?.[0];
      
      // Log the available user data for debugging
      console.log('Setting profile data from user:', { 
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        hasAddresses: !!user.addresses?.length
      });
      
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        street: defaultAddress?.street || '',
        city: defaultAddress?.city || '',
        state: defaultAddress?.state || '',
        pincode: defaultAddress?.pincode || '',
        country: defaultAddress?.country || 'India',
        profileImage: user.profileImage || '',
      });

      // Fetch payment methods
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await authAPI.getPaymentMethods();
      if (response.data?.success && response.data?.paymentMethods) {
        setPaymentMethods(response.data.paymentMethods);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Don't show a toast here, just log the error
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Use functional update to prevent race conditions
    setProfileData(prevData => {
      // Only update if the value has actually changed
      if (prevData[name] === value) {
        return prevData; // Return existing state to avoid unnecessary re-renders
      }
      
      return {
        ...prevData,
        [name]: value
      };
    });
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setNewPaymentMethod(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDefaultChange = (e) => {
    setNewPaymentMethod(prev => ({
      ...prev,
      isDefault: e.target.checked
    }));
  };

  const validateProfileData = () => {
    if (!profileData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    // Log the phoneNumber for debugging
    console.log('Validating phoneNumber:', profileData.phoneNumber);
    
    if (!profileData.phoneNumber || !profileData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    const phoneNumber = profileData.phoneNumber.replace(/[^0-9]/g, '');
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError(`Please enter a valid phone number (10-15 digits). You entered: ${profileData.phoneNumber}`);
      return false;
    }
    
    if (!profileData.street.trim()) {
      setError('Street address is required');
      return false;
    }
    
    if (!profileData.city.trim()) {
      setError('City is required');
      return false;
    }
    
    if (!profileData.pincode.trim()) {
      setError('Pincode is required');
      return false;
    }
    
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(profileData.pincode.replace(/[^0-9]/g, ''))) {
      setError('Please enter a valid 6-digit pincode');
      return false;
    }
    
    return true;
  };

  const validatePaymentData = () => {
    if (!newPaymentMethod.cardName.trim()) {
      toast.error('Card name is required');
      return false;
    }
    
    if (!newPaymentMethod.cardNumber.trim()) {
      toast.error('Card number is required');
      return false;
    }
    
    // Validate card number
    const cardNumber = newPaymentMethod.cardNumber.replace(/\s/g, '');
    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(cardNumber)) {
      toast.error('Please enter a valid 16-digit card number');
      return false;
    }
    
    if (!newPaymentMethod.expiryDate.trim()) {
      toast.error('Expiry date is required');
      return false;
    }
    
    // Validate expiry date
    const expiryDateRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryDateRegex.test(newPaymentMethod.expiryDate)) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (!newPaymentMethod.cvv.trim()) {
      toast.error('CVV is required');
      return false;
    }
    
    // Validate CVV
    const cvvRegex = /^\d{3,4}$/;
    if (!cvvRegex.test(newPaymentMethod.cvv)) {
      toast.error('Please enter a valid CVV (3-4 digits)');
      return false;
    }
    
    return true;
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!validateProfileData()) {
        setLoading(false);
        return;
      }

      const address = {
        street: profileData.street,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        country: profileData.country,
        isDefault: true,
      };

      const dataToSend = {
        name: profileData.name,
        phoneNumber: profileData.phoneNumber,
        address
      };

      console.log('Sending profile update:', JSON.stringify(dataToSend, null, 2));
      
      try {
        await updateProfile(dataToSend);
        // Only set success here if updateProfile doesn't throw an error
        setSuccess('Profile updated successfully!');
        toast.success('Profile updated successfully');
      } catch (apiError) {
        // Let the error from updateProfile propagate to the outer catch
        throw apiError;
      }
      
    } catch (err) {
      console.error('Profile update error:', err);
      // Use the error message if available, otherwise show a generic message
      setError(err.message || 'An unexpected error occurred. Please try again.');
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!validatePaymentData()) {
      return;
    }
    
    setPaymentLoading(true);
    
    try {
      const response = await authAPI.addPaymentMethod(newPaymentMethod);
      
      if (response.data?.success) {
        toast.success('Payment method added successfully');
        setNewPaymentMethod({
          cardName: '',
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          isDefault: false
        });
        setOpenPaymentDialog(false);
        
        // Refresh payment methods
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Failed to add payment method:', error);
      toast.error(error.response?.data?.message || 'Failed to add payment method');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (id) => {
    try {
      const response = await authAPI.deletePaymentMethod(id);
      
      if (response.data?.success) {
        toast.success('Payment method deleted');
        
        // Update local state
        setPaymentMethods(prevMethods => 
          prevMethods.filter(method => method._id !== id)
        );
      }
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      toast.error('Failed to delete payment method');
    }
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

  return (
    <Container maxWidth="md" sx={{ 
      py: 8, 
      pt: '160px',
      display: 'flex', 
      justifyContent: 'center',
      minHeight: '100vh'
    }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        style={{ width: '100%' }}
      >
        <Paper sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          backgroundColor: '#050505', 
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          maxWidth: 800,
          width: '100%'
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom align="center" sx={{ 
              fontWeight: 400, 
              mb: 3, 
              color: '#fff',
              fontSize: { xs: '1.8rem', sm: '2.2rem' },
              letterSpacing: '-0.5px'
            }}>
              Profile
            </Typography>
            
            <Avatar
              src={profileData.profileImage || 'https://i.imgur.com/3tVgsra.png'}
              alt={profileData.name}
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'background.paper',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                mb: 2
              }}
              imgProps={{
                onError: (e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://i.imgur.com/3tVgsra.png';
                }
              }}
            >
              {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            
            <Typography variant="h5" sx={{ 
              fontWeight: 400,
              fontSize: '1.2rem',
              mb: 0.5 
            }}>
              {profileData.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {profileData.email}
            </Typography>
            {profileData.phoneNumber && (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                {profileData.phoneNumber}
              </Typography>
            )}
          </Box>
          
          {(success || error) && (
            <Box sx={{ mb: 3 }}>
              {success && (
                <Alert 
                  severity="success"
                  sx={{
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
              {error && (
                <Alert 
                  severity="error"
                  sx={{
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
            </Box>
          )}

          <form onSubmit={handleProfileUpdate}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                  pb: 1 
                }}>
                  <Typography variant="h6" sx={{ 
                    color: '#fff', 
                    fontWeight: 400,
                    fontSize: '1rem',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Personal Information
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputWithFocusLock
                  label="Full Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{
                    style: { 
                      fontWeight: 300,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputWithFocusLock
                  label="Email Address"
                  type="email"
                  value={profileData.email}
                  fullWidth
                  disabled
                  helperText="Email cannot be changed"
                  inputProps={{
                    style: { 
                      fontWeight: 300,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <InputWithFocusLock
                  label="Phone Number"
                  name="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  placeholder="Enter your phone number"
                  helperText="Phone number should be 10-15 digits"
                  inputProps={{
                    style: { 
                      fontWeight: 300,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px'
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  mt: 1,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                  pb: 1 
                }}>
                  <Typography variant="h6" sx={{ 
                    color: '#fff', 
                    fontWeight: 400,
                    fontSize: '1rem',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Shipping Address
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <InputWithFocusLock
                  label="Street Address"
                  name="street"
                  value={profileData.street}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{
                    style: { 
                      fontWeight: 300,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputWithFocusLock
                  label="City"
                  name="city"
                  value={profileData.city}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{
                    style: { 
                      fontWeight: 300,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputWithFocusLock
                  label="State"
                  name="state"
                  value={profileData.state}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{
                    style: { 
                      fontWeight: 300,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputWithFocusLock
                  label="Pincode"
                  name="pincode"
                  value={profileData.pincode}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{
                    style: { 
                      fontWeight: 300,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InputWithFocusLock
                  label="Country"
                  name="country"
                  value={profileData.country}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  inputProps={{
                    style: { 
                      fontWeight: 300,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '20px'
                    }
                  }}
                />
              </Grid>
              
              {/* Payment Methods Section */}
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mb: 2,
                  mt: 1,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)', 
                  pb: 1 
                }}>
                  <Typography variant="h6" sx={{ 
                    color: '#fff', 
                    fontWeight: 400,
                    fontSize: '1rem',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}>
                    Payment Methods
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => setOpenPaymentDialog(true)}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 400,
                      color: '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '20px',
                      padding: '5px 15px',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    Add Card
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                {paymentMethods.length === 0 ? (
                  <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', py: 2 }}>
                    You don't have any saved payment methods.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {paymentMethods.map((method) => (
                      <Grid item xs={12} md={6} key={method._id}>
                        <Card sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '15px',
                          position: 'relative'
                        }}>
                          <CardContent>
                            <Box sx={{ position: 'absolute', top: '10px', right: '10px' }}>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeletePaymentMethod(method._id)}
                                sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            
                            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>
                              {method.cardName}
                              {method.isDefault && (
                                <Typography 
                                  component="span" 
                                  sx={{ 
                                    ml: 1, 
                                    fontSize: '0.75rem', 
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    padding: '2px 8px',
                                    borderRadius: '10px'
                                  }}
                                >
                                  Default
                                </Typography>
                              )}
                            </Typography>
                            
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                              {method.cardNumber}
                            </Typography>
                            
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              Expires: {method.expiryDate}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    minWidth: '200px',
                    padding: '10px 20px',
                    textTransform: 'none',
                    fontWeight: 400,
                    borderRadius: '20px',
                    backgroundColor: '#fff',
                    color: '#000',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </motion.div>
      
      {/* Add Payment Method Dialog */}
      <Dialog 
        open={openPaymentDialog} 
        onClose={() => setOpenPaymentDialog(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#0A0A0A',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          Add Payment Method
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <InputWithFocusLock
                label="Name on Card"
                name="cardName"
                value={newPaymentMethod.cardName}
                onChange={handlePaymentInputChange}
                fullWidth
                required
                inputProps={{
                  style: { 
                    fontWeight: 300,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '20px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <InputWithFocusLock
                label="Card Number"
                name="cardNumber"
                value={newPaymentMethod.cardNumber}
                onChange={handlePaymentInputChange}
                fullWidth
                required
                placeholder="1234 5678 9012 3456"
                helperText="16-digit number without spaces"
                inputProps={{
                  style: { 
                    fontWeight: 300,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '20px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <InputWithFocusLock
                label="Expiry Date"
                name="expiryDate"
                value={newPaymentMethod.expiryDate}
                onChange={handlePaymentInputChange}
                fullWidth
                required
                placeholder="MM/YY"
                helperText="e.g. 09/25"
                inputProps={{
                  style: { 
                    fontWeight: 300,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '20px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <InputWithFocusLock
                label="CVV"
                name="cvv"
                value={newPaymentMethod.cvv}
                onChange={handlePaymentInputChange}
                fullWidth
                required
                helperText="3-4 digits on back of card"
                inputProps={{
                  style: { 
                    fontWeight: 300,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '20px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={newPaymentMethod.isDefault}
                    onChange={handleDefaultChange}
                    color="primary"
                  />
                }
                label="Set as default payment method"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Button 
            onClick={() => setOpenPaymentDialog(false)}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'none'
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddPaymentMethod}
            disabled={paymentLoading}
            variant="contained"
            sx={{
              backgroundColor: '#fff',
              color: '#000',
              textTransform: 'none',
              borderRadius: '20px',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.8)'
              }
            }}
          >
            {paymentLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              'Add Payment Method'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile; 