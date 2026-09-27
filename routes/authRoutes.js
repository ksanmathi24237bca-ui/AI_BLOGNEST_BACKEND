
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getProfile,
  getAdminData,
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/role");

const {
  registerValidation,
  loginValidation,
} = require("../middleware/validator");

// Public Routes
router.post("/register", registerValidation, registerUser);
router.post("/login", loginValidation, loginUser);

// Protected Routes
router.get("/profile", protect, getProfile);

// Admin Only Route
router.get("/admin", protect, authorizeRoles("admin"), getAdminData);

module.exports = router;