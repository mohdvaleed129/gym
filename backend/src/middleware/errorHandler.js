class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages[0] || "Invalid data submitted." });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return res.status(409).json({ message: `This ${field} is already in use.` });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Member not found." });
  }

  const status = err.statusCode || 500;
  const message = status === 500 ? "Something went wrong. Please try again." : err.message;
  res.status(status).json({ message });
}

module.exports = { errorHandler, AppError };
