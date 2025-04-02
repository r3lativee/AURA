import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastOverlay = () => {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{
        top: '80px', // Position below navbar
        zIndex: 9999,
      }}
      toastOptions={{
        // Default options for all toasts
        duration: 3000,
        style: {
          background: '#fff',
          color: '#333',
          border: '1px solid #eaeaea',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '14px',
          borderRadius: '8px',
          maxWidth: '350px',
          fontWeight: 500,
        },
        // Custom toast types
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#4CAF50',
            secondary: '#FFFFFF',
          },
          style: {
            background: '#f0f9f1',
            border: '1px solid #c6e6c8',
          }
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#E53935',
            secondary: '#FFFFFF',
          },
          style: {
            background: '#feeceb',
            border: '1px solid #f5c9c7',
          }
        },
        loading: {
          duration: Infinity,
          style: {
            background: '#f5f7ff',
            border: '1px solid #d1d9f0',
          }
        },
      }}
    />
  );
};

export default ToastOverlay; 