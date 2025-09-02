const Incident = require("../models/Incident");

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
      timestamp: Date.now(),
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
      timestamp: Date.now(),
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
