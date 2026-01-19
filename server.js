const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ===== MongoDB =====
mongoose.connect(process.env.MONGO_URI);
mongoose.connection.once("open", () => console.log("MongoDB connected ✅"));

// ===== Schemas =====
const MessageSchema = new mongoose.Schema({
  senderName: String,
  senderProfile: String,
  type: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  reactions: { type: Map, of: [String], default: {} } // per-user emoji reactions
});

const Message = mongoose.model("Message", MessageSchema);

// ===== Online user tracking =====
const onlineUsers = new Map(); // socket.id -> user
const lastSeen = new Map();    // userName -> timestamp

function broadcastOnlineUsers() {
  io.emit("onlineUsers", [...onlineUsers.values()]);
}

// ===== REST =====

// Get all messages
app.get("/messages", async (req, res) => {
  const messages = await Message.find().sort({ timestamp: 1 });

  const onlineNames = [...onlineUsers.values()].map(u => u.name);
  const enhanced = messages.map(m => ({
    ...m.toObject(),
    isOnline: onlineNames.includes(m.senderName)
  }));

  res.json(enhanced);
});

// Save a message
app.post("/saveMessageURI", async (req, res) => {
  const msg = await Message.create(req.body);

  const onlineNames = [...onlineUsers.values()].map(u => u.name);
  const payload = {
    ...msg.toObject(),
    isOnline: onlineNames.includes(msg.senderName)
  };

  io.emit("newMessage", payload);
  res.json(payload);
});

// React to a message (emoji reactions)
app.post("/react", async (req, res) => {
  const { messageId, emoji, user } = req.body;
  const msg = await Message.findById(messageId);
  if (!msg) return res.sendStatus(404);

  if (!msg.reactions) msg.reactions = {};
  if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

  if (!msg.reactions[emoji].includes(user)) {
    msg.reactions[emoji].push(user);
  } else {
    // toggle off reaction
    msg.reactions[emoji] = msg.reactions[emoji].filter(u => u !== user);
    if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
  }

  await msg.save();
  io.emit("reactionUpdate", msg);
  res.json(msg);
});

// Delete a message
app.delete("/messages/:id", async (req, res) => {
  const { id } = req.params;
  await Message.findByIdAndDelete(id);
  io.emit("messageDeleted", id);
  res.sendStatus(200);
});

// ===== Socket.IO =====
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // User joins
  socket.on("join", (user) => {
    socket.userName = user.name;
    onlineUsers.set(socket.id, user);
    broadcastOnlineUsers();
  });

  // Disconnect
  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id);
    if (user) lastSeen.set(user.name, new Date());
    onlineUsers.delete(socket.id);
    broadcastOnlineUsers();
  });

  // Typing indicator
  socket.on("typing", (name) => {
    socket.broadcast.emit("typing", name);
  });

  socket.on("stopTyping", () => {
    socket.broadcast.emit("stopTyping");
  });

  // Message read
  socket.on("messageRead", (data) => {
    socket.broadcast.emit("messageRead", data);
  });

  // Placeholder for frontend emission
  socket.on("messageSent", () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));