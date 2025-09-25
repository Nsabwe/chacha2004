require('dotenv').config(); // Load .env variables
const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB URI from environment
const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("MONGO_URI environment variable is not defined.");
}

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Serve static files or HTML
app.use(express.static('views')); // For serving index.html

app.get('/', async (req, res) => {
  try {
    await client.connect();
    const db = client.db('admin');

    // Test the connection with a ping
    await db.command({ ping: 1 });
    console.log("Connected to MongoDB!");

    res.sendFile(path.join(__dirname, 'views', 'index.html'));

  } catch (err) {
    console.error("MongoDB connection failed:", err);
    res.status(500).send("Database connection error");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});