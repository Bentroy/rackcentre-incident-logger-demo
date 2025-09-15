// controllers/adminController.js
const Incident = require("../models/Incident");
const User = require("../models/User");

// Get all incidents across all users
exports.getAllIncidents = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      type = '', 
      impact = '', 
      dateFrom = '', 
      dateTo = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    let filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) filter.type = type;
    if (impact) filter.impact = impact;
    
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    // Get incidents with user info
    const incidents = await Incident.find(filter)
      .populate('user', 'name email')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Incident.countDocuments(filter);

    res.json({
      incidents,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalIncidents: total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get statistics
exports.getIncidentStats = async (req, res) => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    
    // Incidents by type
    const byType = await Incident.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    
    // Incidents by impact
    const byImpact = await Incident.aggregate([
      { $group: { _id: "$impact", count: { $sum: 1 } } }
    ]);
    
    // Recent incidents (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentIncidents = await Incident.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      totalIncidents,
      totalUsers,
      recentIncidents,
      byType,
      byImpact
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Get incident count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const incidentCount = await Incident.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          incidentCount
        };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};