// ================================
// server.js — Text + Voice Chat
// ================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve frontend files if needed

// ===== MongoDB Connection =====
const mongoURL = process.env.MONGO_URL || "mongodb://localhost:27017/clchat";
mongoose
  .connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ===== Message Schema =====
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String, // null = public message
  content: String,  // text, base64 audio, or audio URL
  isVoice: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// ===== Active Users =====
let users = {}; // username → socket.id

// ===== Socket.io Logic =====
io.on("connection", socket => {
  let currentUser = null;

  console.log("🟢 New socket connected:", socket.id);

  // User joins
  socket.on("user joined", async username => {
    currentUser = username;
    users[username] = socket.id;

    console.log(`👤 ${username} joined chat`);

    // Send chat history
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit("chat history", messages);

    // Update all users’ list
    io.emit("users update", Object.keys(users));
  });

  // ===== Text Message =====
  socket.on("send message", async msg => {
    const newMessage = new Message({
      sender: msg.sender,
      receiver: msg.receiver || null,
      content: msg.content || msg.text,
      isVoice: false
    });
    await newMessage.save();

    const outMsg = {
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      content: newMessage.content,
      isVoice: false,
      timestamp: newMessage.timestamp
    };

    if (msg.receiver) {
      // private message
      [msg.receiver, msg.sender].forEach(u => {
        if (users[u]) io.to(users[u]).emit("receive message", outMsg);
      });
    } else {
      // public message
      io.emit("receive message", outMsg);
    }
  });

  // ===== Voice Message =====
  socket.on("send voice", async msg => {
    // msg.audio should be base64 data or audio URL
    const newMessage = new Message({
      sender: msg.sender,
      receiver: msg.receiver || null,
      content: msg.audio,
      isVoice: true
    });
    await newMessage.save();

    const outMsg = {
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      content: newMessage.content,
      isVoice: true,
      timestamp: newMessage.timestamp
    };

    if (msg.receiver) {
      // private voice message
      [msg.receiver, msg.sender].forEach(u => {
        if (users[u]) io.to(users[u]).emit("receive voice", outMsg);
      });
    } else {
      // public voice message
      io.emit("receive voice", outMsg);
    }
  });

  // ===== Typing Indicator =====
  socket.on("typing", data => {
    if (data.sender) {
      if (data.receiver) {
        [data.receiver, data.sender].forEach(u => {
          if (users[u]) io.to(users[u]).emit("typing", data);
        });
      } else {
        socket.broadcast.emit("typing", data);
      }
    }
  });

  // ===== User Disconnects =====
  socket.on("disconnect", () => {
    if (currentUser) {
      console.log(`🔴 ${currentUser} disconnected`);
      delete users[currentUser];
      io.emit("users update", Object.keys(users));
    }
  });
});

// ===== REST API for Message History =====
app.get("/api/messages", async (req, res) => {
  const messages = await Message.find().sort({ timestamp: 1 });
  res.json(messages);
});

app.post("/api/messages", async (req, res) => {
  const { sender, receiver, content, isVoice } = req.body;
  const msg = new Message({ sender, receiver, content, isVoice });
  await msg.save();
  res.json(msg);
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);