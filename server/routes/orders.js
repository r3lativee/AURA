const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const Razorpay = require('razorpay');
const config = require('../config');
const { sendOrderConfirmation } = require('../utils/emailService');
const { updateOrderStats } = require('../utils/adminStats');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET
});

// Get all orders (admin only)
router.get('/all', adminAuth, async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('items.product', 'name price images')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.productId', 'name price images')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
});

// Get single order
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.productId', 'name price images');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the user is authorized to view this order
    if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
});

// Create a new order
router.post('/', auth, async (req, res) => {
  try {
    console.log('Order creation request received:', {
      user: req.user._id,
      hasItems: !!req.body.items,
      itemCount: req.body.items ? req.body.items.length : 0,
      hasShippingAddress: !!req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      hasPaymentDetails: !!req.body.paymentDetails
    });
    
    const { items, shippingAddress, totalAmount, paymentMethod, paymentDetails } = req.body;
    
    if (!items || !items.length || !shippingAddress || !totalAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order information'
      });
    }
    
    // Verify payment details for Razorpay payments
    if (paymentMethod === 'Razorpay' && (!paymentDetails || !paymentDetails.razorpayPaymentId)) {
      console.log('Missing Razorpay payment details:', paymentDetails);
      return res.status(400).json({
        success: false,
        message: 'Missing payment details for Razorpay payment'
      });
    }
    
    // Format payment details
    const formattedPaymentDetails = {
      method: paymentMethod,
      ...(paymentDetails || {})
    };
    
    // Make sure items have all required fields
    const formattedItems = items.map(item => {
      console.log('Processing item on server:', item);
      if (!item.name) {
        console.warn('Item missing name:', item);
      }
      if (!item.price) {
        console.warn('Item missing price:', item);
      }
      if (!item.quantity) {
        console.warn('Item missing quantity:', item);
      }
      
      return {
        productId: item.productId || item._id,
        name: item.name || 'Product', // Provide fallback value
        price: typeof item.price === 'number' ? item.price : 0,
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        size: item.size || null,
        color: item.color || null
      };
    });
    
    // Create a new order
    const orderData = {
      user: req.user._id, // Use _id instead of userId
      items: formattedItems,
      shippingAddress,
      totalAmount,
      paymentMethod,
      paymentDetails: formattedPaymentDetails,
      // Always mark Razorpay orders as paid and delivered
      isPaid: true,
      paidAt: new Date(),
      status: config.DEFAULT_ORDER_STATUS || 'delivered',
      isDelivered: true,
      deliveredAt: new Date()
    };
    
    console.log('Creating order with data:', {
      ...orderData,
      items: `${orderData.items.length} items`,
      paymentDetails: '...' // Don't log sensitive data
    });
    
    const order = new Order(orderData);
    
    await order.save();
    
    console.log('Order created successfully with ID:', order._id);
    
    // Send order confirmation email
    try {
      // Get user data for the email
      const user = await User.findById(req.user._id);
      if (user && user.email) {
        // Send email asynchronously (don't await to avoid blocking)
        sendOrderConfirmation(order, user)
          .then(info => {
            if (info) {
              console.log(`Order confirmation email sent to ${user.email}`);
            }
          })
          .catch(err => {
            console.error('Error sending confirmation email:', err);
          });
      } else {
        console.warn('User email not found, skipping confirmation email');
      }
    } catch (emailError) {
      console.error('Error preparing confirmation email:', emailError);
      // Don't block order creation if email fails
    }
    
    // Update admin stats for revenue and orders
    try {
      // Update stats using our utility function
      await updateOrderStats(order);
    } catch (statsError) {
      console.error('Error updating admin stats:', statsError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id
    });
  } catch (error) {
    console.error('Order creation error details:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
});

// Update order status (admin only)
router.patch('/:id/status', adminAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    if (status === 'SHIPPED') {
      order.trackingNumber = req.body.trackingNumber;
      order.estimatedDelivery = req.body.estimatedDelivery;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// Cancel order
router.patch('/:id/cancel', auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to cancel this order
    if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if order can be cancelled
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      return res.status(400).json({ 
        message: 'Order cannot be cancelled in current status' 
      });
    }

    order.status = 'CANCELLED';
    order.cancellationReason = req.body.reason;

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
});

// Create Razorpay order
router.post('/razorpay', auth, async (req, res) => {
  try {
    console.log('Razorpay order creation request received:', req.body);
    const { amount, currency = 'INR', receipt, notes } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      console.log('Invalid order amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Invalid order amount'
      });
    }
    
    console.log('Razorpay configuration:', {
      key_id: config.RAZORPAY_KEY_ID ? 'Available' : 'Missing',
      key_secret: config.RAZORPAY_KEY_SECRET ? 'Available' : 'Missing'
    });
    
    // Create Razorpay order
    const options = {
      amount: parseInt(amount, 10), // Convert to integer - amount in smallest currency unit (paise for INR)
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {
        user_id: req.user._id.toString()
      },
      payment_capture: 1 // Auto-capture payment
    };
    
    console.log('Creating Razorpay order with options:', {
      ...options,
      notes: '...' // Hide detailed notes
    });
    
    try {
      const order = await new Promise((resolve, reject) => {
        razorpay.orders.create(options, (err, order) => {
          if (err) {
            console.error('Razorpay order creation error details:', err);
            reject(err);
          } else {
            resolve(order);
          }
        });
      });
      
      console.log('Razorpay order created successfully:', order);
      
      res.json({
        success: true,
        id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (razorpayError) {
      console.error('Razorpay order creation error:', razorpayError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: razorpayError.message
      });
    }
  } catch (error) {
    console.error('Razorpay route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment order'
    });
  }
});

// Verify Razorpay payment
router.post('/razorpay/verify', auth, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderData // This should contain order details
    } = req.body;
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }
    
    // Get the secret key
    const secret = config.RAZORPAY_KEY_SECRET;
    
    // Verify signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');
    
    if (generatedSignature === razorpay_signature) {
      // Payment is valid
      // If we have order data, create the order with payment marked as complete
      if (orderData) {
        try {
          // Format the order data
          const formattedData = {
            ...orderData,
            paymentMethod: 'Razorpay',
            paymentDetails: {
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
              razorpaySignature: razorpay_signature
            },
            // Mark the order as paid
            isPaid: true,
            paidAt: new Date(),
            paymentStatus: 'paid',
            status: config.DEFAULT_ORDER_STATUS || 'processing',
            // For immediate delivery items
            isDelivered: true,
            deliveredAt: new Date()
          };
          
          // Create the order
          const order = new Order(formattedData);
          await order.save();
          
          // Update admin stats
          await updateOrderStats(order);
          
          // Send email confirmation
          try {
            const user = await User.findById(req.user._id);
            if (user && user.email) {
              sendOrderConfirmation(order, user)
                .then(() => console.log('Order confirmation email sent'))
                .catch(err => console.error('Email sending error:', err));
            }
          } catch (emailError) {
            console.error('Error preparing email:', emailError);
          }
          
          return res.json({
            success: true,
            message: 'Payment verified and order created successfully',
            orderId: order._id
          });
        } catch (orderError) {
          console.error('Error creating order after payment:', orderError);
          return res.status(500).json({
            success: true, // Payment was still successful
            message: 'Payment verified but order creation failed',
            error: orderError.message
          });
        }
      } else {
        // Just payment verification
        res.json({
          success: true,
          message: 'Payment verified successfully'
        });
      }
    } else {
      // Payment verification failed
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying payment'
    });
  }
});

module.exports = router; 