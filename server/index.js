const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');
const fs = require('fs');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const uploadRoutes = require('./routes/upload');
const cartRoutes = require('./routes/cart');
const favoritesRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');

// Middleware
const { auth, adminAuth } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Configure environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set proper MIME type for .glb files
    if (path.extname(filePath) === '.glb') {
      res.setHeader('Content-Type', 'model/gltf-binary');
    }
  }
}));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', auth, orderRoutes);
app.use('/api/reviews', auth, reviewRoutes);
app.use('/api/upload', auth, uploadRoutes);
app.use('/api/cart', auth, cartRoutes);
app.use('/api/favorites', auth, favoritesRoutes);

// Admin Routes
app.use('/api/admin', auth, adminRoutes);

// Error handling
app.use(errorHandler);

// Add this function after the imports and before the app setup
const ensureUploadDirectoriesExist = () => {
  const dirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads', 'models'),
    path.join(__dirname, 'uploads', 'thumbnails')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  console.log('Upload directories verified');
};

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Ensure upload directories exist
    ensureUploadDirectoriesExist();
    
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`
🚀 Server is running on port ${PORT}
📱 Environment: ${process.env.NODE_ENV || 'development'}
🔗 MongoDB: Connected
📧 Email config: ${!!process.env.EMAIL_USER ? 'Loaded' : 'Not loaded'}
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer(); 