const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ================= REGISTER USER =================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, bio, profileImage } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      bio,
      profileImage,
    });

    // Fetch user without password
    const userResponse = await User.findById(user._id).select("-password");

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: generateToken(user._id, user.role),
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed.",
    });
  }
};

// ================= LOGIN USER =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user with password for comparison
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Remove password from response
    const userResponse = await User.findById(user._id).select("-password");

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: generateToken(user._id, user.role),
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed.",
    });
  }
};

// ================= USER PROFILE =================
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= ADMIN DATA =================
const getAdminData = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Admin access granted.",
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  getAdminData,
};