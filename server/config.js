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
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
}; 