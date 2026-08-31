const { ZodError } = require("zod");

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function validate(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body ?? {});
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
}

function notFound(req, res) {
  return res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }
  if (err.status && (err.status < 200 || err.status >= 400)) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.code === "23505") {
    return res.status(409).json({ error: "Duplicate value", detail: err.detail });
  }
  if (err.code === "23503") {
    return res.status(400).json({ error: "Referenced record not found", detail: err.detail });
  }
  if (err.code === "22P02") {
    return res.status(400).json({ error: "Invalid value format" });
  }
  return res.status(500).json({ error: "Internal server error" });
}

function err(message, status = 400, details) {
  const e = new Error(message);
  e.status = status;
  e.details = details;
  return e;
}

module.exports = { asyncHandler, validate, notFound, errorHandler, err };