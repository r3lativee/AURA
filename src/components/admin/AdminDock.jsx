import React, { useState } from 'react';
import { 
  Box, IconButton, Tooltip, Badge, Paper, 
  useTheme, Avatar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import GridViewIcon from '@mui/icons-material/GridView';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { motion } from 'framer-motion';

// Styled Components
const DockContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  top: 15,
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 50,
  padding: '8px 15px',
  width: 'auto',
  zIndex: 1400,
  background: '#000000',
  backdropFilter: 'blur(0px)',
  border: '1px solid rgba(40, 40, 40, 0.5)',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
  overflow: 'visible',
}));

const MotionIconButton = styled(motion.div)(({ theme }) => ({
  position: 'relative',
  margin: '0 4px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#ff4b4b',
    color: 'white',
    fontSize: '0.65rem',
    fontWeight: 'bold',
    minWidth: '18px',
    height: '18px',
    padding: 0,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
  },
}));

const menuItems = [
  { text: 'Dashboard', icon: <GridViewIcon fontSize="small" />, path: '/admin/dashboard' },
  { text: 'Products', icon: <InventoryIcon fontSize="small" />, path: '/admin/products' },
  { text: 'Orders', icon: <ShoppingCartIcon fontSize="small" />, path: '/admin/orders', badge: 4 },
  { text: 'Users', icon: <PeopleIcon fontSize="small" />, path: '/admin/users' },
  { text: 'Trash', icon: <DeleteOutlineIcon fontSize="small" />, path: '/admin/trash' }
];

const AdminDock = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(null);

  const handleLogout = () => {
    // Perform logout operations here
    navigate('/login');
  };

  return (
    <DockContainer elevation={4}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          position: 'relative',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        {/* Avatar */}
        <MotionIconButton
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onHoverStart={() => setIsHovered('profile')}
          onHoverEnd={() => setIsHovered(null)}
        >
          <Tooltip title="Profile" placement="bottom" arrow>
            <Avatar
              alt="Admin User"
              src="/assets/images/avatar.jpg"
              sx={{
                width: 36,
                height: 36,
                border: '2px solid #333',
                backgroundColor: '#333',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#444',
                }
              }}
            >
              A
            </Avatar>
          </Tooltip>
        </MotionIconButton>

        <Box 
          sx={{ 
            height: 26, 
            width: 1, 
            mx: 0.5, 
            bgcolor: 'rgba(70, 70, 70, 0.5)'
          }} 
        />

        {/* Menu Items */}
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <MotionIconButton
              key={item.text}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onHoverStart={() => setIsHovered(item.text)}
              onHoverEnd={() => setIsHovered(null)}
            >
              <Tooltip title={item.text} placement="bottom" arrow>
                <IconButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: isActive ? 'rgba(50, 50, 50, 0.5)' : 'transparent',
                    transition: 'all 0.2s ease',
                    width: 36,
                    height: 36,
                    padding: 0,
                    '&:hover': {
                      backgroundColor: 'rgba(50, 50, 50, 0.3)',
                    }
                  }}
                >
                  {item.badge ? (
                    <StyledBadge badgeContent={item.badge} color="error">
                      {item.icon}
                    </StyledBadge>
                  ) : (
                    item.icon
                  )}
                </IconButton>
              </Tooltip>
            </MotionIconButton>
          );
        })}

        <Box 
          sx={{ 
            height: 26, 
            width: 1, 
            mx: 0.5, 
            bgcolor: 'rgba(70, 70, 70, 0.5)'
          }} 
        />

        {/* Notifications */}
        <MotionIconButton
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onHoverStart={() => setIsHovered('notifications')}
          onHoverEnd={() => setIsHovered(null)}
        >
          <Tooltip title="Notifications" placement="bottom" arrow>
            <IconButton
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease',
                width: 36,
                height: 36,
                padding: 0,
                '&:hover': {
                  backgroundColor: 'rgba(50, 50, 50, 0.3)',
                }
              }}
            >
              <StyledBadge badgeContent={2} color="error">
                <NotificationsIcon fontSize="small" />
              </StyledBadge>
            </IconButton>
          </Tooltip>
        </MotionIconButton>

        {/* Settings */}
        <MotionIconButton
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onHoverStart={() => setIsHovered('settings')}
          onHoverEnd={() => setIsHovered(null)}
        >
          <Tooltip title="Settings" placement="bottom" arrow>
            <IconButton
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease',
                width: 36,
                height: 36,
                padding: 0,
                '&:hover': {
                  backgroundColor: 'rgba(50, 50, 50, 0.3)',
                }
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </MotionIconButton>
      </Box>
    </DockContainer>
  );
};

export default AdminDock; 