const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.fieldname === 'model' 
      ? path.join(__dirname, '../uploads/models')
      : path.join(__dirname, '../uploads/thumbnails');
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'model') {
      if (path.extname(file.originalname) !== '.glb') {
        return cb(new Error('Only .glb files are allowed for 3D models'));
      }
    } else if (file.fieldname === 'thumbnail') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed for thumbnails'));
      }
    }
    cb(null, true);
  }
});

// Get all products with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sort = req.query.sort || 'newest';
    const category = req.query.category;
    const search = req.query.search;

    // Build query
    const query = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'price_low':
        sortOptions = { price: 1 };
        break;
      case 'price_high':
        sortOptions = { price: -1 };
        break;
      case 'popular':
        sortOptions = { 'ratings.average': -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    res.json({
      products,
      currentPage: page,
      totalPages,
      totalProducts,
      hasMore: page < totalPages
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ 'ratings.average': -1 })
      .limit(6);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product
router.post('/', upload.fields([
  { name: 'model', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, price, category, ingredients } = req.body;
    const modelFile = req.files['model']?.[0];
    const thumbnailFile = req.files['thumbnail']?.[0];

    if (!modelFile || !thumbnailFile) {
      return res.status(400).json({ message: 'Both model and thumbnail files are required' });
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      ingredients: JSON.parse(ingredients),
      modelUrl: `/uploads/models/${modelFile.filename}`,
      thumbnailUrl: `/uploads/thumbnails/${thumbnailFile.filename}`,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update product
router.put('/:id', upload.fields([
  { name: 'model', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, description, price, category, ingredients } = req.body;
    const modelFile = req.files['model']?.[0];
    const thumbnailFile = req.files['thumbnail']?.[0];

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update basic info
    product.name = name;
    product.description = description;
    product.price = price;
    product.category = category;
    product.ingredients = JSON.parse(ingredients);

    // Update files if new ones are uploaded
    if (modelFile) {
      // Delete old file
      const oldModelPath = path.join(__dirname, '..', product.modelUrl);
      if (fs.existsSync(oldModelPath)) {
        fs.unlinkSync(oldModelPath);
      }
      product.modelUrl = `/uploads/models/${modelFile.filename}`;
    }

    if (thumbnailFile) {
      // Delete old file
      const oldThumbnailPath = path.join(__dirname, '..', product.thumbnailUrl);
      if (fs.existsSync(oldThumbnailPath)) {
        fs.unlinkSync(oldThumbnailPath);
      }
      product.thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete associated files
    const modelPath = path.join(__dirname, '..', product.modelUrl);
    const thumbnailPath = path.join(__dirname, '..', product.thumbnailUrl);

    if (fs.existsSync(modelPath)) {
      fs.unlinkSync(modelPath);
    }
    if (fs.existsSync(thumbnailPath)) {
      fs.unlinkSync(thumbnailPath);
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 