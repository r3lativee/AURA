const express = require('express');
const Order = require('../models/Order');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

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

// Create new order
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      items,
      shippingAddress,
      paymentInfo,
      shippingCost,
      tax
    } = req.body;

    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      paymentInfo,
      shippingCost,
      tax,
      subtotal: items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });

    const savedOrder = await order.save();
    await savedOrder.populate('items.product', 'name price images');

    res.status(201).json(savedOrder);
  } catch (error) {
    next(error);
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

module.exports = router; 