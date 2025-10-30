import mongoose from "mongoose";
import zlib from "zlib";

// Schema for chat messages
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  content: String,
  voiceData: Buffer, // store compressed binary
  timestamp: { type: Date, default: Date.now }
});

export const Message = mongoose.model("Message", messageSchema);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "clchat",
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB Atlas connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
  }
};

// Utility to compress base64 audio
export const compressAudio = (base64) => {
  const buffer = Buffer.from(base64, "base64");       // convert to binary
  return zlib.deflateSync(buffer);                    // compress
};

// Utility to decompress for playback
export const decompressAudio = (buffer) => {
  const decompressed = zlib.inflateSync(buffer);
  return decompressed.toString("base64");            // back to base64 for frontend
};