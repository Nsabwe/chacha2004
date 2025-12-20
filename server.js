const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./db'); // MongoDB connection
const User = require('./User'); // User model

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// ================= Register =================
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

        const newUser = new User({ firstName, lastName, phone, sex, password });
        await newUser.save();

        return res.json({ success: true, message: "Account created successfully!" });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
});

// ================= Login =================
app.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    if (!phone || !password) {
        return res.json({ success: false, message: "Phone and password are required!" });
    }

    try {
        const user = await User.findOne({ phone, password });
        if (user) {
            return res.json({ success: true, firstName: user.firstName, message: "Login successful!" });
        } else {
            return res.json({ success: false, message: "Incorrect phone or password!" });
        }
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
});

// ================= Start Server =================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});