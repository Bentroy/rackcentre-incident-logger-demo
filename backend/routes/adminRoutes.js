// routes/adminRoutes.js
const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAllIncidents,
  getIncidentStats,
  getAllUsers,
  deleteIncident,
  exportIncidents
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication + admin role
router.get("/incidents", protect, adminOnly, getAllIncidents);
router.get("/stats", protect, adminOnly, getIncidentStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.delete("/incidents/:id", protect, adminOnly, deleteIncident);
router.get("/export", protect, adminOnly, exportIncidents);

module.exports = router;