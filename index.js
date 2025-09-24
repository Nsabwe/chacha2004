const { MongoClient, ServerApiVersion } = require('mongodb');

// Use connection string from environment variable
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    await client.connect();
    const database = client.db("testDB");
    const collection = database.collection("testCol");
    const docCount = await collection.countDocuments({});
    console.log("Document count:", docCount);
  } catch (err) {
    console.error("MongoDB connection error:", err);
  } finally {
    await client.close();
  }
}

run();