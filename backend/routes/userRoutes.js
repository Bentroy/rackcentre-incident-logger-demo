const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Ensure profile-pics folder exists
const profilePicsDir = path.join(__dirname, "../uploads/profile-pics");
if (!fs.existsSync(profilePicsDir)) {
  fs.mkdirSync(profilePicsDir, { recursive: true });
}

// Storage config for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profilePicsDir),
  filename: (req, file, cb) => {
    // Create unique filename: userId-timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.params.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// GET /api/users/profile - Get current user profile
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile-pic - Upload profile picture
router.put("/profile-pic", protect, upload.single("profilePic"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Find user and get current profile pic
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if it exists
    if (user.profilePic) {
      const oldPicPath = path.join(__dirname, "..", user.profilePic.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(oldPicPath)) {
        fs.unlinkSync(oldPicPath);
      }
    }

    // Update user with new profile picture path
    const profilePicPath = `/uploads/profile-pics/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: profilePicPath },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile picture updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("Error updating profile picture:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/profile-pic - Remove profile picture
router.delete("/profile-pic", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete profile picture file if it exists
    if (user.profilePic) {
      const picPath = path.join(__dirname, "..", user.profilePic.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(picPath)) {
        fs.unlinkSync(picPath);
      }
    }

    // Remove profile picture from user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: null },
      { new: true }
    ).select("-password");

    res.json({
      message: "Profile picture removed successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("Error removing profile picture:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;