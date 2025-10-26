// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      required: true,
      trim: true
    },
    receiver: {
      type: String,
      default: null, // null for public messages
      trim: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt
  }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;