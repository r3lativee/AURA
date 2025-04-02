const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const { isAdmin } = require('../../middleware/auth');

// GET /api/admin/products - Get all products
router.get('/', isAdmin, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// POST /api/admin/products - Create a new product
router.post('/', isAdmin, async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ 
      message: 'Server error while creating product',
      error: error.message
    });
  }
});

// PUT /api/admin/products/:id - Update a product
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ 
      message: 'Server error while updating product',
      error: error.message
    });
  }
});

// DELETE /api/admin/products/:id - Delete a product
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// GET /api/admin/products/stats - Get product statistics
router.get('/stats', isAdmin, async (req, res) => {
  try {
    // Get total products
    const totalProducts = await Product.countDocuments();
    
    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({ 
      totalProducts,
      productsByCategory 
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ message: 'Server error while fetching product stats' });
  }
});

// GET /api/admin/products/top-selling - Get top selling products
router.get('/top-selling', isAdmin, async (req, res) => {
  try {
    // Aggregate all order items to find top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      { $group: { 
        _id: '$items.product', 
        salesCount: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } 
      }},
      { $sort: { salesCount: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }},
      { $unwind: '$productInfo' },
      { $project: { 
        _id: 1, 
        name: '$productInfo.name', 
        price: '$productInfo.price',
        thumbnailUrl: '$productInfo.thumbnailUrl',
        salesCount: 1,
        revenue: 1
      }}
    ]);
    
    res.json({ products: topProducts });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    res.status(500).json({ message: 'Server error while fetching top products' });
  }
});

// GET /api/admin/products/low-stock - Get low stock products
router.get('/low-stock', isAdmin, async (req, res) => {
  try {
    // Find products with stock below threshold (e.g., 10)
    const lowStockThreshold = 10;
    const lowStockProducts = await Product.find({ stockQuantity: { $lt: lowStockThreshold } })
      .sort({ stockQuantity: 1 })
      .limit(5)
      .select('name stockQuantity thumbnailUrl price');
    
    res.json({ products: lowStockProducts });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Server error while fetching low stock products' });
  }
});

module.exports = router; 