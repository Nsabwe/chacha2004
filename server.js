require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: 'chris-uploads',
    resource_type: file.mimetype.startsWith('video') ? 'video' : 'auto',
    public_id: Date.now() + '-' + file.originalname,
  }),
});

const upload = multer({ storage });

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Message = mongoose.model('Message', new mongoose.Schema({
  type: String, // 'text', 'video', 'voice'
  content: String, // text or cloudinary URL
}));

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// POST /api/message
app.post('/api/message', async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'Content required' });

  const msg = new Message({ type: 'text', content });
  await msg.save();
  res.json({ message: 'Text message saved' });
});

// POST /api/upload/video
app.post('/api/upload/video', upload.single('video'), async (req, res) => {
  if (!req.file || !req.file.path) return res.status(400).json({ message: 'Upload failed' });

  const msg = new Message({ type: 'video', content: req.file.path });
  await msg.save();
  res.json({ message: 'Video uploaded', url: req.file.path });
});

// POST /api/upload/voice
app.post('/api/upload/voice', upload.single('voice'), async (req, res) => {
  if (!req.file || !req.file.path) return res.status(400).json({ message: 'Upload failed' });

  const msg = new Message({ type: 'voice', content: req.file.path });
  await msg.save();
  res.json({ message: 'Voice uploaded', url: req.file.path });
});

// GET /api/messages
app.get('/api/messages', async (req, res) => {
  const messages = await Message.find().sort({ _id: -1 });
  res.json(messages);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});