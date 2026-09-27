
const express = require("express");
const router = express.Router();

const {
  generateBlog,
  summarizeBlog,
  generateFaq,
  weatherWiseIdeas,
  fitTrackIdeas,
} = require("../controllers/aiController");

// Correct middleware import
const { protect } = require("../middleware/auth");

// All AI routes require authentication
router.post("/generate-blog", protect, generateBlog);
router.post("/summarize", protect, summarizeBlog);
router.post("/generate-faq", protect, generateFaq);
router.post("/weatherwise", protect, weatherWiseIdeas);
router.post("/fittrack", protect, fitTrackIdeas);

module.exports = router;