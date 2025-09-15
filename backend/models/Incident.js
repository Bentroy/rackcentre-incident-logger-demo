const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema({
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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  userInfo: {
    name: String,
    email: String,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model("Incident", IncidentSchema);