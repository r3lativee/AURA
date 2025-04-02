const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const { isAdmin } = require('../../middleware/auth');

// GET /api/admin/reports/revenue - Get revenue reports
router.get('/revenue', isAdmin, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let dateFormat, groupBy, limit;
    
    // Configure aggregation based on requested period
    switch (period) {
      case 'daily':
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        groupBy = { day: { $dayOfMonth: '$createdAt' }, month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
        limit = 30; // Last 30 days
        break;
      case 'weekly':
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
        groupBy = { week: { $week: '$createdAt' }, year: { $year: '$createdAt' } };
        limit = 12; // Last 12 weeks
        break;
      case 'yearly':
        dateFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
        groupBy = { year: { $year: '$createdAt' } };
        limit = 5; // Last 5 years
        break;
      default: // monthly
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        groupBy = { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
        limit = 12; // Last 12 months
    }
    
    // Get revenue data
    const revenueData = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
      { $group: { 
        _id: groupBy, 
        date: { $first: dateFormat },
        revenue: { $sum: '$total' },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
      { $limit: limit },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } },
      { $project: { 
        _id: 0, 
        name: '$date', 
        revenue: 1,
        profit: { $multiply: ['$revenue', 0.3] }, // Estimating profit as 30% of revenue
        orders: '$count'
      }}
    ]);
    
    // Get sales by category
    const salesData = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo'
      }},
      { $unwind: '$productInfo' },
      { $group: { 
        _id: '$productInfo.category', 
        sales: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $project: { 
        _id: 0, 
        category: '$_id', 
        sales: 1,
        revenue: 1
      }}
    ]);
    
    res.json({ 
      revenueData,
      salesData
    });
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ message: 'Server error while fetching revenue report' });
  }
});

// GET /api/admin/reports/sales - Get sales reports
router.get('/sales', isAdmin, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Get sales by product
    const salesByProduct = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'productInfo'
      }},
      { $unwind: '$productInfo' },
      { $group: { 
        _id: '$items.product', 
        name: { $first: '$productInfo.name' },
        category: { $first: '$productInfo.category' },
        sales: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }},
      { $sort: { sales: -1 } },
      { $limit: 20 },
      { $project: { 
        _id: 0, 
        id: '$_id',
        name: 1,
        category: 1,
        sales: 1,
        revenue: 1
      }}
    ]);
    
    res.json({ 
      salesByProduct
    });
  } catch (error) {
    console.error('Error fetching sales report:', error);
    res.status(500).json({ message: 'Server error while fetching sales report' });
  }
});

module.exports = router; 