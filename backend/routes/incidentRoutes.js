const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  getAllIncidentsAdmin,
  adminDeleteIncident
} = require("../controllers/incidentController");

const router = express.Router();

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userPrefix = req.user ? `user-${req.user.id}-` : '';
    cb(null, `${userPrefix}${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images, PDFs, and documents are allowed!'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

// Admin route - must come first
router.get("/all", protect, adminOnly, getAllIncidentsAdmin);

// User routes
router.get("/", protect, getIncidents);
router.post("/", protect, upload.single("file"), createIncident);
router.put("/:id", protect, upload.single("file"), updateIncident);
router.delete("/:id", protect, deleteIncident);

// Admin delete route
router.delete("/admin/:id", protect, adminOnly, adminDeleteIncident);

module.exports = router;