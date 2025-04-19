const express = require('express');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');
const Razorpay = require('razorpay');

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_M1QTLqpvgMzQNE',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_test_secret',
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
      .populate('items.product', 'name price images')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// Get single order
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price images');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the user is authorized to view this order
    if (!req.user.isAdmin && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Create a new order
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount, paymentMethod, paymentDetails } = req.body;
    
    if (!items || !items.length || !shippingAddress || !totalAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Missing required order information'
      });
    }
    
    // Create a new order
    const order = new Order({
      user: req.user.userId,
      items,
      shippingAddress,
      totalAmount,
      paymentMethod,
      paymentDetails,
      // Set payment status based on payment method
      isPaid: paymentMethod === 'Razorpay' && paymentDetails?.razorpayPaymentId ? true : false,
      paidAt: paymentMethod === 'Razorpay' && paymentDetails?.razorpayPaymentId ? new Date() : null
    });
    
    await order.save();
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      orderId: order._id
    });
  } catch (error) {
    console.error('Order creation error:', error);
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
    const { amount, currency, receipt, notes } = req.body;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order amount'
      });
    }
    
    // Create Razorpay order
    const options = {
      amount: Math.round(amount), // amount in smallest currency unit (paise for INR)
      currency: currency || 'INR',
      receipt: receipt,
      notes: notes,
      payment_capture: 1 // Auto-capture payment
    };
    
    razorpay.orders.create(options, function(err, order) {
      if (err) {
        console.error('Razorpay order creation error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment order',
          error: err.message
        });
      }
      
      res.json({
        success: true,
        id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    });
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
      razorpay_signature 
    } = req.body;
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }
    
    // Get the secret key
    const secret = process.env.RAZORPAY_KEY_SECRET || 'your_test_secret';
    
    // Verify signature
    const crypto = require('crypto');
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');
    
    if (generatedSignature === razorpay_signature) {
      // Payment is valid
      res.json({
        success: true,
        message: 'Payment verified successfully'
      });
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