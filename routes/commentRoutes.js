const express = require("express");
const router = express.Router();

const {
  createComment,
  getCommentsByBlog,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const { protect } = require("../middleware/auth");

// Create comment
router.post("/", protect, createComment);

// Get comments of a blog
router.get("/blog/:blogId", getCommentsByBlog);

// Update comment
router.put("/:id", protect, updateComment);

// Delete comment
router.delete("/:id", protect, deleteComment);

module.exports = router;