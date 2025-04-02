const { MongoClient } = require('mongodb');

// Connection URL using IP address instead of hostname
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'aura_db';

async function testConnection() {
  console.log('Attempting to connect to MongoDB...');
  
  try {
    // Connect to the MongoDB server
    const client = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    
    console.log('Successfully connected to MongoDB server');
    
    // Connect to the database
    const db = client.db(dbName);
    console.log(`Successfully connected to database: ${dbName}`);
    
    // List collections to verify further
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name).join(', ') || 'No collections found');
    
    // Close the connection
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  }
}

// Run the test
testConnection(); 