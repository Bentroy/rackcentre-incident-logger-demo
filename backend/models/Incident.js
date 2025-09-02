// models/Incident.js
const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: { type: Date, default: Date.now },  // auto timestamp
  type: String,
  impact: String,
  file: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Incident", IncidentSchema);
