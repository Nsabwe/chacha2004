const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // to access uploaded files

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mediaApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Media Schema
const mediaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['image', 'video', 'audio'], required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const Media = mongoose.model('Media', mediaSchema);

// ------------------- MULTER SETUP ------------------- //
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const mediaFolder = `uploads/${file.fieldname}`;
    fs.mkdirSync(mediaFolder, { recursive: true });
    cb(null, mediaFolder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const upload = multer({ storage });

// ------------------- ROUTES ------------------- //

// Register route
app.post('/register', async (req, res) => {
  const { phone, name, password } = req.body;

  try {
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({ phone, name, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    res.json({ message: 'Login successful', userId: user._id, name: user.name });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload picture
app.post('/upload/image/:userId', upload.single('image'), async (req, res) => {
  try {
    const media = new Media({
      userId: req.params.userId,
      type: 'image',
      filePath: req.file.path
    });
    await media.save();
    res.json({ message: 'Image uploaded', media });
  } catch (error) {
    res.status(500).json({ message: 'Upload error' });
  }
});

// Upload video
app.post('/upload/video/:userId', upload.single('video'), async (req, res) => {
  try {
    const media = new Media({
      userId: req.params.userId,
      type: 'video',
      filePath: req.file.path
    });
    await media.save();
    res.json({ message: 'Video uploaded', media });
  } catch (error) {
    res.status(500).json({ message: 'Upload error' });
  }
});

// Upload voice message
app.post('/upload/audio/:userId', upload.single('audio'), async (req, res) => {
  try {
    const media = new Media({
      userId: req.params.userId,
      type: 'audio',
      filePath: req.file.path
    });
    await media.save();
    res.json({ message: 'Audio uploaded', media });
  } catch (error) {
    res.status(500).json({ message: 'Upload error' });
  }
});

// Get all uploaded media by user
app.get('/media/:userId', async (req, res) => {
  try {
    const media = await Media.find({ userId: req.params.userId });
    res.json(media);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching media' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});