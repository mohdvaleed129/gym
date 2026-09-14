const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/reportController");
const { protect } = require("../middleware/auth");

router.get("/collection", protect, ctrl.getCollectionReport);
router.get("/members-summary", protect, ctrl.getMembersSummary);

module.exports = router;
