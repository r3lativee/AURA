/**
 * Utility functions for tracking and updating admin statistics
 */

const Order = require('../models/Order');
const mongoose = require('mongoose');

/**
 * Update revenue and sales statistics after a new order
 * @param {Object} order - The newly created order
 * @returns {Promise} - Result of stats update
 */
const updateOrderStats = async (order) => {
  try {
    console.log(`Updating admin stats for order ${order._id}`);
    
    // Get total revenue from all completed orders
    const totalRevenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    // Get total number of orders
    const totalOrders = await Order.countDocuments({ isPaid: true });
    
    // Get daily sales stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dailySales = await Order.aggregate([
      { 
        $match: { 
          isPaid: true,
          createdAt: { $gte: today, $lt: tomorrow }
        } 
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    // Update monthly revenue data for charts
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    // Get monthly data
    const monthlyData = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: new Date(today.getFullYear(), 0, 1) } // From start of year
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      // Add a projection stage to calculate profit as 30% of revenue
      {
        $project: {
          _id: 1,
          revenue: 1,
          orders: 1,
          profit: { $multiply: ['$revenue', 0.3] } // Calculate profit as 30% of revenue
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Log stats for debugging
    console.log('Admin Stats Updated:');
    console.log('- Total Revenue:', totalRevenue.length ? totalRevenue[0].total : 0);
    console.log('- Total Orders:', totalOrders);
    console.log('- Daily Sales:', dailySales.length ? dailySales[0].total : 0);
    console.log('- Monthly Data:', JSON.stringify(monthlyData));
    
    return {
      totalRevenue: totalRevenue.length ? totalRevenue[0].total : 0,
      totalOrders,
      dailySales: dailySales.length ? dailySales[0].total : 0,
      monthlyData
    };
  } catch (error) {
    console.error('Error updating admin stats:', error);
    throw error;
  }
};

module.exports = {
  updateOrderStats
}; 