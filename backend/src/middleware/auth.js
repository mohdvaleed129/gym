const { verifyToken } = require("../utils/jwt");
const Admin = require("../models/Admin");

async function protect(req, res, next) {
  try {
    let token;
    const header = req.headers.authorization;
    if (header && header.startsWith("Bearer ")) token = header.split(" ")[1];
    else if (req.cookies?.token) token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ message: "Your session has expired. Please log in again." });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Account no longer exists or is inactive." });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(500).json({ message: "Authentication failed." });
  }
}

module.exports = { protect };
