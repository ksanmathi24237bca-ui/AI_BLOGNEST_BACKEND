const express = require("express");
const router = express.Router();

const {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
} = require("../controllers/tagController");

const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

// Public routes
router.get("/", getTags);
router.get("/:id", getTagById);

// Protected routes — admin & editor only
router.post("/", protect, authorizeRoles("admin", "editor"), createTag);
router.put("/:id", protect, authorizeRoles("admin", "editor"), updateTag);
router.delete("/:id", protect, authorizeRoles("admin", "editor"), deleteTag);

module.exports = router;
