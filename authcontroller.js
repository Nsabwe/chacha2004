const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  const { firstName, lastName, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ firstName, lastName });
  if (existing) return res.status(400).json({ msg: "User already exists" });

  const user = new User({ firstName, lastName, password: hashedPassword });
  await user.save();
  res.json({ msg: "Signup request sent. Wait for admin approval." });
};

exports.login = async (req, res) => {
  const { firstName, lastName, password } = req.body;
  const user = await User.findOne({ firstName, lastName });
  if (!user) return res.status(400).json({ msg: "User not found" });
  if (!user.isApproved) return res.status(403).json({ msg: "Not approved yet" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: "Incorrect password" });

  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET);
  res.json({ token, user: { firstName, lastName, id: user._id, isAdmin: user.isAdmin } });
};