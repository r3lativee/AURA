const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  images: [{
    type: String,
    required: true,
  }],
  category: {
    type: String,
    required: true,
    enum: ['Beard Care', 'Skincare', 'Hair Care', 'Body Care', 'Accessories'],
  },
  subCategory: {
    type: String,
    trim: true,
  },
  sizes: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true },
  }],
  ingredients: {
    type: [String],
    default: [],
  },
  features: {
    type: [String],
    default: [],
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  inStock: {
    type: Boolean,
    default: function() {
      return this.stockQuantity > 0;
    },
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  tags: [String],
  brand: {
    type: String,
    required: true,
  },
  weight: {
    value: { type: Number },
    unit: { type: String, enum: ['g', 'ml', 'oz', 'lb'] },
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'in'] },
  },
  modelUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  }
}, { timestamps: true });

// Add indexes for common queries
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model('Product', productSchema); 