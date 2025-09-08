const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");

const router = express.Router();

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// PUT /api/users/:id/profile-pic
router.put("/:id/profile-pic", upload.single("profilePic"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profilePic: `/uploads/${req.file.filename}` },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
