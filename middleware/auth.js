const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect
 * ------------------------------------------------------------------
 * Verifies a JWT sent in the Authorization header ("Bearer <token>"),
 * loads the corresponding user from MongoDB, and attaches it to
 * req.user for downstream middleware/controllers.
 * ------------------------------------------------------------------
 */
const protect = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing or invalid.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.id assumes login/register signs the token as { id: user._id }.
    // Adjust the key below if your existing authController uses a different
    // payload field (e.g. decoded._id or decoded.userId).
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing or invalid.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Token missing or invalid.",
    });
  }
};

module.exports = { protect };
