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

userSchema.set('autoIndex', false);

userSchema.pre('save', async function(next) {
  if (!this.isModified('paymentMethods')) return next();
  
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
    
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema); 