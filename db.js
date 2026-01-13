const mongoose = require("mongoose");

// ===== Connect to MongoDB =====
mongoose.connect("mongodb://127.0.0.1:27017/chatapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// ===== MongoDB Connection Events =====
mongoose.connection.on("connected", () => {
  console.log("MongoDB connected ✅");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error ❌:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected ⚠️");
});

// Optional: check initial connection state
const states = ["disconnected", "connected", "connecting", "disconnecting"];
console.log("MongoDB initial connection status:", states[mongoose.connection.readyState]);

// ===== Schemas =====
const profileSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  profile: { type: String, required: true }, // Base64 or file path
});

const messageSchema = new mongoose.Schema({
  senderName: String,
  senderProfile: String,
  type: String, // text, image, document
  content: String, // text, file path, or Base64
  timestamp: { type: Date, default: Date.now },
});

const tipSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  total: { type: Number, default: 0 },
});

// ===== Models =====
const Profile = mongoose.model("Profile", profileSchema);
const Message = mongoose.model("Message", messageSchema);
const Tip = mongoose.model("Tip", tipSchema);

// ===== Helper to check connection status =====
function getDbStatus() {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState];
}

// ===== Export Models & Connection Status =====
module.exports = {
  Profile,
  Message,
  Tip,
  mongooseConnection: mongoose.connection,
  getDbStatus
};