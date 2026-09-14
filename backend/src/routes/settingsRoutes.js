const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/settingsController");
const { protect } = require("../middleware/auth");

router.get("/", ctrl.getSettings); // public - website branding
router.put("/", protect, ctrl.updateSettings);

module.exports = router;
