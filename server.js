const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // load .env variables

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json({ limit: "50mb" })); // handle large Base64 files

// ===== Connect to MongoDB (Cloud) =====
const mongoURI = process.env.MONGO_URI; // set this in your Render environment variables
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected ✅");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error ❌:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected ⚠️");
});

const states = ["disconnected", "connected", "connecting", "disconnecting"];
console.log("MongoDB initial connection status:", states[mongoose.connection.readyState]);

// ===== Schemas =====
const profileSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  profile: { type: String, required: true },
});

const messageSchema = new mongoose.Schema({
  senderName: String,
  senderProfile: String,
  type: String,
  content: String,
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

// ===== REST API =====
app.post("/saveProfileURI", async (req, res) => {
  const { name, profile } = req.body;
  if (!name || !profile) return res.status(400).json({ error: "Missing fields" });

  try {
    const existing = await Profile.findOne({ name });
    if (existing) {
      existing.profile = profile;
      await existing.save();
    } else {
      await Profile.create({ name, profile });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/saveMessageURI", async (req, res) => {
  try {
    const msg = await Message.create(req.body);
    res.json(msg);
    io.emit("newMessage", msg);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/message/:id", async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    io.emit("deleteMessage", req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ===== Socket.IO =====
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("join", async (user) => {
    socket.userName = user.name;
    if (!onlineUsers.find((u) => u.name === user.name)) onlineUsers.push(user);
    io.emit("onlineUsers", onlineUsers);

    const tip = await Tip.findOne({ username: user.name });
    io.emit("tipUpdate", tip ? tip.total : 0, user.name);
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((u) => u.name !== socket.userName);
    io.emit("onlineUsers", onlineUsers);
  });

  socket.on("messageRead", (data) => {
    io.emit("messageRead", data);
  });

  socket.on("sendTip", async ({ to, amount }) => {
    try {
      let tip = await Tip.findOne({ username: to });
      if (tip) {
        tip.total += amount;
        await tip.save();
      } else {
        tip = await Tip.create({ username: to, total: amount });
      }
      io.emit("tipUpdate", tip.total, to);
    } catch (err) {
      console.error("Tip error:", err);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));