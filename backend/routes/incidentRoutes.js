const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/authMiddleware"); // ✅ Import auth middleware
const {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentStats, // ✅ Optional stats endpoint
} = require("../controllers/incidentController");

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Create more unique filename with user ID
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userPrefix = req.user ? `user-${req.user.id}-` : '';
    cb(null, `${userPrefix}${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
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
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// ✅ All routes now require authentication
// GET /api/incidents - Get user's incidents
router.get("/", protect, getIncidents);

// POST /api/incidents - Create new incident
router.post("/", protect, upload.single("file"), createIncident);

// PUT /api/incidents/:id - Update user's incident
router.put("/:id", protect, upload.single("file"), updateIncident);

// DELETE /api/incidents/:id - Delete user's incident  
router.delete("/:id", protect, deleteIncident);

// ✅ Optional: Get user's incident statistics
router.get("/stats", protect, getIncidentStats);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  if (error.message.includes('Only images, PDFs, and documents are allowed!')) {
    return res.status(400).json({ message: 'Invalid file type. Only images, PDFs, and documents are allowed.' });
  }
  
  res.status(500).json({ message: error.message });
});

module.exports = router;