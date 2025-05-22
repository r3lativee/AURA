import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import AdminDock from '../components/admin/AdminDock';

const AdminLayout = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          pt: { xs: 10, md: 9 }, // Reduced top padding for the more compact dock
          width: '100%',
          background: 'linear-gradient(135deg, #121212 0%, #1e1e2d 100%)',
          minHeight: '100vh',
          boxShadow: 'inset 0px 0px 20px rgba(0, 0, 0, 0.2)',
          overflow: 'auto',
          transition: 'all 0.3s ease',
        }}
      >
        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: '100%',
            borderRadius: 2,
            p: { xs: 1, md: 2 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <AdminDock />
    </Box>
  );
};

export default AdminLayout; 