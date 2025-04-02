import React from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  IconButton,
  Avatar,
} from '@mui/material';
import { LocationOn, ArrowForward } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfileOverlay = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const handleOrders = () => {
    navigate('/orders');
    onClose();
  };

  const handleWishlist = () => {
    navigate('/wishlist');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          borderRadius: 2,
          p: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <img src="/nike-logo.svg" alt="Nike" style={{ height: 24 }} />
        <Button
          endIcon={<ArrowForward />}
          onClick={handleSignOut}
          sx={{ 
            color: 'text.primary',
            '&:hover': { backgroundColor: 'transparent' },
          }}
        >
          Sign Out
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <LocationOn sx={{ color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          IN
        </Typography>
      </Box>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Avatar
          src={user?.profileImage || '/default-avatar.jpg'}
          sx={{ 
            width: 80, 
            height: 80, 
            margin: '0 auto',
            mb: 2,
            border: '2px solid',
            borderColor: 'primary.main',
          }}
        />
        <Typography variant="body2" color="text.secondary">
          Welcome Back !!
        </Typography>
        <Typography variant="h6">
          {user?.name || 'User'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleOrders}
          sx={{
            bgcolor: 'black',
            color: 'white',
            '&:hover': {
              bgcolor: '#333',
            },
          }}
        >
          Orders
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={handleWishlist}
          sx={{
            borderColor: 'grey.700',
            color: 'text.primary',
            '&:hover': {
              borderColor: 'grey.500',
              bgcolor: 'transparent',
            },
          }}
        >
          Wishlist
        </Button>
      </Box>
    </Dialog>
  );
};

export default ProfileOverlay; 