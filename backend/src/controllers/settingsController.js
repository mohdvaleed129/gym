const Settings = require("../models/Settings");
const logAudit = require("../utils/auditLogger");

// GET /api/settings - public (branding + contact info for website)
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findById("settings");
    if (!settings) settings = await Settings.create({ _id: "settings" });
    res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings - protected
exports.updateSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findByIdAndUpdate("settings", req.body, {
      new: true,
      upsert: true,
      runValidators: true,
    });
    await logAudit({ admin: req.admin, action: "settings.updated", details: `${req.admin.name} updated gym settings.` });
    res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
};
