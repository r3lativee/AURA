const express = require('express');
const router = express.Router();
const Order = require('../../models/Order');
const User = require('../../models/User');
const { isAdmin } = require('../../middleware/auth');

// GET /api/admin/orders - Get all orders with pagination and filtering
router.get('/', isAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      search
    } = req.query;
    
    // Build query object
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Search by order ID or customer name
    if (search) {
      // Try to match the search query against order IDs
      const orderIdMatch = await Order.find({ 
        _id: { $regex: search, $options: 'i' } 
      });
      
      // Find users that match the search term
      const users = await User.find({ 
        name: { $regex: search, $options: 'i' } 
      });
      
      const userIds = users.map(user => user._id);
      
      // If we found matching orders or users, add them to the query
      if (orderIdMatch.length > 0 || userIds.length > 0) {
        query.$or = [
          { _id: { $regex: search, $options: 'i' } },
          { user: { $in: userIds } }
        ];
      }
    }
    
    // Define sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    // Get total count
    const totalOrders = await Order.countDocuments(query);
    
    res.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      totalOrders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// GET /api/admin/orders/stats - Get order statistics
router.get('/stats', isAdmin, async (req, res) => {
  try {
    // Get total orders
    const totalOrders = await Order.countDocuments({ isPaid: true });
    
    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    
    // Calculate profit (30% of revenue)
    const profit = totalRevenue * 0.3;
    
    // Get recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get orders by date (for charts)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const ordersByDate = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo },
          isPaid: true
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      totalOrders,
      ordersByStatus,
      totalRevenue,
      profit,
      recentOrders,
      ordersByDate
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Server error while fetching order stats' });
  }
});

// GET /api/admin/orders/:id - Get a specific order
router.get('/:id', isAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.productId', 'name price images');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error while fetching order' });
  }
});

// PATCH /api/admin/orders/:id/status - Update order status
router.patch('/:id/status', isAdmin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    
    // Build update object
    const updateData = {};
    
    // Add status if provided
    if (status) {
      // Validate status
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid order status' });
      }
      updateData.status = status;
    }
    
    // Add paymentStatus if provided
    if (paymentStatus) {
      // Validate payment status
      const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }
      updateData.paymentStatus = paymentStatus;
      
      // If payment status is "paid", also update isPaid field
      if (paymentStatus === 'paid' && !updateData.isPaid) {
        updateData.isPaid = true;
        updateData.paidAt = Date.now();
      }
    }
    
    // Add updateAt timestamp
    updateData.updatedAt = Date.now();
    
    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid update fields provided' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error while updating order status' });
  }
});

// GET /api/admin/reports/revenue - Get revenue report
router.get('/reports/revenue', isAdmin, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let dateFormat, startDate;
    const today = new Date();
    
    // Determine grouping and time range based on period
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 14); // Last 14 days
        break;
      case 'weekly':
        dateFormat = '%Y-%U'; // Year-Week
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 84); // Last 12 weeks
        break;
      case 'yearly':
        dateFormat = '%Y';
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 5); // Last 5 years
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 11); // Last 12 months
    }
    
    // Get revenue data grouped by period
    const revenueData = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          isPaid: true // Only include paid orders
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' }, // Use totalAmount field
          profit: { $sum: { $multiply: ['$totalAmount', 0.3] } }, // Estimated profit
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Transform data for charting
    const chartData = revenueData.map(item => ({
      name: item._id,
      revenue: item.revenue,
      profit: item.profit,
      orders: item.orders
    }));
    
    // Get revenue breakdown by category
    const categoryRevenue = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: { $nin: ['cancelled'] }
        } 
      },
      { $unwind: '$items' },
      { 
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productData'
        }
      },
      { $unwind: '$productData' },
      {
        $group: {
          _id: '$productData.category',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          sales: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
    
    res.json({ 
      revenueData: chartData,
      salesData: categoryRevenue.map(cat => ({
        category: cat._id,
        revenue: cat.revenue,
        sales: cat.sales
      }))
    });
  } catch (error) {
    console.error('Error generating revenue report:', error);
    res.status(500).json({ message: 'Server error while generating revenue report' });
  }
});

module.exports = router; 