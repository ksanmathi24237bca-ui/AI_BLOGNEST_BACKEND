/**
 * Centralized error handler. Mount this LAST in app.js, after all
 * routes, so any error passed to next(err) — or thrown inside an
 * async controller wrapped in try/catch that calls next(err) — lands
 * here and gets converted into the project's standard error format.
 */
const errorHandler = (err, req, res, next) => {
  // Log full error server-side for debugging; response stays clean
  console.error(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors;

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation failed";
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose invalid ObjectId
  else if (err.name === "CastError") {
    statusCode = 404;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `${field} already exists`
      : "Duplicate field value entered";
  }

  // Unauthorized (custom errors should set err.name = "UnauthorizedError")
  else if (err.name === "UnauthorizedError" || statusCode === 401) {
    statusCode = 401;
    message = message || "Unauthorized";
  }

  // Forbidden (custom errors should set err.name = "ForbiddenError")
  else if (err.name === "ForbiddenError" || statusCode === 403) {
    statusCode = 403;
    message = message || "Forbidden";
  }

  // Multer upload errors
  else if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Image size must not exceed 5 MB";
    } else {
      message = err.message || "File upload error";
    }
  }

  // JSON body parser errors (malformed JSON payload)
  else if (err.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Invalid JSON payload";
  }

  const response = {
    success: false,
    message: statusCode === 500 ? "Internal Server Error" : message,
  };

  if (errors) {
    response.errors = errors;
  }

  // Include stack trace only outside production, for debugging
  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};

/**
 * 404 handler for unmatched routes. Mount this right before
 * errorHandler in app.js (after all real routes).
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
