const Incident = require("../models/Incident");
const path = require("path");
const fs = require("fs");

// Get all Incidents
exports.getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ date: -1 });
    res.json(incidents);
  } catch (err) {
    console.error("Error fetching incidents:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create Incident
exports.createIncident = async (req, res) => {
  try {
    const incident = new Incident({
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      impact: req.body.impact,
      file: req.file ? req.file.filename : null,
      timestamp: new Date().toISOString(), // ✅ use readable ISO string
    });

    const saved = await incident.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error creating incident:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update Incident
exports.updateIncident = async (req, res) => {
  try {
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      type: req.body.type,
      impact: req.body.impact,
      timestamp: new Date().toISOString(),
    };

    if (req.file) {
      updateData.file = req.file.filename;
    }

    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json(incident);
  } catch (err) {
    console.error("Error updating incident:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete Incident
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndDelete(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // ✅ If incident has a file, delete it from uploads folder
    if (incident.file) {
      const filePath = path.join(__dirname, "../uploads", incident.file);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete file:", err);
        } else {
          console.log("File deleted:", incident.file);
        }
      });
    }

    res.json({ message: "Incident deleted successfully" });
  } catch (err) {
    console.error("Error deleting incident:", err);
    res.status(500).json({ message: err.message });
  }
};
