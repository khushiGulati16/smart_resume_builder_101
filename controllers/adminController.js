// controllers/adminController.js
const User = require("../models/userModel");
const { Resume } = require("../models/resumeModel");

// ---- Helper: compute high-level stats for admin dashboard ----
async function computeStats() {
  const usersCount = await User.countDocuments();
  const resumesCount = await Resume.countDocuments();
  const templatesUsed = (await Resume.distinct("template")).length;

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent24h = await Resume.countDocuments({
    createdAt: { $gte: since24h },
  });

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const last7Days = await Resume.countDocuments({
    createdAt: { $gte: since7d },
  });

  const mostUsed = await Resume.aggregate([
    { $group: { _id: "$template", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);

  return {
    usersCount,
    resumesCount,
    templatesUsed,
    recent24h,
    last7Days,
    mostUsedTemplate: mostUsed[0] ? mostUsed[0]._id : null,
  };
}

// ---- GET /admin or /admin/dashboard ----
exports.showAdminDashboard = async (req, res, next) => {
  try {
    const stats = await computeStats();

    const recentResumes = await Resume.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email")
      .lean();

    res.render("adminDashboard", {
      user: req.user,
      stats: {
        usersCount: stats.usersCount,
        resumesCount: stats.resumesCount,
        templatesUsed: stats.templatesUsed,
        recent24h: stats.recent24h,
        last7Days: stats.last7Days,
        mostUsedTemplate: stats.mostUsedTemplate,
      },
      recentResumes,
    });
  } catch (err) {
    next(err);
  }
};

// ---- GET /admin/users  → list all users (for admin users table) ----
exports.showAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.render("adminUsers", {
      user: req.user, // logged-in admin
      users,
    });
  } catch (err) {
    next(err);
  }
};

// ---- DELETE /admin/users/:id (AJAX from admin users table) ----
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (req.user && req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // Delete all resumes belonging to that user
    await Resume.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    return res.json({ success: true });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting user.",
    });
  }
};
