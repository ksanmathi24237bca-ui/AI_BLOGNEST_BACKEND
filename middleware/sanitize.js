/**
 * Escapes HTML-significant characters so stored/echoed strings can't
 * inject markup or script tags (basic XSS mitigation at the input layer).
 */
const escapeHtml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

/**
 * Recursively walks an object/array, trimming and HTML-escaping every
 * string value, and dropping any object key that starts with "$" or
 * contains "." — the two patterns MongoDB uses for query operators and
 * field paths, which is what NoSQL-injection payloads rely on
 * (e.g. { "email": { "$gt": "" } }).
 */
const deepSanitize = (input) => {
  if (Array.isArray(input)) {
    return input.map((item) => deepSanitize(item));
  }

  if (input && typeof input === "object" && !(input instanceof Date)) {
    const sanitizedObject = {};

    for (const key of Object.keys(input)) {
      // Strip dangerous Mongo-operator-style keys entirely
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      sanitizedObject[key] = deepSanitize(input[key]);
    }

    return sanitizedObject;
  }

  if (typeof input === "string") {
    return escapeHtml(input.trim());
  }

  return input;
};

/**
 * Sanitizes req.body, req.query, and req.params in place.
 * Apply globally in app.js, before routes hit any controller.
 */
const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = deepSanitize(req.body);
  }

  if (req.query && typeof req.query === "object") {
    const sanitizedQuery = deepSanitize(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, sanitizedQuery);
  }

  if (req.params && typeof req.params === "object") {
    req.params = deepSanitize(req.params);
  }

  next();
};

module.exports = { sanitizeInput, deepSanitize, escapeHtml };
