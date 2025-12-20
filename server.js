require('dotenv').config(); // Load environment variables
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./User');

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MongoDB Connection =================
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully ✅');
    } catch (err) {
        console.error('MongoDB connection failed ❌:', err.message);
        process.exit(1); // Stop the server if DB fails
    }
};

// ================= Middlewares =================
app.use(cors());
app.use(bodyParser.json());

// Middleware to check MongoDB connection before each request
app.use((req, res, next) => {
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
        return res.status(500).json({ success: false, message: "Database not connected" });
    }
    next();
});

// ================= Register Route =================
app.post('/register', async (req, res) => {
    const { firstName, lastName, phone, sex, password } = req.body;

    if (!firstName || !lastName || !phone || !sex || !password) {
        return res.json({ success: false, message: "All fields are required!" });
    }

    try {
        const exists = await User.findOne({ phone });
        if (exists) {
            return res.json({ success: false, message: "User with this phone already exists!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ firstName, lastName, phone, sex, password: hashedPassword });
        await newUser.save();

        return res.json({ success: true, message: "Account created successfully!" });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
});

// ================= Login Route =================
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.json({ success: false, message: "Phone and password are required!" });
    }

    try {
        const user = await User.findOne({ phone });
        if (!user) {
            return res.json({ success: false, message: "Incorrect phone or password!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Incorrect phone or password!" });
        }

        return res.json({ success: true, firstName: user.firstName, message: "Login successful!" });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
});

// ================= Start Server AFTER DB Connection =================
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} 🚀`);
    });
};

startServer();