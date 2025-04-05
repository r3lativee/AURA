const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const readline = require('readline');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the User model
const User = require('../models/User');

// Import config
const config = require('../config');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully to:', config.MONGODB_URI))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to create an admin user
const createAdminUser = async (userData) => {
  try {
    // Check if admin user already exists with this email
    const existingUser = await User.findOne({ email: userData.email });
    
    if (existingUser) {
      // If user exists but is not admin, make them admin
      if (!existingUser.isAdmin) {
        existingUser.isAdmin = true;
        await existingUser.save();
        console.log(`\nExisting user ${existingUser.email} has been upgraded to admin status.\n`);
        return existingUser;
      } else {
        console.log(`\nAdmin user ${existingUser.email} already exists. No changes made.\n`);
        return existingUser;
      }
    }
    
    // Create a new admin user
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create new user with admin privileges
    const newAdmin = new User({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      profileImage: userData.profileImage || 'https://i.imgur.com/3tVgsra.png', // Default profile image
      isAdmin: true,
      isVerified: true
    });
    
    // Save the user to the database
    await newAdmin.save();
    
    console.log(`\nAdmin user '${newAdmin.name}' with email '${newAdmin.email}' created successfully!\n`);
    return newAdmin;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
};

// Default admin data if arguments are provided
let adminData = {
  name: process.argv[2],
  email: process.argv[3],
  password: process.argv[4],
  profileImage: process.argv[5]
};

// Function to prompt for admin information
const promptForAdminInfo = () => {
  return new Promise((resolve) => {
    console.log('\n=== Create Admin User ===\n');
    
    rl.question('Enter admin name: ', (name) => {
      rl.question('Enter admin email: ', (email) => {
        rl.question('Enter admin password (min 6 characters): ', (password) => {
          rl.question('Enter profile image URL (or press Enter for default): ', (profileImage) => {
            resolve({
              name,
              email: email.toLowerCase(),
              password,
              profileImage: profileImage || 'https://i.imgur.com/3tVgsra.png'
            });
          });
        });
      });
    });
  });
};

// Main function to run the script
const run = async () => {
  try {
    // If admin data is not provided as command line arguments, prompt for it
    if (!adminData.name || !adminData.email || !adminData.password) {
      adminData = await promptForAdminInfo();
    }
    
    // Validate input
    if (!adminData.name || !adminData.email || !adminData.password) {
      console.error('Error: Name, email, and password are required.');
      process.exit(1);
    }
    
    if (adminData.password.length < 6) {
      console.error('Error: Password must be at least 6 characters long.');
      process.exit(1);
    }
    
    // Create admin user
    await createAdminUser(adminData);
    
    // Close the readline interface and disconnect from MongoDB
    rl.close();
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Script error:', error);
    rl.close();
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
run();