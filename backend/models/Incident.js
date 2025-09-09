// models/Incident.js
const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  type: {
    type: String,
    required: true,
  },
  impact: {
    type: String,
    required: true,
  },
  file: String,
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  // ✅ Add user reference - each incident belongs to a user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User', // Reference to User model
  },
  // ✅ Store user info for quick access (optional but useful)
  userInfo: {
    name: String,
    email: String,
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model("Incident", IncidentSchema);