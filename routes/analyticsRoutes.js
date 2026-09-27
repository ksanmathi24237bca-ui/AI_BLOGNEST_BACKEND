const express = require("express");
const router = express.Router();

const {
  getDashboardSummary,
  getTopBlogs,
  getTopAuthors,
  getBlogAnalytics,
} = require("../controllers/analyticsController");

// ✅ Correct middleware import
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

/* ================= DASHBOARD ================= */

// Dashboard summary
router.get(
  "/dashboard",
  protect,
  authorizeRoles("admin"),
  getDashboardSummary
);

// Top blogs
router.get(
  "/top-blogs",
  protect,
  authorizeRoles("admin"),
  getTopBlogs
);

// Top authors
router.get(
  "/top-authors",
  protect,
  authorizeRoles("admin"),
  getTopAuthors
);

// Single blog analytics
router.get(
  "/blog/:blogId",
  protect,
  authorizeRoles("admin", "editor", "author"),
  getBlogAnalytics
);

module.exports = router;