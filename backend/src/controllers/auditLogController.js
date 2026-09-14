const AuditLog = require("../models/AuditLog");

exports.listAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum),
      AuditLog.countDocuments(),
    ]);

    res.status(200).json({
      logs,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};
