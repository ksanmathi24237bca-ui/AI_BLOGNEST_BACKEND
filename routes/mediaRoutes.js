const express = require("express");
const router = express.Router();

const {
  uploadMedia,
  getUploadedFiles,
  deleteUploadedFile,
} = require("../controllers/mediaController");

const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");
const upload = require("../middleware/upload");

// Upload image
router.post(
  "/upload",
  protect,
  authorizeRoles("admin", "editor", "author"),
  upload.single("image"),
  uploadMedia
);

// Get all uploaded files
router.get(
  "/",
  protect,
  authorizeRoles("admin", "editor", "author"),
  getUploadedFiles
);

// Delete uploaded file
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "editor", "author"),
  deleteUploadedFile
);

module.exports = router;