const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/auditLogController");
const { protect } = require("../middleware/auth");

router.get("/", protect, ctrl.listAuditLogs);

module.exports = router;
