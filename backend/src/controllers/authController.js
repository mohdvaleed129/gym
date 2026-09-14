const Admin = require("../models/Admin");
const { signToken } = require("../utils/jwt");
const { AppError } = require("../middleware/errorHandler");
const logAudit = require("../utils/auditLogger");

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function sendToken(admin, res) {
  const token = signToken(admin._id);
  res.cookie("token", token, {
    expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.status(200).json({
    token,
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new AppError("Please provide email and password.", 400);

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!admin) throw new AppError("Invalid email or password.", 401);

    if (admin.isLocked()) {
      const mins = Math.ceil((admin.lockUntil - Date.now()) / 60000);
      throw new AppError(`Too many failed attempts. Please try again in ${mins} minute(s).`, 429);
    }
    if (!admin.isActive) throw new AppError("This account has been deactivated.", 403);

    const match = await admin.comparePassword(password);
    if (!match) {
      admin.failedLoginAttempts += 1;
      if (admin.failedLoginAttempts >= MAX_ATTEMPTS) {
        admin.lockUntil = Date.now() + LOCK_MS;
        admin.failedLoginAttempts = 0;
      }
      await admin.save();
      throw new AppError("Invalid email or password.", 401);
    }

    admin.failedLoginAttempts = 0;
    admin.lockUntil = undefined;
    admin.lastLoginAt = new Date();
    await admin.save();

    await logAudit({ admin, action: "admin.login", details: `${admin.name} logged in.` });

    sendToken(admin, res);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  res.cookie("token", "loggedout", { expires: new Date(Date.now() + 1000), httpOnly: true });
  if (req.admin) {
    await logAudit({ admin: req.admin, action: "admin.logout", details: `${req.admin.name} logged out.` });
  }
  res.status(200).json({ message: "Logged out successfully." });
};

exports.getMe = async (req, res) => {
  res.status(200).json({
    admin: { id: req.admin._id, name: req.admin.name, email: req.admin.email, role: req.admin.role },
  });
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id).select("+passwordHash");
    const match = await admin.comparePassword(currentPassword);
    if (!match) throw new AppError("Current password is incorrect.", 401);
    if (!newPassword || newPassword.length < 8) {
      throw new AppError("New password must be at least 8 characters.", 400);
    }
    await admin.setPassword(newPassword);
    await admin.save();
    await logAudit({ admin, action: "admin.password_changed", details: `${admin.name} changed their password.` });
    sendToken(admin, res);
  } catch (err) {
    next(err);
  }
};
