const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use a consistent database name and ensure it's connecting to the IP address instead of hostname
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura_db';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Connect to MongoDB
    await mongoose.connect(uri, options);

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully to:', uri);
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Handle Node.js process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB; 