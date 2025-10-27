// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // optional: serve frontend from backend

// MongoDB connection
const mongoURL = process.env.MONGO_URL || "mongodb://localhost:27017/clchat";
mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });

const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String, // null = public
  content: String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

let users = {}; // username -> socket.id

io.on('connection', socket => {
  let currentUser = null;

  socket.on("user joined", async (username) => {
    currentUser = username;
    users[username] = socket.id;

    // Send chat history
    const messages = await Message.find().sort({ timestamp: 1 });
    socket.emit("chat history", messages);

    // Broadcast user list
    io.emit("users update", Object.keys(users));
  });

  socket.on("send message", async (msg) => {
    const newMessage = new Message({
      sender: msg.sender,
      receiver: msg.receiver || null,
      content: msg.content
    });
    await newMessage.save();

    if(msg.receiver){
      // Private message: send only to sender and receiver
      [msg.receiver, msg.sender].forEach(u => {
        if(users[u]) io.to(users[u]).emit("receive message", newMessage);
      });
    } else {
      // Public message
      io.emit("receive message", newMessage);
    }
  });

  socket.on("typing", data => {
    if(data.sender) {
      if(data.receiver){
        [data.receiver, data.sender].forEach(u => {
          if(users[u]) io.to(users[u]).emit("typing", data);
        });
      } else {
        socket.broadcast.emit("typing", data);
      }
    }
  });

  socket.on("disconnect", () => {
    if(currentUser){
      delete users[currentUser];
      io.emit("users update", Object.keys(users));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));