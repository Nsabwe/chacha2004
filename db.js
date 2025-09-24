const { MongoClient, ServerApiVersion } = require('mongodb');

// Get URI from env vars (from .env locally or Render's Environment Group)
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

async function connectToMongo() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    // You can return the client or DB if needed
    return client.db('testDB'); // Change to your DB name
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
}

module.exports = { connectToMongo };