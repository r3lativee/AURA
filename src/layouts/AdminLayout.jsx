import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <AdminSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { sm: `calc(100% - 240px)` },
          ml: '5px',
          background: 'linear-gradient(135deg, #121212 0%, #1e1e2d 100%)',
          minHeight: '100vh',
          borderRadius: '0 0 0 40px',
          boxShadow: 'inset 0px 0px 20px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
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
    </Box>
  );
};

export default AdminLayout; 