require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MongoDB Connection =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => {
    console.error('MongoDB connection failed ❌', err.message);
    process.exit(1);
  });

// ================= Middlewares =================
app.use(cors());
app.use(express.json());

// ================= User Model (Option A) =================
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  sex: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// ================= Register =================
app.post('/register', async (req, res) => {
  const { firstName, lastName, phone, sex, password } = req.body;

  if (!firstName || !lastName || !phone || !sex || !password) {
    return res.json({ success: false, message: "All fields are required!" });
  }

  try {
    const exists = await User.findOne({ phone });
    if (exists) {
      return res.json({ success: false, message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      firstName,
      lastName,
      phone,
      sex,
      password: hashedPassword,
    });

    res.json({ success: true, message: "Account created successfully!" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ================= Login =================
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.json({ success: false, message: "Phone and password required!" });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.json({ success: false, message: "Invalid credentials!" });
    }

    res.json({
      success: true,
      firstName: user.firstName,
      message: "Login successful!",
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error" });
  }
});

// ================= Start Server =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});