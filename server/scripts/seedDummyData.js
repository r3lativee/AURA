const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const config = require('../config');

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', async () => {
  console.log('MongoDB connected successfully to:', config.MONGODB_URI);
  try {
    await seedOrders();
    console.log('Order seed completed successfully');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding orders:', error);
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

// Default shipping address for orders
const defaultShippingAddress = {
  street: "123 Main St",
  city: "New York",
  state: "NY",
  zipCode: "10001",
  country: "USA"
};

const seedOrders = async () => {
  try {
    // Clear existing orders only
    await Order.deleteMany({});
    
    // Find products and users
    const products = await Product.find({});
    if (products.length === 0) {
      console.log("No products found in the database. Please ensure products exist first.");
      return false;
    }
    
    const users = await User.find({});
    if (users.length === 0) {
      console.log("No users found in the database. Please ensure users exist first.");
      return false;
    }
    
    console.log(`Found ${products.length} products and ${users.length} users`);
    
    // Generate random dates for the past 90 days - 10 orders now instead of 50
    const orderDates = generateRandomDates(10);
    
    // Create exactly 10 orders
    const orders = [];
    
    for (let i = 0; i < 10; i++) {
      // Randomly select a user
      const user = users[Math.floor(Math.random() * users.length)];
      
      // Randomly select 1-3 products
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const orderItems = [];
      let subtotal = 0;
      
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
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
      
      // Create order with DELIVERED status and PAID payment
      const order = new Order({
        user: user._id,
        items: orderItems,
        subtotal: subtotal,
        tax: tax,
        shippingCost: shippingCost,
        total: total,
        status: 'DELIVERED', // All orders are DELIVERED
        paymentInfo: {
          method: ['CARD', 'UPI', 'COD'][Math.floor(Math.random() * 3)],
          status: 'PAID', // All payments set to PAID
          transactionId: Math.random().toString(36).substring(2, 15)
        },
        shippingAddress: user.shippingAddress || defaultShippingAddress,
        trackingNumber: Math.random().toString(36).substring(2, 10).toUpperCase(),
        estimatedDelivery: new Date(orderDates[i].getTime() - 3 * 24 * 60 * 60 * 1000), // Delivery date is 3 days before now (already delivered)
        deliveredAt: new Date(orderDates[i].getTime() + 2 * 24 * 60 * 60 * 1000), // Set delivery date 2 days after order date
        createdAt: orderDates[i],
        updatedAt: orderDates[i]
      });
      
      orders.push(order);
    }
    
    // Save all orders
    const savedOrders = await Order.insertMany(orders);
    console.log(`Created ${savedOrders.length} orders with DELIVERED status and PAID payment`);
    
    return true;
  } catch (error) {
    console.error('Error seeding orders:', error);
    throw error;
  }
};

// Run the script if executed directly
if (require.main === module) {
  console.log('Starting order seed...');
} 