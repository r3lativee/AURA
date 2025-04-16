const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTP, sendVerificationEmail } = require('../utils/email');

const router = express.Router();

// Add avatar collection at the top of the file
const avatars = [
  'https://i.imgur.com/3tVgsra.png', // Einstein cartoon
  'https://i.imgur.com/8igHtj1.png', // Sherlock Holmes cartoon
  'https://i.imgur.com/JYMqnOb.png', // Marie Curie cartoon
  'https://i.imgur.com/Q9qFt3P.png', // Nikola Tesla cartoon
  'https://i.imgur.com/vPMWRzm.png', // Ada Lovelace cartoon
  'https://i.imgur.com/7rLOZfa.png'  // Stephen Hawking cartoon
];

// Function to get a random avatar
const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * avatars.length);
  return avatars[randomIndex];
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store verification codes temporarily (in production, use Redis or similar)
const verificationCodes = new Map();

// Request OTP
router.post('/request-otp',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate and save OTP
      const otp = generateOTP();
      await OTP.findOneAndDelete({ email }); // Delete any existing OTP
      await OTP.create({ email, otp });

      // Send OTP via email
      const emailSent = await sendOTP(email, otp);
      if (!emailSent) {
        return res.status(500).json({ message: 'Failed to send OTP' });
      }

      res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
      console.error('Request OTP error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login route
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    try {
      console.log('Login attempt for email:', req.body.email);
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ 
          success: false,
          message: 'Invalid email or password format'
        });
      }

      const { email, password } = req.body;
      
      // Normalize email for consistent lookup
      const normalizedEmail = email.toLowerCase().trim();

      // Find user with exact email match
      const user = await User.findOne({ email: normalizedEmail });
      
      console.log('User found:', user ? 'Yes' : 'No');

      if (!user) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid email or password' 
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('Password match:', isMatch ? 'Yes' : 'No');
      
      if (!isMatch) {
        // Increment failed password attempts
        user.security = user.security || {};
        user.security.passwordAttempts = (user.security.passwordAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts
        if (user.security.passwordAttempts >= 5) {
          user.security.accountLocked = true;
        }
        
        await user.save();
        
        return res.status(400).json({ 
          success: false,
          message: 'Invalid email or password' 
        });
      }

      // Reset failed password attempts on successful login
      if (user.security && user.security.passwordAttempts > 0) {
        user.security.passwordAttempts = 0;
        user.security.accountLocked = false;
      }
      
      // Create security session data
      const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      
      // Update current session info
      user.security = user.security || {};
      user.security.lastLogin = new Date();
      
      // Store previous session if exists
      if (user.security.currentSession && user.security.currentSession.isActive) {
        const previousSession = { ...user.security.currentSession.toObject() };
        previousSession.logoutTime = new Date();
        previousSession.isActive = false;
        
        user.security.sessionHistory = user.security.sessionHistory || [];
        user.security.sessionHistory.unshift(previousSession);
        
        // Keep only last 10 sessions
        if (user.security.sessionHistory.length > 10) {
          user.security.sessionHistory = user.security.sessionHistory.slice(0, 10);
        }
      }
      
      // Set new current session
      user.security.currentSession = {
        ipAddress,
        userAgent,
        loginTime: new Date(),
        isActive: true
      };

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Check if user has a profile image, if not, assign a random one
      if (!user.profileImage) {
        user.profileImage = getRandomAvatar();
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          isAdmin: user.isAdmin 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful for user:', user._id);

      // Send response with complete user information (except password)
      res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          addresses: user.addresses || [],
          isAdmin: user.isAdmin || false,
          profileImage: user.profileImage || '',
          isVerified: user.isVerified || false,
          paymentMethods: user.paymentMethods || [],
          security: {
            lastLogin: user.security.lastLogin,
            accountCreated: user.security.accountCreated || user.createdAt,
            currentSession: {
              ipAddress: user.security.currentSession?.ipAddress,
              loginTime: user.security.currentSession?.loginTime
            }
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Server error during login' 
      });
    }
  }
);

// Register route to send OTP
router.post('/register-request', async (req, res, next) => {
  try {
    console.log('Register request received:', { ...req.body, password: '[REDACTED]' });
    
    const { name, email, password, phoneNumber } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }
    
    // Validate password strength (at least 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Validate phone number if provided
    if (phoneNumber) {
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(phoneNumber.replace(/[^0-9]/g, ''))) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please provide a valid phone number (10-15 digits)' 
        });
      }
    }
    
    // Simplify email check - just use lowercase email exact match
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      console.log('Registration failed: Email already exists');
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email already exists' 
      });
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Delete any existing OTP for this email
    await OTP.findOneAndDelete({ email: normalizedEmail });
    
    // Save OTP in database
    await OTP.create({ email: normalizedEmail, otp });
    
    // Send OTP via email
    const emailSent = await sendOTP(normalizedEmail, otp);
    
    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send verification code. Please try again.' 
      });
    }
    
    // Store the user data temporarily (excluding password)
    const userData = {
      name,
      email: normalizedEmail,
      phoneNumber: phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : ''
    };
    
    // Return success response with the email
    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email',
      email: normalizedEmail
    });
    
  } catch (error) {
    console.error('Registration request error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify OTP and complete registration
router.post('/register-verify', async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber, otp } = req.body;
    
    // Validate inputs
    if (!name || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Verify OTP
    const otpRecord = await OTP.findOne({ email: normalizedEmail });
    
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired or invalid. Please request a new code.'
      });
    }
    
    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // OTP is valid, create the user account
    
    // Assign a random avatar to the new user
    const profileImage = getRandomAvatar();
    
    // Create new user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get IP address and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Create security data
    const now = new Date();
    const securityData = {
      accountCreated: now,
      lastLogin: now,
      currentSession: {
        ipAddress,
        userAgent,
        loginTime: now,
        isActive: true
      },
      sessionHistory: [],
      passwordAttempts: 0,
      accountLocked: false
    };
    
    // Format phone number if provided
    const formattedPhoneNumber = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
    
    // Create user object
    const newUser = {
      name,
      email: normalizedEmail, // Always store email in lowercase
      password: hashedPassword,
      phoneNumber: formattedPhoneNumber,
      profileImage, // Add the random avatar
      isAdmin: false,
      isVerified: true, // Set to true since we've verified the email with OTP
      security: securityData
    };
    
    console.log('Creating new user with data:', { 
      ...newUser, 
      password: '[REDACTED]' 
    });
    
    const user = await User.create(newUser);
    
    // Remove the OTP record
    await OTP.findOneAndDelete({ email: normalizedEmail });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('User registered successfully:', user._id);
    
    // Return success response with token and user data
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        addresses: user.addresses || [],
        isAdmin: user.isAdmin || false,
        profileImage: user.profileImage || '',
        isVerified: user.isVerified || true,
        security: {
          accountCreated: user.security.accountCreated,
          lastLogin: user.security.lastLogin,
          currentSession: {
            ipAddress: user.security.currentSession?.ipAddress,
            loginTime: user.security.currentSession?.loginTime
          }
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle MongoDB duplicate key error as a fallback
    if (error.code === 11000) {
      console.error('Duplicate key error details:', error.keyPattern, error.keyValue);
      return res.status(400).json({
        success: false,
        message: 'Unable to create account. This email may already be registered.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Keep the original register route as a fallback but mark it as deprecated
router.post('/register', async (req, res, next) => {
  try {
    console.log('Register request received (DEPRECATED ROUTE):', { ...req.body, password: '[REDACTED]' });
    
    const { name, email, password } = req.body;
    
    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }
    
    // Validate password strength (at least 6 characters)
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }
    
    // Simplify email check - just use lowercase email exact match
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (existingUser) {
      console.log('Registration failed: Email already exists');
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email already exists' 
      });
    }
    
    // Assign a random avatar to the new user
    const profileImage = getRandomAvatar();
    
    // Create new user with hashed password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get IP address and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Create security data
    const now = new Date();
    const securityData = {
      accountCreated: now,
      lastLogin: now,
      currentSession: {
        ipAddress,
        userAgent,
        loginTime: now,
        isActive: true
      },
      sessionHistory: [],
      passwordAttempts: 0,
      accountLocked: false
    };
    
    // Create user object
    const newUser = {
      name,
      email: normalizedEmail, // Always store email in lowercase
      password: hashedPassword,
      profileImage, // Add the random avatar
      isAdmin: false,
      isVerified: false, // Not verified yet
      security: securityData
    };
    
    console.log('Creating new user with data (DEPRECATED ROUTE):', { 
      ...newUser, 
      password: '[REDACTED]' 
    });
    
    const user = await User.create(newUser);
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('User registered successfully (DEPRECATED ROUTE):', user._id);
    
    // Return success response with token and user data
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        addresses: user.addresses || [],
        isAdmin: user.isAdmin || false,
        profileImage: user.profileImage || '',
        isVerified: user.isVerified || false,
        security: {
          accountCreated: user.security.accountCreated,
          lastLogin: user.security.lastLogin,
          currentSession: {
            ipAddress: user.security.currentSession?.ipAddress,
            loginTime: user.security.currentSession?.loginTime
          }
        }
      }
    });
  } catch (error) {
    console.error('Registration error (DEPRECATED ROUTE):', error);
    
    // Handle MongoDB duplicate key error as a fallback
    if (error.code === 11000) {
      console.error('Duplicate key error details:', error.keyPattern, error.keyValue);
      return res.status(400).json({
        success: false,
        message: 'Unable to create account. This email may already be registered.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify Email
router.post('/verify-email',
  [
    body('userId').notEmpty(),
    body('verificationCode').isLength({ min: 6, max: 6 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, verificationCode } = req.body;

      // Check if verification code exists and is valid
      const storedData = verificationCodes.get(userId);
      if (!storedData) {
        return res.status(400).json({ message: 'Verification code expired. Please request a new one.' });
      }

      // Check if code is expired (10 minutes)
      if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
        verificationCodes.delete(userId);
        return res.status(400).json({ message: 'Verification code expired. Please request a new one.' });
      }

      // Verify code
      if (storedData.code !== verificationCode) {
        storedData.attempts += 1;
        if (storedData.attempts >= 3) {
          verificationCodes.delete(userId);
          return res.status(400).json({ message: 'Too many failed attempts. Please request a new code.' });
        }
        return res.status(400).json({ message: 'Invalid verification code.' });
      }

      // Update user verification status
      const user = await User.findByIdAndUpdate(
        userId,
        { isVerified: true },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Clear verification code
      verificationCodes.delete(userId);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      res.json({
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Resend verification code
router.post('/resend-verification',
  body('userId').notEmpty(),
  async (req, res) => {
    try {
      const { userId } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      // Generate new verification code
      const verificationCode = generateVerificationCode();
      verificationCodes.set(userId, {
        code: verificationCode,
        timestamp: Date.now(),
        attempts: 0,
      });

      // Send new verification email
      await sendVerificationEmail(user.email, verificationCode);

      res.json({ message: 'Verification code sent successfully' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization token required' 
      });
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded || !decoded.userId) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token content' 
        });
      }
      
      console.log('Getting current user with ID:', decoded.userId);
      
      // Find user by ID - safer than email lookup
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        console.log('User not found for ID:', decoded.userId);
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      
      // Ensure user has avatar
      if (!user.profileImage) {
        user.profileImage = getRandomAvatar();
        await user.save();
        console.log('Added random avatar for user:', decoded.userId);
      }
      
      console.log('Current user retrieved successfully');
      
      // Return user data with consistent format
      return res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          addresses: user.addresses || [],
          isAdmin: user.isAdmin || false,
          profileImage: user.profileImage || '',
          isVerified: user.isVerified || false
        }
      });
    } catch (error) {
      // Token validation error
      console.error('Token validation error:', error);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid or expired token' 
      });
    }
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Test route to check if an OTP exists for an email (for debugging)
router.get('/check-otp/:email', async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await OTP.findOne({ email: normalizedEmail });
    
    if (!otpRecord) {
      return res.status(404).json({
        success: false,
        message: 'No OTP found for this email',
        email: normalizedEmail
      });
    }
    
    // Don't expose the actual OTP in production!
    // This is only for debugging purposes
    res.json({
      success: true,
      message: 'OTP exists for this email',
      email: normalizedEmail,
      otp: process.env.NODE_ENV === 'development' ? otpRecord.otp : '******',
      createdAt: otpRecord.createdAt,
      expiresAt: new Date(otpRecord.createdAt.getTime() + 10 * 60 * 1000)
    });
  } catch (error) {
    console.error('Check OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Verify OTP (for both login and password reset)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // First check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if OTP exists
    const otpRecord = await OTP.findOne({ email: normalizedEmail });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Verification code expired or invalid. Please request a new code.'
      });
    }
    
    // Verify OTP
    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // OTP is valid
    res.json({
      success: true,
      message: 'Verification code verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Find the user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has a valid OTP record (they should have verified it already)
    const otpRecord = await OTP.findOne({ email: normalizedEmail });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first'
      });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password and reset security data
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    user.password = hashedPassword;
    
    // Reset security data
    user.security = user.security || {};
    user.security.passwordAttempts = 0;
    user.security.accountLocked = false;
    user.security.passwordResetAt = new Date();
    
    await user.save();
    
    // Delete OTP record
    await OTP.findOneAndDelete({ email: normalizedEmail });
    
    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 