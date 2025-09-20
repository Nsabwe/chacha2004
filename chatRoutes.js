const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const chat = require("../controllers/chatController");

router.post("/send", auth, chat.sendMessage);
router.get("/messages", auth, chat.getMessages);
router.post("/upload", auth, chat.upload, chat.uploadFile);

module.exports = router;