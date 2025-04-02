const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the Product model
const Product = require('../models/Product');

// Import config
const config = require('../config');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully to:', config.MONGODB_URI))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// New product data
const newProducts = [
  {
    "name": "AURA Hydrating Beard Shampoo",
    "description": "At AURA, we crafted this deep-cleansing, sulfate-free beard shampoo with love to cleanse, nourish, and soften your beard. Infused with essential oils, it promotes healthy beard growth while keeping your beard fresh and hydrated.",
    "price": 1800,
    "images": ["/images/beard-shampoo-1.jpg", "/images/beard-shampoo-2.jpg", "/images/beard-shampoo-3.jpg"],
    "category": "Beard Care",
    "subCategory": "Shampoo",
    "sizes": [
      { name: "250ml", price: 1800, inStock: true, quantity: 100, sku: "BS-250" },
      { name: "500ml", price: 3000, inStock: true, quantity: 50, sku: "BS-500" }
    ],
    "ingredients": ["Argan Oil", "Tea Tree Oil", "Aloe Vera", "Vitamin E"],
    "features": [],
    "ratings": { average: 0, count: 0 },
    "inStock": true,
    "discount": 10,
    "tags": ["beard care", "shampoo", "essential oils"],
    "brand": "AURA Grooming",
    "weight": { "value": 250, "unit": "ml" },
    "dimensions": { "length": 15, "width": 5, "height": 5, "unit": "cm" },
    "modelUrl": "/models/beard-shampoo.glb",
    "thumbnailUrl": "/thumbnails/beard-shampoo-thumb.jpg",
    "stockQuantity": 150
  },
  {
    "name": "AURA Ultra Hydration Moisturizer",
    "description": "AURA has designed this lightweight yet deeply hydrating moisturizer with love, using hyaluronic acid and shea butter to provide long-lasting moisture and a smooth, radiant complexion.",
    "price": 2200,
    "images": ["/images/moisturizer-1.jpg", "/images/moisturizer-2.jpg", "/images/moisturizer-3.jpg"],
    "category": "Skincare",
    "subCategory": "Moisturizers",
    "sizes": [
      { name: "100ml", price: 2200, inStock: true, quantity: 120, sku: "UHM-100" },
      { name: "200ml", price: 3800, inStock: true, quantity: 80, sku: "UHM-200" }
    ],
    "ingredients": ["Hyaluronic Acid", "Shea Butter", "Jojoba Oil", "Aloe Vera"],
    "features": [],
    "ratings": { average: 0, count: 0 },
    "inStock": true,
    "discount": 5,
    "tags": ["skincare", "moisturizer", "hydration"],
    "brand": "AURA Skin",
    "weight": { "value": 100, "unit": "ml" },
    "dimensions": { "length": 12, "width": 4, "height": 4, "unit": "cm" },
    "modelUrl": "/models/moisturizer.glb",
    "thumbnailUrl": "/thumbnails/moisturizer-thumb.jpg",
    "stockQuantity": 200
  },
  {
    "name": "AURA Signature Oud Perfume",
    "description": "Crafted with love, AURA presents this luxurious Signature Oud Perfume, a bold yet sophisticated blend of oud, amber, and vanilla. This long-lasting fragrance defines elegance and confidence.",
    "price": 4500,
    "images": ["/images/oud-perfume-1.jpg", "/images/oud-perfume-2.jpg", "/images/oud-perfume-3.jpg"],
    "category": "Body Care",
    "subCategory": "Perfumes",
    "sizes": [
      { name: "50ml", price: 4500, inStock: true, quantity: 70, sku: "SOP-50" },
      { name: "100ml", price: 7500, inStock: true, quantity: 50, sku: "SOP-100" }
    ],
    "ingredients": ["Oud Extract", "Amber Resin", "Vanilla", "Sandalwood"],
    "features": [],
    "ratings": { average: 0, count: 0 },
    "inStock": true,
    "discount": 15,
    "tags": ["fragrance", "perfume", "luxury"],
    "brand": "AURA Fragrance",
    "weight": { "value": 50, "unit": "ml" },
    "dimensions": { "length": 10, "width": 3, "height": 3, "unit": "cm" },
    "modelUrl": "/models/oud-perfume.glb",
    "thumbnailUrl": "/thumbnails/oud-perfume-thumb.jpg",
    "stockQuantity": 120
  },
  {
    "name": "AURA Citrus Burst Perfume",
    "description": "Infused with love and freshness, AURA's Citrus Burst Perfume features a vibrant blend of lemon, bergamot, and musk, creating an energetic and refreshing fragrance for every occasion.",
    "price": 4000,
    "images": ["/images/citrus-perfume-1.jpg", "/images/citrus-perfume-2.jpg", "/images/citrus-perfume-3.jpg"],
    "category": "Body Care",
    "subCategory": "Perfumes",
    "sizes": [
      { name: "50ml", price: 4000, inStock: true, quantity: 80, sku: "CBP-50" },
      { name: "100ml", price: 6800, inStock: true, quantity: 50, sku: "CBP-100" }
    ],
    "ingredients": ["Lemon Peel Oil", "Bergamot Essence", "Musk", "Vetiver"],
    "features": [],
    "ratings": { average: 0, count: 0 },
    "inStock": true,
    "discount": 10,
    "tags": ["fragrance", "perfume", "citrus"],
    "brand": "AURA Fragrance",
    "weight": { "value": 50, "unit": "ml" },
    "dimensions": { "length": 10, "width": 3, "height": 3, "unit": "cm" },
    "modelUrl": "/models/citrus-perfume.glb",
    "thumbnailUrl": "/thumbnails/citrus-perfume-thumb.jpg",
    "stockQuantity": 130
  },
  {
    "name": "AURA SPF 50+ Sunscreen",
    "description": "AURA has carefully formulated this SPF 50+ sunscreen with love, providing non-greasy, broad-spectrum protection against UVA & UVB rays. Stay protected while keeping your skin nourished and hydrated.",
    "price": 2000,
    "images": ["/images/sunscreen-1.jpg", "/images/sunscreen-2.jpg", "/images/sunscreen-3.jpg"],
    "category": "Skincare",
    "subCategory": "Sunscreen",
    "sizes": [
      { name: "50ml", price: 2000, inStock: true, quantity: 90, sku: "SPF-50" },
      { name: "100ml", price: 3200, inStock: true, quantity: 70, sku: "SPF-100" }
    ],
    "ingredients": ["Zinc Oxide", "Vitamin C", "Aloe Vera", "Shea Butter"],
    "features": [],
    "ratings": { average: 0, count: 0 },
    "inStock": true,
    "discount": 5,
    "tags": ["skincare", "sunscreen", "protection"],
    "brand": "AURA Skin",
    "weight": { "value": 50, "unit": "ml" },
    "dimensions": { "length": 12, "width": 4, "height": 4, "unit": "cm" },
    "modelUrl": "/models/sunscreen.glb",
    "thumbnailUrl": "/thumbnails/sunscreen-thumb.jpg",
    "stockQuantity": 160
  }
];

// Function to update products
const updateProducts = async () => {
  try {
    // Delete all existing products
    console.log('Deleting all existing products...');
    await Product.deleteMany({});
    console.log('All products deleted successfully');

    // Insert new products
    console.log('Adding new products...');
    const insertedProducts = await Product.insertMany(newProducts);
    console.log(`${insertedProducts.length} new products added successfully`);

    // List all product names that were added
    console.log('\nNew products added:');
    insertedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - $${(product.price / 100).toFixed(2)}`);
    });

    console.log('\nDatabase update complete!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error updating products:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

// Run the update function
updateProducts(); 