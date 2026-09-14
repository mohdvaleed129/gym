const AuditLog = require("../models/AuditLog");

async function logAudit({ admin, action, entityType, entityId, details }) {
  try {
    await AuditLog.create({
      admin: admin?._id,
      adminName: admin?.name,
      action,
      entityType,
      entityId,
      details,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err.message);
  }
}

module.exports = logAudit;
