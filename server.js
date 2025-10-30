import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // update with frontend URL in production
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" })); // increase for voice data
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// MongoDB connection
const mongoURL = process.env.MONGO_URI || "mongodb://localhost:27017/clchat";
mongoose.connect(mongoURL, {
  dbName: "clchat",
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Atlas connected"))
.catch(err => console.error("❌ MongoDB connection failed:", err.message));

// Message Schema
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,      // null = public
  content: String,       // text message
  voiceData: String,     // Base64 voice data
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// Users tracking
let users = {}; // username -> socket.id

// ---------------- SOCKET.IO ----------------
io.on("connection", (socket) => {
  let currentUser = null;

  // User joins
  socket.on("user joined", async (username) => {
    currentUser = username;
    users[username] = socket.id;

    // Send chat history
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit("chat history", messages);

    // Update online users
    io.emit("users update", Object.keys(users));
    console.log(`👤 ${username} joined`);
  });

  // Send message (text or voice)
  socket.on("send message", async (msg) => {
    const newMessage = new Message({
      sender: msg.sender,
      receiver: msg.receiver || null,
      content: msg.content || "",
      voiceData: msg.voiceData || ""
    });

    await newMessage.save();

    const outMsg = {
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      content: newMessage.content,
      voiceData: newMessage.voiceData,
      timestamp: newMessage.timestamp
    };

    if (msg.receiver) {
      // Private
      [msg.receiver, msg.sender].forEach(u => {
        if (users[u]) io.to(users[u]).emit("receive message", outMsg);
      });
    } else {
      // Public
      io.emit("receive message", outMsg);
    }
  });

  // Typing indicator
  socket.on("typing", (data) => {
    if (data.receiver) {
      [data.receiver, data.sender].forEach(u => {
        if (users[u]) io.to(users[u]).emit("typing", data);
      });
    } else {
      socket.broadcast.emit("typing", data);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (currentUser) {
      delete users[currentUser];
      io.emit("users update", Object.keys(users));
      console.log(`❌ ${currentUser} disconnected`);
    }
  });
});

// ---------------- REST API ----------------

// Get all messages
app.get("/api/messages", async (req, res) => {
  const messages = await Message.find().sort({ timestamp: 1 });
  res.json(messages);
});

// Post a new message
app.post("/api/messages", async (req, res) => {
  const { sender, receiver, content, voiceData } = req.body;
  const msg = new Message({ sender, receiver, content, voiceData });
  await msg.save();
  res.json(msg);
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));