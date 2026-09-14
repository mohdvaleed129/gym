const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/feesController");
const { protect } = require("../middleware/auth");

router.get("/due", protect, ctrl.getDueMembers);

module.exports = router;
