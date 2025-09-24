const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");

const app = express();
const port = process.env.PORT || 3000;

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI not set");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

async function connectToMongo() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

app.get("/", async (req, res) => {
  try {
    const database = client.db("testDB");
    const collection = database.collection("testCol");
    const docCount = await collection.countDocuments({});
    res.send(`Document count: ${docCount}`);
  } catch (err) {
    res.status(500).send("Error fetching data");
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  connectToMongo(); // Connect after server starts
});