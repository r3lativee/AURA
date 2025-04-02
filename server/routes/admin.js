const express = require('express');
const router = express.Router();
const ordersRoutes = require('./admin/orders');
const productsRoutes = require('./admin/products');
const usersRoutes = require('./admin/users');
const reportsRoutes = require('./admin/reports');
const { isAdmin } = require('../middleware/auth');

// Check if user is admin for all routes
router.use(isAdmin);

// Admin routes
router.use('/orders', ordersRoutes);
router.use('/products', productsRoutes);
router.use('/users', usersRoutes);
router.use('/reports', reportsRoutes);

module.exports = router; 