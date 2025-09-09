const Incident = require("../models/Incident");
const path = require("path");
const fs = require("fs");

// Get all Incidents for the logged-in user
exports.getIncidents = async (req, res) => {
  try {
    // ✅ Only get incidents for the current user
    const incidents = await Incident.find({ user: req.user.id })
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate('user', 'name email'); // Populate user info if needed
    
    res.json(incidents);
  } catch (err) {
    console.error("Error fetching incidents:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create Incident for the logged-in user
exports.createIncident = async (req, res) => {
  try {
    const incident = new Incident({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      impact: req.body.impact,
      file: req.file ? `/uploads/${req.file.filename}` : null,
      timestamp: new Date().toISOString(),
      // ✅ Associate incident with the logged-in user
      user: req.user.id,
      userInfo: {
        name: req.user.name,
        email: req.user.email,
      }
    });

    const saved = await incident.save();
    
    // Populate user info before sending response
    await saved.populate('user', 'name email');
    
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update Incident (only if it belongs to the user)
exports.updateIncident = async (req, res) => {
  try {
    // ✅ Find incident that belongs to the current user
    const incident = await Incident.findOne({
      _id: req.params.id,
      user: req.user.id // Ensure user owns this incident
    });

    if (!incident) {
      return res.status(404).json({ 
        message: "Incident not found or you don't have permission to edit it" 
      });
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      impact: req.body.impact,
      timestamp: new Date().toISOString(),
    };

    if (req.file) {
      // Delete old file if it exists
      if (incident.file) {
        const oldFilename = incident.file.replace('/uploads/', '');
        const oldFilePath = path.join(__dirname, "../uploads", oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      updateData.file = `/uploads/${req.file.filename}`;
    }

    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user', 'name email');

    res.json(updatedIncident);
  } catch (err) {
    console.error("Error updating incident:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete Incident (only if it belongs to the user)
exports.deleteIncident = async (req, res) => {
  try {
    // ✅ Find and delete incident that belongs to the current user
    const incident = await Incident.findOne({
      _id: req.params.id,
      user: req.user.id // Ensure user owns this incident
    });

    if (!incident) {
      return res.status(404).json({ 
        message: "Incident not found or you don't have permission to delete it" 
      });
    }

    // Delete the incident
    await Incident.findByIdAndDelete(req.params.id);

    // Delete associated file if it exists
    if (incident.file) {
      const filename = incident.file.replace('/uploads/', '');
      const filePath = path.join(__dirname, "../uploads", filename);
      
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete file:", err);
        } else {
          console.log("File deleted:", filename);
        }
      });
    }

    res.json({ message: "Incident deleted successfully" });
  } catch (err) {
    console.error("Error deleting incident:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get incident statistics for the user (optional - for dashboard)
exports.getIncidentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total count
    const totalIncidents = await Incident.countDocuments({ user: userId });
    
    // Get count by impact level
    const impactStats = await Incident.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$impact", count: { $sum: 1 } } }
    ]);
    
    // Get count by type
    const typeStats = await Incident.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    
    // Get recent incidents (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentIncidents = await Incident.countDocuments({
      user: userId,
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      totalIncidents,
      recentIncidents,
      impactStats,
      typeStats
    });
  } catch (err) {
    console.error("Error fetching incident stats:", err);
    res.status(500).json({ message: err.message });
  }
};