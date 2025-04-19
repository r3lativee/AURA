import axios from 'axios';

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // Increase timeout to 20 seconds
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    // Log request for debugging (you can remove this in production)
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, 
                config.data ? { ...config.data, password: config.data.password ? '[REDACTED]' : undefined } : '');
    
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Log request error
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    // Log response for debugging (you can remove this in production)
    console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  async (error) => {
    // Get original request
    const originalRequest = error.config;
    
    // If the error is a 401 (Unauthorized) and we're not already refreshing
    if (error.response?.status === 401) {
      console.log('401 error detected, logging out user');
      
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // If we're in the browser, redirect to login page
      if (typeof window !== 'undefined') {
        // Save the current URL to redirect back after login
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        
        window.location.href = '/login';
      }
    }
    
    // Log response error
    console.error('API Response Error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      message: error.response?.data?.message || error.message
    });
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  
  register: (userData) => {
    // Validate required fields before sending to server
    if (!userData.name || !userData.email || !userData.password) {
      return Promise.reject(new Error('Please provide all required fields'));
    }
    
    // Ensure email is lowercase to match server expectations
    const sanitizedData = {
      ...userData,
      email: userData.email.toLowerCase()
    };
    
    console.log('API Service: Sending registration request to /auth/register with data:', 
                { ...sanitizedData, password: '[REDACTED]' });
                
    // Return the API call promise
    return api.post('/auth/register', sanitizedData);
  },
  
  // New methods for OTP-based registration
  registerRequest: (userData) => {
    // Validate required fields before sending to server
    if (!userData.name || !userData.email || !userData.password) {
      return Promise.reject(new Error('Please provide all required fields'));
    }
    
    // Ensure email is lowercase to match server expectations
    const sanitizedData = {
      ...userData,
      email: userData.email.toLowerCase()
    };
    
    // Format phone number if provided
    if (userData.phoneNumber) {
      sanitizedData.phoneNumber = userData.phoneNumber.replace(/[^0-9]/g, '');
    }
    
    console.log('API Service: Sending OTP registration request to /auth/register-request with data:', 
                { ...sanitizedData, password: '[REDACTED]' });
                
    // Return the API call promise
    return api.post('/auth/register-request', sanitizedData);
  },
  
  registerVerify: (userData, otp) => {
    // Validate required fields before sending to server
    if (!userData.name || !userData.email || !userData.password || !otp) {
      return Promise.reject(new Error('Please provide all required fields including verification code'));
    }
    
    // Ensure email is lowercase to match server expectations
    const sanitizedData = {
      ...userData,
      email: userData.email.toLowerCase(),
      otp
    };
    
    // Format phone number if provided
    if (userData.phoneNumber) {
      sanitizedData.phoneNumber = userData.phoneNumber.replace(/[^0-9]/g, '');
    }
    
    console.log('API Service: Verifying OTP and completing registration:', 
                { ...sanitizedData, password: '[REDACTED]', otp });
                
    // Return the API call promise
    return api.post('/auth/register-verify', sanitizedData);
  },
  
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => {
    console.log('API Service: Updating profile with data:', data);
    
    return new Promise((resolve, reject) => {
      // Wrap the API call in a promise with a timeout 
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout - server may be unavailable'));
      }, 15000); // 15 second timeout
      
      api.patch('/users/profile', data)
        .then(response => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          
          // Check if it's a network error
          if (error.message && error.message.includes('Network Error')) {
            reject(new Error('Network connection error. Please check your internet connection.'));
            return;
          }
          
          // Other errors
          reject(error);
        });
    });
  },
  uploadProfileImage: (file) => {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('profileImage', file);
    
    console.log('API Service: Uploading profile image');
    
    // When using FormData, don't set Content-Type as it will be set automatically with the boundary
    return api.post('/users/profile/image', formData, {
      headers: {
        // Let browser set the Content-Type with boundary for FormData
        'Content-Type': undefined
      }
    });
  },
  deleteProfileImage: () => {
    console.log('API Service: Deleting profile image');
    return api.delete('/users/profile/image');
  },
  getStats: async () => {
    try {
      const response = await api.get('/admin/users/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      // Return a default structure to prevent UI errors
      return {
        data: {
          totalUsers: 0,
          newUsers: 0,
          activeUsers: 0
        }
      };
    }
  },
  // Admin user management
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  // Payment methods
  addPaymentMethod: (data) => api.post('/users/payment-methods', data),
  getPaymentMethods: () => api.get('/users/payment-methods'),
  deletePaymentMethod: (id) => api.delete(`/users/payment-methods/${id}`),
  // Security info
  getSecurityInfo: () => api.get('/users/security'),
  logoutSession: (sessionId) => api.post('/auth/logout', { sessionId }),
};

// Products API
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }).then(res => {
    // Ensure we have a consistent response format
    if (Array.isArray(res.data)) {
      return {
        ...res,
        data: res.data
      };
    } else if (res.data && typeof res.data === 'object') {
      // Return the original response with data structure validation
      return {
        ...res,
        data: {
          products: Array.isArray(res.data.products) ? res.data.products : [],
          totalPages: res.data.totalPages || 1,
          currentPage: res.data.currentPage || 1
        }
      };
    } else {
      // Handle unexpected response by returning empty products array
      console.warn('Unexpected API response format:', res.data);
      return {
        ...res,
        data: []
      };
    }
  }).catch(error => {
    console.error('Products API error:', error);
    throw error;
  }),
  getAllAdmin: () => api.get('/admin/products').then(res => ({
    ...res,
    data: Array.isArray(res.data) ? res.data : []
  })),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  delete: (id) => api.delete(`/admin/products/${id}`),
  getStats: async () => {
    try {
      const response = await api.get('/admin/products/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch product stats:', error);
      // Return a default structure to prevent UI errors
      return {
        data: {
          totalProducts: 0,
          outOfStock: 0,
          lowStock: 0
        }
      };
    }
  },
  getTopSelling: async () => {
    try {
      const response = await api.get('/admin/products/top-selling');
      return response;
    } catch (error) {
      console.error('Failed to fetch top selling products:', error);
      // Return a default structure to prevent UI errors
      return {
        data: {
          products: []
        }
      };
    }
  },
  getLowStock: async () => {
    try {
      const response = await api.get('/admin/products/low-stock');
      return response;
    } catch (error) {
      console.error('Failed to fetch low stock products:', error);
      // Return a default structure to prevent UI errors
      return {
        data: {
          products: []
        }
      };
    }
  },
};

// Cart API
export const cartAPI = {
  get: () => api.get('/cart'),
  addToCart: (productId, quantity = 1, size = null, color = null) => 
    api.post('/cart/items', { productId, quantity, size, color }),
  updateCartItem: (itemId, quantity) => 
    api.patch(`/cart/items/${itemId}`, { quantity }),
  removeFromCart: (itemId) => 
    api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
};

// Favorites API
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  add: (productId) => api.post(`/favorites/${productId}`),
  remove: (productId) => api.delete(`/favorites/${productId}`),
};

// Reviews API
export const reviewsAPI = {
  // Get reviews for a product
  getByProduct: async (productId) => {
    try {
      return await api.get(`/reviews/product/${productId}`);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      throw error;
    }
  },

  // Get user's reviews
  getUserReviews: async () => {
    try {
      return await api.get('/reviews/my-reviews');
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      throw error;
    }
  },

  // Create a review
  create: async (productId, reviewData) => {
    try {
      // Format the data for the backend
      const formattedData = { 
        productId, 
        ...reviewData 
      };
      
      const response = await api.post('/reviews', formattedData);
      return response;
    } catch (error) {
      console.error('Error creating review:', error);
      // Check if the review was actually saved despite the error
      if (error.message && error.message.includes('populate')) {
        console.log('Review may have been saved but had a population error');
        // Return success indication to prevent retrying a potentially successful operation
        return { data: { success: true, message: 'Review submitted but encountered a display error' } };
      }
      throw error;
    }
  },

  // Update a review
  update: async (reviewId, reviewData) => {
    try {
      return await api.patch(`/reviews/${reviewId}`, reviewData);
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  },

  // Delete a review
  delete: async (reviewId) => {
    try {
      return await api.delete(`/reviews/${reviewId}`);
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  },

  likeReview: (reviewId) => api.post(`/reviews/${reviewId}/like`),
  unlikeReview: (reviewId) => api.delete(`/reviews/${reviewId}/like`),
  addReply: (reviewId, comment) => api.post(`/reviews/${reviewId}/reply`, { comment }),
};

// Orders API
export const ordersAPI = {
  create: (orderData) => api.post('/orders', orderData),
  getAll: () => api.get('/orders'),
  getOne: (id) => api.get(`/orders/${id}`),
  getStats: async () => {
    try {
      const response = await api.get('/admin/orders/stats');
      return response;
    } catch (error) {
      console.error('Failed to fetch order stats:', error);
      // Return a default structure to prevent UI errors
      return {
        data: {
          totalOrders: 0,
          totalRevenue: 0,
          recentOrders: []
        }
      };
    }
  },
  // Admin orders management
  getAllOrders: async (params) => {
    try {
      const response = await api.get('/admin/orders', { params });
      return response;
    } catch (error) {
      console.error('Failed to fetch all orders:', error);
      // Return a default structure to prevent UI errors
      return {
        data: []
      };
    }
  },
  updateOrderStatus: (orderId, data) => api.patch(`/admin/orders/${orderId}/status`, data),
  updateStatus: (orderId, data) => api.patch(`/admin/orders/${orderId}`, data), // Backward compatibility
  getRevenueReport: async (period = 'monthly') => {
    try {
      const response = await api.get(`/admin/reports/revenue?period=${period}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch ${period} revenue report:`, error);
      // Return a default structure to prevent UI errors
      return {
        data: {
          revenueData: [],
          salesData: []
        }
      };
    }
  },
  getSalesReport: (period = 'monthly') => api.get(`/admin/reports/sales?period=${period}`),
  createRazorpayOrder: (orderData) => api.post('/orders/razorpay', orderData),
  verifyRazorpayPayment: (paymentData) => api.post('/orders/razorpay/verify', paymentData),
};

export default api; 