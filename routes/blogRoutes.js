const express = require("express");
const router = express.Router();

const {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  searchBlogs,
  likeBlog,
  incrementViews,
  getTrendingBlogs,
  getLatestBlogs,
} = require("../controllers/blogController");

const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");
const { blogValidation } = require("../middleware/validator");

// ======================= PUBLIC ROUTES =======================

// Get all published blogs
router.get("/", getAllBlogs);

// Search blogs
router.get("/search", searchBlogs);

// Trending blogs
router.get("/trending", getTrendingBlogs);

// Latest blogs
router.get("/latest", getLatestBlogs);

// Get blog by slug
router.get("/slug/:slug", getBlogBySlug);

// Get single blog by ID
router.get("/:id", getBlogById);

// ===================== PROTECTED ROUTES ======================

// Create blog
router.post(
  "/",
  protect,
  authorizeRoles("admin", "author", "editor"),
  blogValidation,
  createBlog
);

// Update blog
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "author", "editor"),
  blogValidation,
  updateBlog
);

// Delete blog
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "author"),
  deleteBlog
);

// Like blog
router.patch("/:id/like", protect, likeBlog);

// Increment views
router.patch("/:id/view", incrementViews);

module.exports = router;