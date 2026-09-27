const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategoryById);

// Protected routes — admin & editor only
router.post("/", protect, authorizeRoles("admin", "editor"), createCategory);
router.put("/:id", protect, authorizeRoles("admin", "editor"), updateCategory);
router.delete("/:id", protect, authorizeRoles("admin", "editor"), deleteCategory);

module.exports = router;
