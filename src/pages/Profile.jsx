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
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import InputWithFocusLock from '../components/InputWithFocusLock';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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

  useEffect(() => {
    if (user) {
      console.log('User data for profile:', user);
      
      const defaultAddress = user.addresses && user.addresses.length > 0
        ? user.addresses.find(addr => addr.isDefault) || user.addresses[0]
        : null;
      
      const profileImage = user.profileImage || '';
      
      console.log('Setting profile image:', profileImage);
      
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        street: defaultAddress?.street || '',
        city: defaultAddress?.city || '',
        state: defaultAddress?.state || '',
        pincode: defaultAddress?.pincode || '',
        country: defaultAddress?.country || 'India',
        profileImage: profileImage,
      });
    }
  }, [user]);

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

  const validateProfileData = () => {
    if (!profileData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!profileData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(profileData.phoneNumber.replace(/[^0-9]/g, ''))) {
      setError('Please enter a valid phone number (10-15 digits)');
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

      console.log('Sending profile update:', dataToSend);
      
      try {
        await updateProfile(dataToSend);
        // Only set success here if updateProfile doesn't throw an error
        setSuccess('Profile updated successfully!');
      } catch (apiError) {
        // Let the error from updateProfile propagate to the outer catch
        throw apiError;
      }
      
    } catch (err) {
      console.error('Profile update error:', err);
      // Use the error message if available, otherwise show a generic message
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ 
      py: 8, 
      pt: '200px',
      display: 'flex', 
      justifyContent: 'center' 
    }}>
      <Paper sx={{ 
        p: 4, 
        backgroundColor: '#1A1A1A', 
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        maxWidth: 800,
        width: '100%'
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 700, mb: 3, color: '#fff' }}>
            My Profile
          </Typography>
          
          <Avatar
            src={profileData.profileImage || 'https://i.imgur.com/3tVgsra.png'}
            alt={profileData.name}
            sx={{ 
              width: 140, 
              height: 140, 
              bgcolor: 'primary.main',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              fontSize: '40px',
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
          
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {profileData.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profileData.email}
          </Typography>
          
          <Typography 
            variant="caption" 
            display="block" 
            sx={{ 
              textAlign: 'center', 
              mt: 1, 
              color: 'text.secondary',
              maxWidth: 250
            }}
          >
            Your unique avatar is generated automatically
          </Typography>
        </Box>
        
        {(success || error) && (
          <Box sx={{ mb: 3 }}>
            {success && <Alert severity="success">{success}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}

        <form onSubmit={handleProfileUpdate}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
                pb: 1 
              }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Personal Information
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                fullWidth
                label="Full Name"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
                required
                error={error && !profileData.name.trim()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                  position: 'relative',
                  zIndex: 5,
                }}
                autoComplete="name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                fullWidth
                label="Email"
                type="email"
                value={profileData.email}
                disabled
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                  position: 'relative',
                  zIndex: 5,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleInputChange}
                required
                error={error && !profileData.phoneNumber.trim()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                  position: 'relative',
                  zIndex: 5,
                }}
                autoComplete="tel"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 2, 
                mb: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
                pb: 1 
              }}>
                <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Shipping Address
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <InputWithFocusLock
                fullWidth
                label="Street Address"
                name="street"
                value={profileData.street}
                onChange={handleInputChange}
                required
                multiline
                rows={2}
                error={error && !profileData.street.trim()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                  position: 'relative',
                  zIndex: 5,
                }}
                autoComplete="street-address"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                fullWidth
                label="City"
                name="city"
                value={profileData.city}
                onChange={handleInputChange}
                required
                error={error && !profileData.city.trim()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                  position: 'relative',
                  zIndex: 5,
                }}
                autoComplete="address-level2"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                fullWidth
                label="State"
                name="state"
                value={profileData.state}
                onChange={handleInputChange}
                required
                error={error && !profileData.state.trim()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                  position: 'relative',
                  zIndex: 5,
                }}
                autoComplete="address-level1"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                fullWidth
                label="Pincode"
                name="pincode"
                value={profileData.pincode}
                onChange={handleInputChange}
                required
                error={error && !profileData.pincode.trim()}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                  position: 'relative',
                  zIndex: 5,
                }}
                autoComplete="postal-code"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <InputWithFocusLock
                fullWidth
                label="Country"
                name="country"
                value={profileData.country}
                onChange={handleInputChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main',
                      borderWidth: '2px',
                    },
                  },
                  position: 'relative',
                  zIndex: 5,
                }}
                autoComplete="country-name"
              />
            </Grid>
            <Grid item xs={12} display="flex" justifyContent="center" mt={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: 600,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Save Changes'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile; 