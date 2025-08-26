// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // parse JSON body
app.use(cors());

// Connect Database
connectDB();

// Routes test
app.get("/", (req, res) => {
  res.send("Rack Centre Incident Logger API is running...");
});

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
