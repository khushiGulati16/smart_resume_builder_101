// routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const {
  showAdminDashboard,
  showAdminUsers,
  deleteUser,
} = require("../controllers/adminController");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

// Admin main dashboard
router.get(
  "/",
  requireAuth,
  requireRole(["admin"]),
  showAdminDashboard
);

router.get(
  "/dashboard",
  requireAuth,
  requireRole(["admin"]),
  showAdminDashboard
);

// Admin: list all users
router.get(
  "/users",
  requireAuth,
  requireRole(["admin"]),
  showAdminUsers
);

// Admin: delete a user (AJAX)
router.delete(
  "/users/:id",
  requireAuth,
  requireRole(["admin"]),
  deleteUser
);

module.exports = router;
