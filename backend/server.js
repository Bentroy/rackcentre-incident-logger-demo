// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // parse JSON body
// allow frontend to talk to backend
app.use(
  cors({
    origin: "http://localhost:5173", // React app URL
    credentials: true,
  })
);

// Connect Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Routes test
app.get("/", (req, res) => {
  res.send("Rack Centre Incident Logger API is running...");
});

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
