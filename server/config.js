module.exports = {
  // MongoDB connection string
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura_db',
  
  // JWT secret for token generation
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  
  // Token expiration time
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Server port
  PORT: process.env.PORT || 5000,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CORS origin
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Razorpay API keys
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_VSdThjRMT7Nf1w',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'Dn8raOiweZVMId7L2yWcnoTj',
  
  // Email settings
  EMAIL_USER: process.env.EMAIL_USER || 'your-email@gmail.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'your-app-password',
  
  // Order settings
  DEFAULT_ORDER_STATUS: 'delivered', // Set default order status to delivered
  AUTO_MARK_PAID: true // Automatically mark orders as paid
}; 