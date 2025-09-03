const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
} = require("../controllers/incidentController");

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Routes
router.get("/", getIncidents);
router.post("/", upload.single("file"), createIncident);
router.put("/:id", upload.single("file"), updateIncident);
router.delete("/:id", deleteIncident);

module.exports = router;
