const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import config
const config = require('../config');

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('MongoDB connected to:', config.MONGODB_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixDatabase = async () => {
  try {
    await connectDB();
    
    // Get direct connection to the database
    const db = mongoose.connection.db;
    
    console.log('Checking database collections...');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name).join(', '));
    
    // Check users collection
    const usersCollection = collections.find(c => c.name === 'users');
    if (!usersCollection) {
      console.log('Users collection not found!');
    } else {
      console.log('Users collection found');
      
      // Get all indexes on users collection
      const indexes = await db.collection('users').indexes();
      console.log('Current indexes on users collection:', JSON.stringify(indexes, null, 2));
      
      // Remove any problematic indexes (except _id)
      for (const index of indexes) {
        if (index.name !== '_id_' && (index.name.includes('username') || index.key.username)) {
          console.log(`Dropping problematic index: ${index.name}`);
          await db.collection('users').dropIndex(index.name);
        }
      }
      
      // Check if we need to create or modify the email index
      const emailIndex = indexes.find(idx => idx.key && idx.key.email);
      if (!emailIndex) {
        console.log('Creating clean email index...');
        try {
          await db.collection('users').createIndex(
            { email: 1 }, 
            { unique: true, name: 'email_unique_index' }
          );
        } catch (error) {
          console.log('Error creating email index:', error.message);
        }
      } else {
        console.log(`Email index already exists: ${emailIndex.name}`);
        // If you need to rebuild the index, drop and recreate it
        if (emailIndex.name !== 'email_unique_index') {
          try {
            console.log(`Dropping existing email index: ${emailIndex.name}`);
            await db.collection('users').dropIndex(emailIndex.name);
            console.log('Creating clean email index...');
            await db.collection('users').createIndex(
              { email: 1 }, 
              { unique: true, name: 'email_unique_index' }
            );
          } catch (error) {
            console.log('Error rebuilding email index:', error.message);
          }
        }
      }
      
      // Check if there are any users with null or undefined email
      const problematicUsers = await db.collection('users').find({
        $or: [
          { email: null },
          { email: "" },
          { email: { $exists: false } }
        ]
      }).toArray();
      
      console.log(`Found ${problematicUsers.length} users with problematic email values`);
      
      // Fix or remove problematic users
      if (problematicUsers.length > 0) {
        for (const user of problematicUsers) {
          console.log(`Removing user with problematic email: ${user._id}`);
          await db.collection('users').deleteOne({ _id: user._id });
        }
      }
      
      // Look for duplicate emails (case insensitive)
      const users = await db.collection('users').find({}).toArray();
      const emailMap = new Map();
      const duplicates = [];
      
      for (const user of users) {
        if (!user.email) continue;
        
        const normalizedEmail = user.email.toLowerCase().trim();
        if (emailMap.has(normalizedEmail)) {
          duplicates.push({ id: user._id, email: user.email });
        } else {
          emailMap.set(normalizedEmail, user._id);
        }
      }
      
      console.log(`Found ${duplicates.length} users with duplicate emails`);
      
      // Remove duplicate users
      if (duplicates.length > 0) {
        for (const dup of duplicates) {
          console.log(`Removing duplicate user: ${dup.id} with email ${dup.email}`);
          await db.collection('users').deleteOne({ _id: dup.id });
        }
      }
      
      // Get updated indexes
      const updatedIndexes = await db.collection('users').indexes();
      console.log('Updated indexes on users collection:', JSON.stringify(updatedIndexes, null, 2));
    }
    
    console.log('Database fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
};

fixDatabase(); 