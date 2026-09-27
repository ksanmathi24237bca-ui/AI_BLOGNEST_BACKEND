const { body, validationResult } = require("express-validator");

/**
 * Reads express-validator's accumulated errors off the request and,
 * if any exist, short-circuits with the project's standard validation
 * error format. Must be the LAST middleware in every validation chain
 * below (after the individual `body(...)` rules, before the controller).
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

// ---------------------------------------------------
// User Validation
// ---------------------------------------------------
const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  validate,
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// ---------------------------------------------------
// Blog Validation
// ---------------------------------------------------
const blogValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("content").trim().notEmpty().withMessage("Content is required"),
  body("status")
    .optional()
    .isIn(["draft", "pending", "published", "scheduled"])
    .withMessage("Status must be one of: draft, pending, published, scheduled"),
  validate,
];

// ---------------------------------------------------
// Category Validation
// ---------------------------------------------------
const categoryValidation = [
  body("name").trim().notEmpty().withMessage("Category name is required"),
  validate,
];

// ---------------------------------------------------
// Tag Validation
// ---------------------------------------------------
const tagValidation = [
  body("name").trim().notEmpty().withMessage("Tag name is required"),
  validate,
];

// ---------------------------------------------------
// Comment Validation
// ---------------------------------------------------
const commentValidation = [
  body("comment")
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("Comment must be between 2 and 500 characters"),
  validate,
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  blogValidation,
  categoryValidation,
  tagValidation,
  commentValidation,
};
