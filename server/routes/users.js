const express = require('express');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname);
    // Use user ID in filename to make it unique and easy to find
    cb(null, 'profile-' + req.user._id + '-' + Date.now() + fileExt);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Get user profile
router.get('/profile', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/profile', auth, async (req, res) => {
  try {
    console.log("Profile update request received:", {
      userId: req.user._id,
      body: { 
        ...req.body, 
        password: req.body.password ? '[REDACTED]' : undefined,
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        hasAddress: !!req.body.address 
      }
    });
    
    const { name, phoneNumber, address } = req.body;
    const updates = {};

    // Basic profile updates
    if (name) updates.name = name;
    if (phoneNumber !== undefined) {
      updates.phoneNumber = phoneNumber;
      console.log(`Updating phoneNumber to: "${phoneNumber}"`);
    }

    // Handle address update
    if (address) {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        console.log(`User not found: ${req.user._id}`);
        return res.status(404).json({ 
          success: false,
          message: 'User not found'
        });
      }
      
      // Validate required address fields
      const requiredFields = ['street', 'city', 'state', 'pincode', 'country'];
      const missingFields = requiredFields.filter(field => !address[field]);
      
      if (missingFields.length > 0) {
        console.log(`Missing address fields: ${missingFields.join(', ')}`);
        return res.status(400).json({ 
          success: false,
          message: `Address fields required: ${missingFields.join(', ')}`
        });
      }

      // Initialize addresses array if it doesn't exist
      if (!user.addresses) {
        user.addresses = [];
      }

      // If this is marked as default or first address, handle default flags
      if (address.isDefault || user.addresses.length === 0) {
        // Unmark any existing default addresses
        user.addresses.forEach(addr => {
          addr.isDefault = false;
        });
        
        // Mark this address as default
        address.isDefault = true;
      }

      // Add the new address
      user.addresses.push(address);
      
      try {
        // Save the updated user
        await user.save();
        
        // Return user data in a consistent format
        const userData = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          addresses: user.addresses,
          profileImage: user.profileImage,
          isAdmin: user.isAdmin
        };
        
        console.log(`Profile with address updated successfully for user: ${user._id}`);
        
        return res.json({
          success: true,
          message: 'Profile updated successfully',
          user: userData
        });
      } catch (saveError) {
        console.error(`Error saving user with new address: ${saveError.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to save profile updates',
          error: saveError.message
        });
      }
    }

    // If just updating basic info without address
    try {
      console.log('Updating user with data:', updates);
      
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!updatedUser) {
        console.log(`User not found for update: ${req.user._id}`);
        return res.status(404).json({ 
          success: false,
          message: 'User not found'
        });
      }
      
      console.log(`Basic profile updated successfully for user: ${updatedUser._id}`, {
        name: updatedUser.name,
        phoneNumber: updatedUser.phoneNumber
      });
      
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (updateError) {
      console.error(`Error updating user basic info: ${updateError.message}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: updateError.message
      });
    }
  } catch (error) {
    console.error(`Unexpected error in profile update: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message
    });
  }
});

// Change password
router.patch('/change-password', auth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Add or update address
router.post('/address', auth, async (req, res, next) => {
  try {
    const address = req.body;
    const user = await User.findById(req.user._id);

    // Validate required fields
    const requiredFields = ['street', 'city', 'state', 'pincode', 'country'];
    for (const field of requiredFields) {
      if (!address[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // If this is marked as default, unmark any existing default
    if (address.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // If this is the first address, make it default
    if (user.addresses.length === 0) {
      address.isDefault = true;
    }

    // Add the new address
    user.addresses.push(address);
    
    // Save the updated user
    await user.save();
    
    res.status(201).json({
      message: 'Address added successfully',
      address: user.addresses[user.addresses.length - 1]
    });
  } catch (error) {
    next(error);
  }
});

// Update an address
router.patch('/address/:id', auth, async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const updateData = req.body;
    const user = await User.findById(req.user._id);

    // Find the address to update
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Update the address fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id') { // Don't update the ID
        user.addresses[addressIndex][key] = updateData[key];
      }
    });

    // If this is marked as default, unmark any existing default
    if (updateData.isDefault) {
      user.addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }

    // Save the updated user
    await user.save();
    
    res.json({
      message: 'Address updated successfully',
      address: user.addresses[addressIndex]
    });
  } catch (error) {
    next(error);
  }
});

// Delete an address
router.delete('/address/:id', auth, async (req, res, next) => {
  try {
    const addressId = req.params.id;
    const user = await User.findById(req.user._id);

    // Find the address index
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Check if it's the default address
    const isDefault = user.addresses[addressIndex].isDefault;

    // Remove the address
    user.addresses.splice(addressIndex, 1);

    // If we removed a default address and there are other addresses, make the first one default
    if (isDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    // Save the updated user
    await user.save();
    
    res.json({
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Admin Routes

// Get all users (admin only)
router.get('/', adminAuth, async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID (admin only)
router.get('/:id', adminAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.patch('/:id', adminAuth, async (req, res, next) => {
  try {
    const updates = {};
    const allowedUpdates = ['name', 'email', 'isAdmin', 'phoneNumber'];
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', adminAuth, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add or update payment method route
router.post('/payment-methods', auth, async (req, res) => {
  try {
    const { cardName, cardNumber, expiryDate, cvv, isDefault } = req.body;
    
    // Validate required fields
    if (!cardName || !cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all payment details' 
      });
    }
    
    // Validate card number format
    const cardNumberRegex = /^\d{16}$/;
    if (!cardNumberRegex.test(cardNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 16-digit card number' 
      });
    }
    
    // Validate expiry date format (MM/YY)
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryRegex.test(expiryDate)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid expiry date (MM/YY)' 
      });
    }
    
    // Validate CVV format (3-4 digits)
    const cvvRegex = /^\d{3,4}$/;
    if (!cvvRegex.test(cvv)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid CVV (3-4 digits)' 
      });
    }
    
    // Find user by ID
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Initialize payment methods array if it doesn't exist
    if (!user.paymentMethods) {
      user.paymentMethods = [];
    }
    
    // Create new payment method
    const newPaymentMethod = {
      cardName,
      cardNumber: cardNumber.replace(/\s/g, ''), // Remove spaces
      expiryDate,
      cvv,
      isDefault: isDefault || false,
      createdAt: new Date()
    };
    
    // If new card is set as default, update existing cards
    if (newPaymentMethod.isDefault) {
      user.paymentMethods.forEach(method => {
        method.isDefault = false;
      });
    } else if (user.paymentMethods.length === 0) {
      // If this is the first card, make it default
      newPaymentMethod.isDefault = true;
    }
    
    // Add the new payment method
    user.paymentMethods.push(newPaymentMethod);
    
    // Save user
    await user.save();
    
    // Return masked card information for security
    const maskedPaymentMethods = user.paymentMethods.map(method => ({
      _id: method._id,
      cardName: method.cardName,
      // Only show last 4 digits of card number
      cardNumber: `**** **** **** ${method.cardNumber.slice(-4)}`,
      expiryDate: method.expiryDate,
      isDefault: method.isDefault,
      createdAt: method.createdAt
    }));
    
    res.status(201).json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethods: maskedPaymentMethods
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while adding payment method' 
    });
  }
});

// Get all payment methods
router.get('/payment-methods', auth, async (req, res) => {
  try {
    // Find user by ID
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Return masked card information for security
    const maskedPaymentMethods = user.paymentMethods ? user.paymentMethods.map(method => ({
      _id: method._id,
      cardName: method.cardName,
      // Only show last 4 digits of card number
      cardNumber: `**** **** **** ${method.cardNumber.slice(-4)}`,
      expiryDate: method.expiryDate,
      isDefault: method.isDefault,
      createdAt: method.createdAt
    })) : [];
    
    res.json({
      success: true,
      paymentMethods: maskedPaymentMethods
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching payment methods' 
    });
  }
});

// Delete payment method route
router.delete('/payment-methods/:id', auth, async (req, res) => {
  try {
    const paymentMethodId = req.params.id;
    
    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check if payment method exists
    const paymentMethodIndex = user.paymentMethods.findIndex(
      method => method._id.toString() === paymentMethodId
    );
    
    if (paymentMethodIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment method not found' 
      });
    }
    
    // Check if it's the default payment method
    const isDefault = user.paymentMethods[paymentMethodIndex].isDefault;
    
    // Remove the payment method
    user.paymentMethods.splice(paymentMethodIndex, 1);
    
    // If removed method was default and there are other methods, set a new default
    if (isDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0].isDefault = true;
    }
    
    // Save updated user
    await user.save();
    
    // Return masked card information
    const maskedPaymentMethods = user.paymentMethods.map(method => ({
      _id: method._id,
      cardName: method.cardName,
      cardNumber: `**** **** **** ${method.cardNumber.slice(-4)}`,
      expiryDate: method.expiryDate,
      isDefault: method.isDefault,
      createdAt: method.createdAt
    }));
    
    res.json({
      success: true,
      message: 'Payment method deleted successfully',
      paymentMethods: maskedPaymentMethods
    });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting payment method' 
    });
  }
});

// Upload profile image
router.post('/profile/image', auth, upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }
    
    // Get the file path relative to the server root
    const relativeFilePath = '/uploads/profiles/' + req.file.filename;
    
    console.log(`Uploading profile image for user: ${req.user._id}`, {
      originalName: req.file.originalname,
      savedAs: req.file.filename,
      path: relativeFilePath
    });
    
    // Update user profile with the new image path
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profileImage: relativeFilePath } },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      // Clean up the uploaded file if user not found
      const filePath = path.join(__dirname, '..', relativeFilePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`Profile image updated successfully for user: ${updatedUser._id}`);
    
    return res.json({
      success: true,
      message: 'Profile image updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error(`Error uploading profile image: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during image upload',
      error: error.message
    });
  }
});

// Delete profile image
router.delete('/profile/image', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Skip if no profile image exists
    if (!user.profileImage || user.profileImage.includes('/default-avatar.jpg')) {
      return res.status(400).json({
        success: false,
        message: 'No custom profile image to delete'
      });
    }
    
    // Store old file path for cleanup
    const oldFilePath = path.join(__dirname, '..', user.profileImage);
    
    // Reset profile image to default
    user.profileImage = '/default-avatar.jpg';
    await user.save();
    
    // Try to delete the old file if it exists
    try {
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`Deleted old profile image file: ${oldFilePath}`);
      }
    } catch (fileError) {
      // Just log file deletion errors but continue
      console.error(`Error deleting profile image file: ${fileError.message}`);
    }
    
    return res.json({
      success: true,
      message: 'Profile image deleted successfully',
      user: user
    });
  } catch (error) {
    console.error(`Error deleting profile image: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error during image deletion',
      error: error.message
    });
  }
});

module.exports = router; 