import React, { useState } from 'react';
import { 
  Drawer, Box, List, ListItem, ListItemIcon, 
  ListItemText, Typography, Avatar, Divider, Badge,
  useTheme, alpha, IconButton, Tooltip, Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';

const drawerWidth = 280;

// Styled components
const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
  width: open ? drawerWidth : 72,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  '& .MuiDrawer-paper': {
    width: open ? drawerWidth : 72,
    background: `linear-gradient(180deg, ${alpha('#101935', 0.96)} 0%, ${alpha('#0d1629', 0.98)} 100%)`,
    color: theme.palette.common.white,
    boxShadow: '2px 0 20px rgba(0,0,0,0.1)',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    transition: theme.transitions.create(['width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
  },
}));

const StyledListItem = styled(ListItem)(({ theme, active }) => ({
  margin: '4px 8px',
  borderRadius: '12px',
  transition: 'all 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
  padding: '10px 16px',
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
  '&:before': active ? {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '4px',
    height: '60%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '0 4px 4px 0',
  } : {},
  '&:hover': {
    backgroundColor: active 
      ? alpha(theme.palette.primary.main, 0.15) 
      : alpha(theme.palette.common.white, 0.04),
    '& .MuiListItemIcon-root': {
      transform: 'translateY(-2px)',
    },
  },
  '& .MuiListItemIcon-root': {
    color: active ? theme.palette.primary.main : alpha(theme.palette.common.white, 0.65),
    minWidth: '42px',
    transition: 'transform 0.2s ease',
  },
  '& .MuiListItemText-primary': {
    fontWeight: active ? 600 : 400,
    color: active ? theme.palette.primary.main : alpha(theme.palette.common.white, 0.85),
    fontSize: '0.95rem',
    letterSpacing: '0.015em',
  },
}));

const GradientText = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 700,
  letterSpacing: '0.025em',
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
  { text: 'Products', icon: <InventoryIcon />, path: '/admin/products' },
  { text: 'Orders', icon: <ShoppingCartIcon />, path: '/admin/orders' },
  { text: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
];

const AdminSidebar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    // Perform logout operations here
    navigate('/login');
  };

  return (
    <StyledDrawer variant="permanent" open={open}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          padding: open ? '20px 16px 10px' : '20px 8px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {open && (
          <GradientText variant="h5" component="h1">
            AURA ADMIN
          </GradientText>
        )}
        <IconButton 
          onClick={handleDrawerToggle}
          sx={{ 
            color: 'white', 
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) },
            width: 32,
            height: 32
          }}
        >
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>

      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: open ? 'flex-start' : 'center',
          padding: open ? '20px 16px' : '20px 0',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 1,
            width: '100%',
            justifyContent: open ? 'flex-start' : 'center',
          }}
        >
          <Avatar
            alt="Admin User"
            src="/assets/images/avatar.jpg"
            sx={{ 
              width: open ? 48 : 40, 
              height: open ? 48 : 40,
              border: '2px solid rgba(255,255,255,0.1)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                borderColor: alpha(theme.palette.primary.main, 0.6),
              }
            }}
          />
          {open && (
            <Box sx={{ ml: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: 'white',
                  fontSize: '0.95rem',
                }}
              >
                Admin User
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: alpha(theme.palette.common.white, 0.7),
                  fontSize: '0.8rem',
                }}
              >
                Super Admin
              </Typography>
            </Box>
          )}
        </Box>

        {open && <Divider sx={{ width: '100%', my: 2, borderColor: 'rgba(255,255,255,0.06)' }} />}
      </Box>

      <List sx={{ px: 1, py: 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <StyledListItem
              key={item.text}
              active={isActive ? 1 : 0}
              onClick={() => navigate(item.path)}
              button
              sx={{ 
                mb: 0.5,
                justifyContent: open ? 'flex-start' : 'center',
              }}
            >
              <ListItemIcon>
                {item.text === 'Orders' ? (
                  <Badge 
                    badgeContent={4} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.6rem',
                        height: 16,
                        minWidth: 16,
                        padding: 0,
                      }
                    }}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              {open && <ListItemText primary={item.text} />}
            </StyledListItem>
          );
        })}
      </List>

      <Box sx={{ flexGrow: 1 }} />
      
      {open && (
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Tooltip title="Notifications">
              <IconButton 
                sx={{ 
                  color: alpha(theme.palette.common.white, 0.8),
                  backgroundColor: alpha(theme.palette.common.white, 0.05),
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                    color: theme.palette.common.white,
                  }
                }}
              >
                <Badge badgeContent={2} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton 
                sx={{ 
                  color: alpha(theme.palette.common.white, 0.8),
                  backgroundColor: alpha(theme.palette.common.white, 0.05),
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                    color: theme.palette.common.white,
                  }
                }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      <Box sx={{ p: open ? 2 : 1, mt: 1 }}>
        {open ? (
          <Button
            variant="contained"
            color="error"
            fullWidth
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              padding: '10px 16px',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(211, 47, 47, 0.3)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Logout
          </Button>
        ) : (
          <Tooltip title="Logout">
            <IconButton
              color="error"
              onClick={handleLogout}
              sx={{
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.2),
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </StyledDrawer>
  );
};

export default AdminSidebar; 