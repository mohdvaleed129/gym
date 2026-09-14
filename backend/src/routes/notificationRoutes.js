const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/remind", ctrl.sendReminder);
router.get("/", ctrl.listNotifications);
router.patch("/:id/retry", ctrl.retryNotification);

module.exports = router;
