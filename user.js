import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  online: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);