const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const paymentMethodSchema = new mongoose.Schema({
  cardName: { type: String, required: true },
  cardNumber: { type: String, required: true },
  expiryDate: { type: String, required: true },
  cvv: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const securityInfoSchema = new mongoose.Schema({
  ipAddress: { type: String },
  userAgent: { type: String },
  loginTime: { type: Date, default: Date.now },
  logoutTime: { type: Date },
  isActive: { type: Boolean, default: true }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Validate phone number format (10-15 digits)
        return /^\d{10,15}$/.test(v.replace(/[^0-9]/g, ''));
      },
      message: props => `${props.value} is not a valid phone number! Phone number should be 10-15 digits.`
    },
    index: true // Add index for faster queries by phone number
  },
  profileImage: {
    type: String,
    default: '/default-avatar.jpg'
  },
  addresses: [addressSchema],
  paymentMethods: [paymentMethodSchema],
  security: {
    accountCreated: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    currentSession: securityInfoSchema,
    sessionHistory: [securityInfoSchema],
    passwordResetAt: { type: Date },
    passwordAttempts: { type: Number, default: 0 },
    accountLocked: { type: Boolean, default: false }
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users',
  versionKey: false
});

userSchema.index({ email: 1 }, { unique: true, name: 'email_unique_index' });
// Add phone number index with sparse option to allow nulls
userSchema.index({ phoneNumber: 1 }, { sparse: true, name: 'phone_number_index' });

userSchema.set('autoIndex', false);

// Method to format phone number before saving
userSchema.pre('save', async function(next) {
  // Handle payment methods
  if (this.isModified('paymentMethods')) {
    try {
      this.paymentMethods = this.paymentMethods.map(method => {
        if (method.cardNumber && method.cardNumber.length > 4) {
          const lastFour = method.cardNumber.slice(-4);
          method.cardNumber = `************${lastFour}`;
        }
        
        if (method.cvv) {
          method.cvv = '***';
        }
        
        return method;
      });
    } catch (error) {
      return next(error);
    }
  }
  
  // Format phone number by removing non-digit characters
  if (this.isModified('phoneNumber') && this.phoneNumber) {
    this.phoneNumber = this.phoneNumber.replace(/[^0-9]/g, '');
  }
  
  next();
});

module.exports = mongoose.model('User', userSchema); 