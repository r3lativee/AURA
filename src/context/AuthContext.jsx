import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

// Avatar collection - funny and smart characters
const avatars = [
  'https://i.imgur.com/3tVgsra.png', // Einstein cartoon
  'https://i.imgur.com/8igHtj1.png', // Sherlock Holmes cartoon
  'https://i.imgur.com/JYMqnOb.png', // Marie Curie cartoon
  'https://i.imgur.com/Q9qFt3P.png', // Nikola Tesla cartoon
  'https://i.imgur.com/vPMWRzm.png', // Ada Lovelace cartoon
  'https://i.imgur.com/7rLOZfa.png'  // Stephen Hawking cartoon
];

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    
    // Add event listener for auth state changes
    const handleAuthStateChanged = () => {
      console.log('Auth state change detected, refreshing user data');
      checkAuth();
    };
    
    window.addEventListener('auth-state-changed', handleAuthStateChanged);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, user not authenticated');
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('Token found, verifying user...');
      const { data } = await authAPI.getCurrentUser();
      
      if (!data || !data.user) {
        console.error('Invalid user data returned from API');
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log('User authenticated:', data.user);
      setUser(data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Modified login method to work with OTP flow
  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('Attempting login with credentials:', { 
        email: credentials.email, 
        password: '********' 
      });
      
      // The OTP has already been verified in the Login component,
      // so we can proceed with the actual login API call
      const { data } = await authAPI.login(credentials);
      
      if (!data || !data.token || !data.user) {
        console.error('Invalid response from server during login');
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', data.token);
      
      setUser(data.user);
      
      console.log('Login successful:', data.user);
      
      toast.success(`Welcome back, ${data.user.name}!`);
      
      // Check if user is admin
      if (data.user.isAdmin) {
        console.log('Admin user detected, redirecting to admin dashboard');
        navigate('/admin/dashboard');
        return data;
      }
      
      const hasCompleteAddress = data.user.addresses && 
                               data.user.addresses.length > 0 && 
                               data.user.addresses.some(addr => 
                                 addr.street && addr.city && addr.state && addr.pincode);
      
      if (!data.user.phoneNumber || !hasCompleteAddress) {
        console.log('Profile incomplete, redirecting to profile page');
        navigate('/profile');
      } else {
        navigate('/');
      }
      
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Generate random avatar
  const getRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * avatars.length);
    return avatars[randomIndex];
  };

  // Updated register method to handle OTP flow
  const registerRequest = async (userData) => {
    try {
      setLoading(true);
      
      // Add a random avatar to the user data
      userData.profileImage = getRandomAvatar();
      
      console.log('Sending registration request to API:', { 
        ...userData, 
        password: '[REDACTED]' 
      });
      
      // Show pending state before API call
      console.log('Before API call - Setting loading:', true);
      
      const response = await authAPI.registerRequest(userData);
      
      console.log('Registration request API response:', response);
      const { data } = response;
      
      if (!data.success) {
        console.error('Invalid registration request response:', data);
        throw new Error(data.message || 'Invalid response from server');
      }

      // Store the user data temporarily for the verification step
      console.log('Setting pendingRegistration with user data:', {
        ...userData,
        password: '[REDACTED]'
      });
      setPendingRegistration(userData);
      
      toast.success(data.message || 'Verification code sent to your email');
      
      return data;
    } catch (error) {
      console.error('Registration request failed:', error);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Registration request failed';
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
      console.log('After API call - Setting loading:', false);
    }
  };

  const verifyAndRegister = async (otp) => {
    try {
      setLoading(true);
      
      if (!pendingRegistration) {
        throw new Error('No pending registration found. Please try again.');
      }
      
      console.log('Verifying OTP and completing registration:', { 
        email: pendingRegistration.email,
        otp
      });
      
      const response = await authAPI.registerVerify(pendingRegistration, otp);
      
      console.log('Registration verification API response:', response);
      const { data } = response;
      
      if (!data.success || !data.token || !data.user) {
        console.error('Invalid registration verification response:', data);
        throw new Error(data.message || 'Invalid response from server');
      }

      localStorage.setItem('token', data.token);
      
      setUser(data.user);
      setPendingRegistration(null);
      
      toast.success(data.message || 'Registration successful! Please complete your profile');
      
      navigate('/profile');
      return data;
    } catch (error) {
      console.error('Registration verification failed:', error);
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Registration verification failed';
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Keep the original register method for backward compatibility
  const register = async (userData) => {
    try {
      setLoading(true);
      
      // Add a random avatar to the user data
      userData.profileImage = getRandomAvatar();
      
      console.log('Sending registration data to API:', { 
        ...userData, 
        password: '[REDACTED]' 
      });
      
      const response = await authAPI.register(userData);
      
      console.log('Registration API response:', response);
      const { data } = response;
      
      if (!data.success || !data.token || !data.user) {
        console.error('Invalid registration response:', data);
        throw new Error(data.message || 'Invalid response from server');
      }

      localStorage.setItem('token', data.token);
      
      setUser(data.user);
      
      toast.success(data.message || 'Registration successful! Please complete your profile');
      
      navigate('/profile');
      return data;
    } catch (error) {
      console.error('Registration failed:', error);
      
      localStorage.removeItem('token');
      
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Registration failed';
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      console.log('Updating profile with data:', JSON.stringify(profileData, null, 2));
      
      try {
        const response = await authAPI.updateProfile(profileData);
        console.log('Profile update response:', JSON.stringify(response.data, null, 2));
        
        if (response && response.data) {
          // Get the updated user data from response
          const userData = response.data.user || response.data;
          
          // Ensure we have the phone number (either from the response or the original request)
          const phoneNumber = userData.phoneNumber || profileData.phoneNumber || '';
          
          console.log('Setting user state with phone number:', phoneNumber);
          
          // Update the user state with explicit handling of phoneNumber
          setUser(prevUser => {
            const updatedUser = {
              ...prevUser,
              ...userData,
              phoneNumber: phoneNumber,
              name: userData.name || prevUser.name,
              addresses: userData.addresses || prevUser.addresses || []
            };
            
            console.log('Updated user state:', updatedUser);
            return updatedUser;
          });
          
          // Show success message
          toast.success('Profile updated successfully');
          return response.data;
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
        // Extract the error message from the API response and log more details
        console.error('API error details:', apiError.response?.data);
        const errorMessage = apiError.response?.data?.message || 'Server connection error';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete updateProfileImage function and replace with a simpler one
  const ensureUserHasAvatar = (userData) => {
    if (!userData.profileImage) {
      return {
        ...userData,
        profileImage: getRandomAvatar()
      };
    }
    return userData;
  };

  const uploadProfileImage = async (file) => {
    setLoading(true);
    try {
      const response = await authAPI.uploadProfileImage(file);
      console.log('Profile image uploaded:', response.data);
      
      // Update the user in state with the new image URL
      setUser(prevUser => ({
        ...prevUser,
        profileImage: response.data.user?.profileImage || response.data.profileImage
      }));
      
      toast.success('Profile image updated successfully');
      return response.data;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload profile image';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProfileImage = async () => {
    setLoading(true);
    try {
      const response = await authAPI.deleteProfileImage();
      console.log('Profile image deleted:', response.data);
      
      // Update the user in state with the default image
      setUser(prevUser => ({
        ...prevUser,
        profileImage: response.data.user?.profileImage || response.data.defaultImage || null
      }));
      
      toast.success('Profile image removed');
      return response.data;
    } catch (error) {
      console.error('Error deleting profile image:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete profile image';
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    pendingRegistration,
    login,
    register,
    registerRequest,
    verifyAndRegister,
    logout,
    updateProfile,
    getRandomAvatar,
    ensureUserHasAvatar,
    checkAuth,
    isAdmin: user?.isAdmin || false,
    uploadProfileImage,
    deleteProfileImage
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 