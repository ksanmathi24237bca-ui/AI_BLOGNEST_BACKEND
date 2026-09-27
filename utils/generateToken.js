/**
 * utils/generateToken.js
 * AI BlogNest Backend
 */

const jwt = require("jsonwebtoken");

/**
 * Generate JWT Token
 * @param {string} userId - MongoDB User ID
 * @param {string} role - User Role
 * @returns {string} JWT Token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

module.exports = generateToken;