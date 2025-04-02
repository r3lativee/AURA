const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Product = require('../models/Product');
const config = require('../config');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dummyProducts = [
  {
    name: "Classic Beard Oil",
    description: "Premium beard oil for a soft and manageable beard. Made with natural ingredients.",
    price: 24.99,
    category: "Beard Care",
    subCategory: "Oils",
    images: ["/images/products/beard-oil-1.jpg"],
    modelUrl: "/models/beard-oil.glb",
    thumbnailUrl: "/thumbnails/beard-oil-thumb.jpg",
    inStock: true,
    ratings: {
      average: 4.5,
      count: 25
    },
    ingredients: [
      "Argan Oil",
      "Jojoba Oil",
      "Vitamin E",
      "Essential Oils"
    ],
    sizes: [
      {
        name: "30ml",
        price: 24.99,
        inStock: true,
        quantity: 100,
        sku: "BO-30ML-001"
      },
      {
        name: "50ml",
        price: 39.99,
        inStock: true,
        quantity: 75,
        sku: "BO-50ML-001"
      }
    ],
    stockQuantity: 175,
    brand: "AURA Grooming",
    weight: {
      value: 30,
      unit: "ml"
    },
    dimensions: {
      length: 10,
      width: 5,
      height: 5,
      unit: "cm"
    }
  },
  {
    name: "Premium Beard Brush",
    description: "High-quality boar bristle brush for beard grooming. Perfect for daily use.",
    price: 29.99,
    category: "Accessories",
    subCategory: "Brushes",
    images: ["/images/products/beard-brush-1.jpg"],
    modelUrl: "/models/beard-brush.glb",
    thumbnailUrl: "/thumbnails/beard-brush-thumb.jpg",
    inStock: true,
    ratings: {
      average: 4.8,
      count: 42
    },
    sizes: [
      {
        name: "Standard",
        price: 29.99,
        inStock: true,
        quantity: 120,
        sku: "BB-STD-001"
      }
    ],
    stockQuantity: 120,
    brand: "AURA Grooming",
    weight: {
      value: 120,
      unit: "g"
    },
    dimensions: {
      length: 15,
      width: 5,
      height: 3,
      unit: "cm"
    }
  },
  {
    name: "Hydrating Face Cream",
    description: "24-hour hydration cream with natural ingredients. Suitable for all skin types.",
    price: 34.99,
    category: "Skincare",
    subCategory: "Moisturizers",
    images: ["/images/products/face-cream-1.jpg"],
    modelUrl: "/models/face-cream.glb",
    thumbnailUrl: "/thumbnails/face-cream-thumb.jpg",
    inStock: true,
    ratings: {
      average: 4.6,
      count: 38
    },
    ingredients: [
      "Hyaluronic Acid",
      "Vitamin C",
      "Aloe Vera",
      "Shea Butter"
    ],
    sizes: [
      {
        name: "50ml",
        price: 34.99,
        inStock: true,
        quantity: 90,
        sku: "FC-50ML-001"
      },
      {
        name: "100ml",
        price: 59.99,
        inStock: true,
        quantity: 65,
        sku: "FC-100ML-001"
      }
    ],
    stockQuantity: 155,
    brand: "AURA Skincare",
    weight: {
      value: 50,
      unit: "ml"
    },
    dimensions: {
      length: 7,
      width: 7,
      height: 5,
      unit: "cm"
    }
  },
  {
    name: "Styling Hair Pomade",
    description: "Medium hold pomade for natural-looking hairstyles. Water-based formula.",
    price: 19.99,
    category: "Hair Care",
    subCategory: "Styling",
    images: ["/images/products/pomade-1.jpg"],
    modelUrl: "/models/pomade.glb",
    thumbnailUrl: "/thumbnails/pomade-thumb.jpg",
    inStock: true,
    ratings: {
      average: 4.4,
      count: 31
    },
    ingredients: [
      "Water",
      "Beeswax",
      "Castor Oil",
      "Essential Oils"
    ],
    sizes: [
      {
        name: "100g",
        price: 19.99,
        inStock: true,
        quantity: 85,
        sku: "HP-100G-001"
      },
      {
        name: "200g",
        price: 34.99,
        inStock: true,
        quantity: 60,
        sku: "HP-200G-001"
      }
    ],
    stockQuantity: 145,
    brand: "AURA Hair",
    weight: {
      value: 100,
      unit: "g"
    },
    dimensions: {
      length: 8,
      width: 8,
      height: 4,
      unit: "cm"
    }
  }
];

const seedProducts = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB at:', config.MONGODB_URI);

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert dummy products
    const insertedProducts = await Product.insertMany(dummyProducts);
    console.log(`Inserted ${insertedProducts.length} products`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedProducts(); 