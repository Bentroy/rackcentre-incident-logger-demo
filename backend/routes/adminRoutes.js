// routes/adminRoutes.js
const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAllIncidents,
  getIncidentStats,
  getAllUsers
} = require("../controllers/adminController");
const { adminDeleteIncident } = require("../controllers/incidentController");

const router = express.Router();

// All admin routes require authentication + admin role
router.get("/incidents", protect, adminOnly, getAllIncidents);
router.get("/stats", protect, adminOnly, getIncidentStats);
router.get("/users", protect, adminOnly, getAllUsers);
router.delete("/incidents/:id", protect, adminOnly, adminDeleteIncident);

module.exports = router;