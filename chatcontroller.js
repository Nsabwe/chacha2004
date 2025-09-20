const Message = require("../models/Message");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");

exports.sendMessage = async (req, res) => {
  const { text, receiverName } = req.body;
  let receiver = null;
  if (receiverName) {
    const [firstName, lastName] = receiverName.split(" ");
    receiver = await User.findOne({ firstName, lastName });
    if (!receiver) return res.status(404).json({ msg: "Receiver not found" });
  }

  const message = new Message({
    sender: req.user.id,
    receiver: receiver ? receiver._id : null,
    text,
    status: "✓"
  });
  await message.save();
  res.json({ msg: "Message sent" });
};

exports.getMessages = async (req, res) => {
  const messages = await Message.find({
    $or: [
      { receiver: null },
      { receiver: req.user.id },
      { sender: req.user.id }
    ]
  }).populate("sender", "firstName lastName")
    .populate("receiver", "firstName lastName");
  res.json(messages);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folder = file.mimetype.startsWith("audio") ? "uploads/voices" : "uploads/images";
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

exports.upload = multer({ storage }).single("file");

exports.uploadFile = async (req, res) => {
  const { receiverName } = req.body;
  let receiver = null;
  if (receiverName) {
    const [firstName, lastName] = receiverName.split(" ");
    receiver = await User.findOne({ firstName, lastName });
    if (!receiver) return res.status(404).json({ msg: "Receiver not found" });
  }

  const fileUrl = `/uploads/${req.file.mimetype.startsWith("audio") ? "voices" : "images"}/${req.file.filename}`;

  const message = new Message({
    sender: req.user.id,
    receiver: receiver ? receiver._id : null,
    status: "✓",
    image: req.file.mimetype.startsWith("image") ? fileUrl : null,
    voice: req.file.mimetype.startsWith("audio") ? fileUrl : null
  });
  await message.save();
  res.json({ msg: "File sent" });
};