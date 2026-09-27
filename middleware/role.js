/**
 * authorizeRoles
 * ------------------------------------------------------------------
 * Reusable middleware factory for role-based access control.
 * Must run AFTER the `protect` middleware, since it relies on
 * req.user being already populated.
 *
 * Usage:
 *   router.get("/admin", protect, authorizeRoles("admin"), handler);
 *   router.get("/manage", protect, authorizeRoles("admin", "editor"), handler);
 * ------------------------------------------------------------------
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Insufficient permissions.",
      });
    }
  };
};

module.exports = { authorizeRoles };
