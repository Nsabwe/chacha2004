require('dotenv').config(); // Only needed if you use .env files locally
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI environment variable is not defined");
}

const client = new MongoClient(uri);

// Your MongoDB logic here (connect, etc.)