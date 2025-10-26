// src/server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import User from "./models/User.js";
import Message from "./models/Message.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public'
app.use(express.static("public"));
app.use(express.json());

// MongoDB connection (from Render environment variable)
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Track online users
const onlineUsers = new Map();

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./public" });
});

// API: Get private chat history
app.get("/api/messages/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// API: Search online users
app.get("/api/search-online", async (req, res) => {
  try {
    const { username } = req.query;
    const users = await User.find({
      username: { $regex: username, $options: "i" },
      online: true,
    }).select("username online");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to search online users" });
  }
});

// Socket.IO
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("user joined", async (username) => {
    socket.username = username;
    onlineUsers.set(username, socket.id);

    await User.findOneAndUpdate({ username }, { online: true }, { upsert: true });
    const users = await User.find({}, "username online");
    io.emit("users list", users);
    io.emit("chat message", { sender: "System", text: `${username} joined` });
  });

  socket.on("chat message", async (msg) => {
    const newMessage = new Message(msg);
    await newMessage.save();
    io.emit("chat message", msg);
  });

  socket.on("private message", async (msg) => {
    const { sender, receiver, text } = msg;
    const newMessage = new Message({ sender, receiver, text });
    await newMessage.save();

    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) io.to(receiverSocketId).emit("private message", msg);

    socket.emit("private message", msg);
  });

  socket.on("disconnect", async () => {
    if (socket.username) {
      onlineUsers.delete(socket.username);
      await User.findOneAndUpdate({ username: socket.username }, { online: false });
      const users = await User.find({}, "username online");
      io.emit("users list", users);
      io.emit("chat message", { sender: "System", text: `${socket.username} left` });
    }
  });
});

// Start server on Render-assigned port or 3000 locally
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));