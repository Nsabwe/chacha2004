import mongoose from 'mongoose';

// 1. Define the schema for a User
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 2. Optional: Add simple method (example)
userSchema.methods.checkPassword = function(password) {
  return password === this.password; // In production, use bcrypt!
};

// 3. Create the User model
const User = mongoose.model('User', userSchema);

// 4. Export the model
export default User;