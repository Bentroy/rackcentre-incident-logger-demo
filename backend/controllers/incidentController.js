const Incident = require("../models/Incident");
const path = require("path");
const fs = require("fs");

// Get user's incidents only
exports.getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.json(incidents);
  } catch (err) {
    console.error("Error fetching incidents:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get ALL incidents (admin only)
exports.getAllIncidentsAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const incidents = await Incident.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(incidents);
  } catch (err) {
    console.error("Error fetching all incidents:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.createIncident = async (req, res) => {
  try {
    const incident = new Incident({
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      impact: req.body.impact,
      file: req.file ? `/uploads/${req.file.filename}` : null,
      timestamp: new Date().toISOString(),
      user: req.user.id,
      userInfo: {
        name: req.user.name,
        email: req.user.email,
      }
    });

    const saved = await incident.save();
    await saved.populate('user', 'name email');
    
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!incident) {
      return res.status(404).json({ 
        message: "Incident not found or you don't have permission to edit it" 
      });
    }

    const updateData = {
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      impact: req.body.impact,
      timestamp: new Date().toISOString(),
    };

    if (req.file) {
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

exports.deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!incident) {
      return res.status(404).json({ 
        message: "Incident not found or you don't have permission to delete it" 
      });
    }

    await Incident.findByIdAndDelete(req.params.id);

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

// Admin delete any incident
exports.adminDeleteIncident = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    await Incident.findByIdAndDelete(req.params.id);

    if (incident.file) {
      const filename = incident.file.replace('/uploads/', '');
      const filePath = path.join(__dirname, "../uploads", filename);
      
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete file:", err);
        }
      });
    }

    res.json({ message: "Incident deleted successfully" });
  } catch (err) {
    console.error("Error deleting incident:", err);
    res.status(500).json({ message: err.message });
  }
};