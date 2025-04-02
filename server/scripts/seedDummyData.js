const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const config = require('../config');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', async () => {
  console.log('MongoDB connected successfully to:', config.MONGODB_URI);
  try {
    await seedData();
    console.log('Seed data completed successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const generateRandomDates = (count, startDaysAgo = 90) => {
  const dates = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * startDaysAgo);
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    
    // Randomize the time as well
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));
    
    dates.push(date);
  }
  
  // Sort dates from oldest to newest
  return dates.sort((a, b) => a - b);
};

const products = [
  {
    name: "AURA Beard Oil",
    description: "Premium beard oil that nourishes and conditions your beard for a healthy, shiny look.",
    price: 1999,
    images: ["https://i.imgur.com/8tTF31R.png"],
    category: "Beard Care",
    subCategory: "Oils",
    sizes: [
      {
        name: "30ml",
        price: 1999,
        inStock: true,
        quantity: 75,
        sku: "BO-30ML-001"
      },
      {
        name: "60ml",
        price: 2999,
        inStock: true,
        quantity: 50,
        sku: "BO-60ML-001"
      }
    ],
    ingredients: ["Argan Oil", "Jojoba Oil", "Vitamin E", "Essential Oils"],
    features: ["Moisturizes beard", "Prevents beard dandruff", "Promotes beard growth"],
    stockQuantity: 125,
    inStock: true,
    discount: 0,
    tags: ["beard oil", "grooming", "men's care"],
    brand: "AURA",
    weight: {
      value: 30,
      unit: "ml"
    },
    dimensions: {
      length: 4,
      width: 4,
      height: 10,
      unit: "cm"
    },
    modelUrl: "https://i.imgur.com/8tTF31R.png",
    thumbnailUrl: "https://i.imgur.com/8tTF31R.png"
  },
  {
    name: "AURA Beard Balm",
    description: "Styling balm that provides hold while conditioning your beard.",
    price: 2499,
    images: ["https://i.imgur.com/7ZCc9ZI.png"],
    category: "Beard Care",
    subCategory: "Balms",
    sizes: [
      {
        name: "50g",
        price: 2499,
        inStock: true,
        quantity: 60,
        sku: "BB-50G-001"
      }
    ],
    ingredients: ["Shea Butter", "Beeswax", "Coconut Oil", "Essential Oils"],
    features: ["Medium hold", "Natural finish", "Conditions beard"],
    stockQuantity: 60,
    inStock: true,
    discount: 10,
    tags: ["beard balm", "styling", "men's care"],
    brand: "AURA",
    weight: {
      value: 50,
      unit: "g"
    },
    dimensions: {
      length: 6,
      width: 6,
      height: 3,
      unit: "cm"
    },
    modelUrl: "https://i.imgur.com/7ZCc9ZI.png",
    thumbnailUrl: "https://i.imgur.com/7ZCc9ZI.png"
  },
  {
    name: "AURA Face Cleanser",
    description: "Gentle face wash that removes impurities without stripping skin of natural oils.",
    price: 1799,
    images: ["https://i.imgur.com/5X29kHA.png"],
    category: "Skincare",
    subCategory: "Cleansers",
    sizes: [
      {
        name: "100ml",
        price: 1799,
        inStock: true,
        quantity: 45,
        sku: "FC-100ML-001"
      },
      {
        name: "200ml",
        price: 2899,
        inStock: true,
        quantity: 30,
        sku: "FC-200ML-001"
      }
    ],
    ingredients: ["Aloe Vera", "Glycerin", "Chamomile Extract", "Cucumber Extract"],
    features: ["pH balanced", "Suitable for all skin types", "Hydrating"],
    stockQuantity: 75,
    inStock: true,
    discount: 0,
    tags: ["face wash", "cleanser", "skincare"],
    brand: "AURA",
    weight: {
      value: 100,
      unit: "ml"
    },
    dimensions: {
      length: 5,
      width: 5,
      height: 12,
      unit: "cm"
    },
    modelUrl: "https://i.imgur.com/5X29kHA.png",
    thumbnailUrl: "https://i.imgur.com/5X29kHA.png"
  },
  {
    name: "AURA Hair Pomade",
    description: "Strong hold pomade for a classic, sleek hairstyle.",
    price: 1899,
    images: ["https://i.imgur.com/XYl3ZTL.png"],
    category: "Hair Care",
    subCategory: "Styling",
    sizes: [
      {
        name: "100g",
        price: 1899,
        inStock: true,
        quantity: 8,
        sku: "HP-100G-001"
      }
    ],
    ingredients: ["Beeswax", "Lanolin", "Castor Oil", "Essential Oils"],
    features: ["Strong hold", "High shine", "Water-based"],
    stockQuantity: 8,
    inStock: true,
    discount: 0,
    tags: ["pomade", "hair styling", "grooming"],
    brand: "AURA",
    weight: {
      value: 100,
      unit: "g"
    },
    dimensions: {
      length: 8,
      width: 8,
      height: 4,
      unit: "cm"
    },
    modelUrl: "https://i.imgur.com/XYl3ZTL.png",
    thumbnailUrl: "https://i.imgur.com/XYl3ZTL.png"
  },
  {
    name: "AURA Body Wash",
    description: "Refreshing body wash with natural ingredients for a clean, hydrated feel.",
    price: 1599,
    images: ["https://i.imgur.com/pFq8vlJ.png"],
    category: "Body Care",
    subCategory: "Cleansers",
    sizes: [
      {
        name: "250ml",
        price: 1599,
        inStock: true,
        quantity: 100,
        sku: "BW-250ML-001"
      },
      {
        name: "500ml",
        price: 2699,
        inStock: true,
        quantity: 65,
        sku: "BW-500ML-001"
      }
    ],
    ingredients: ["Aloe Vera", "Coconut Oil", "Vitamin E", "Essential Oils"],
    features: ["Moisturizing", "Suitable for all skin types", "Refreshing scent"],
    stockQuantity: 165,
    inStock: true,
    discount: 15,
    tags: ["body wash", "shower gel", "body care"],
    brand: "AURA",
    weight: {
      value: 250,
      unit: "ml"
    },
    dimensions: {
      length: 6,
      width: 6,
      height: 15,
      unit: "cm"
    },
    modelUrl: "https://i.imgur.com/pFq8vlJ.png",
    thumbnailUrl: "https://i.imgur.com/pFq8vlJ.png"
  }
];

const users = [
  {
    name: "John Smith",
    email: "john@example.com",
    password: "password123",
    role: "user",
    status: "active",
    shippingAddress: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA"
    }
  },
  {
    name: "Emily Johnson",
    email: "emily@example.com",
    password: "password123",
    role: "user",
    status: "active",
    shippingAddress: {
      street: "456 Oak Ave",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
      country: "USA"
    }
  },
  {
    name: "Michael Brown",
    email: "michael@example.com",
    password: "password123",
    role: "user",
    status: "active",
    shippingAddress: {
      street: "789 Pine St",
      city: "Chicago",
      state: "IL",
      zipCode: "60007",
      country: "USA"
    }
  }
];

// Add default shipping address for orders
const defaultShippingAddress = {
  street: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  country: "USA"
};

const seedData = async () => {
  try {
    // Clear existing data
    await Product.deleteMany({});
    await Order.deleteMany({});
    
    // Don't clear users to preserve admin account
    // await User.deleteMany({ role: 'user' });  // Only delete non-admin users

    // Insert products
    const savedProducts = await Product.insertMany(products);
    console.log(`Inserted ${savedProducts.length} products`);

    // Insert users (if don't exist)
    const createdUsers = [];
    for (const user of users) {
      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        // Hash password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        
        const newUser = new User({
          ...user,
          password: hashedPassword
        });
        
        const savedUser = await newUser.save();
        createdUsers.push(savedUser);
      }
    }
    console.log(`Created ${createdUsers.length} users`);

    // Get all users (including admin)
    const allUsers = await User.find({});
    
    // Generate random dates for the past 90 days
    const orderDates = generateRandomDates(50);
    
    // Create orders
    const orders = [];
    for (let i = 0; i < 50; i++) {
      // Randomly select a user
      const user = allUsers[Math.floor(Math.random() * allUsers.length)];
      
      // Randomly select 1-3 products
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let subtotal = 0;
      
      for (let j = 0; j < numProducts; j++) {
        const product = savedProducts[Math.floor(Math.random() * savedProducts.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const size = product.sizes[Math.floor(Math.random() * product.sizes.length)];
        const itemPrice = size.price;
        const itemSubtotal = itemPrice * quantity;
        
        orderItems.push({
          product: product._id,
          quantity: quantity,
          price: itemPrice,
          size: size.name,
          subtotal: itemSubtotal
        });
        
        subtotal += itemSubtotal;
      }
      
      // Calculate tax and shipping
      const tax = Math.round(subtotal * 0.1); // 10% tax
      const shippingCost = 499; // $4.99 shipping
      const total = subtotal + tax + shippingCost;
      
      // Determine order status
      const statusOptions = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      const statusWeights = [0.1, 0.2, 0.2, 0.4, 0.1];  // 40% delivered, 10% cancelled, etc.
      
      let status;
      const rand = Math.random();
      let cumulativeWeight = 0;
      
      for (let k = 0; k < statusOptions.length; k++) {
        cumulativeWeight += statusWeights[k];
        if (rand <= cumulativeWeight) {
          status = statusOptions[k];
          break;
        }
      }
      
      // Create the order
      const order = new Order({
        user: user._id,
        items: orderItems,
        subtotal: subtotal,
        tax: tax,
        shippingCost: shippingCost,
        total: total,
        status: status,
        paymentInfo: {
          method: ['CARD', 'UPI', 'COD'][Math.floor(Math.random() * 3)],
          status: ['PENDING', 'PAID', 'FAILED'][Math.floor(Math.random() * 2)], // Mostly PAID or PENDING
          transactionId: Math.random().toString(36).substring(2, 15)
        },
        shippingAddress: defaultShippingAddress,
        trackingNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
        estimatedDelivery: new Date(orderDates[i].getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after order date
        createdAt: orderDates[i],
        updatedAt: orderDates[i]
      });
      
      orders.push(order);
    }
    
    await Order.insertMany(orders);
    console.log(`Created ${orders.length} orders`);
    
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};

// Don't run the script directly if it's imported elsewhere
if (require.main === module) {
  // The script is being run directly
  console.log('Starting data seed...');
} 