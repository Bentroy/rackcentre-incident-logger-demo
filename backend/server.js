// server.js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const userRoutes = require("./routes/userRoutes"); // ✅ Add user routes

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // parse JSON body

// ✅ Serve static files from uploads folder (including profile pics)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use("/api/incidents", incidentRoutes);
app.use("/api/users", userRoutes); // ✅ Add user routes

// Routes test
app.get("/", (req, res) => {
  res.send("Rack Centre Incident Logger API is running...");
});

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});