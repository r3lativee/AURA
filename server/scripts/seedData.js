import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Product from '../models/Product.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@aura.com',
      password: hashedPassword,
      isAdmin: true
    });

    console.log('Admin user created:', admin.email);

    // Create sample products
    const products = [
      {
        name: 'Premium Beard Oil',
        description: 'Luxurious beard oil for soft and manageable facial hair',
        price: 29.99,
        images: ['/products/beard-oil-1.jpg'],
        category: 'Beard Care',
        brand: 'AURA',
        sizes: [
          { name: '30ml', price: 29.99, inStock: true, sku: 'BO-30ML' },
          { name: '50ml', price: 49.99, inStock: true, sku: 'BO-50ML' }
        ],
        colors: [
          { name: 'Classic', code: '#8B4513', inStock: true }
        ],
        ingredients: ['Argan Oil', 'Jojoba Oil', 'Vitamin E'],
        features: ['Non-greasy formula', 'Natural ingredients', 'Long-lasting'],
        modelUrl: '/models/beard-oil.glb',
        thumbnailUrl: '/products/beard-oil-thumb.jpg'
      },
      {
        name: 'Facial Moisturizer',
        description: 'Hydrating daily moisturizer for men',
        price: 34.99,
        images: ['/products/moisturizer-1.jpg'],
        category: 'Skincare',
        brand: 'AURA',
        sizes: [
          { name: '50ml', price: 34.99, inStock: true, sku: 'FM-50ML' },
          { name: '100ml', price: 59.99, inStock: true, sku: 'FM-100ML' }
        ],
        colors: [
          { name: 'Original', code: '#F5F5F5', inStock: true }
        ],
        ingredients: ['Hyaluronic Acid', 'Aloe Vera', 'Shea Butter'],
        features: ['Oil-free', '24-hour hydration', 'Non-comedogenic'],
        modelUrl: '/models/moisturizer.glb',
        thumbnailUrl: '/products/moisturizer-thumb.jpg'
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} products created`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData(); 