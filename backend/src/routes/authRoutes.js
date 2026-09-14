const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many login attempts. Please try again later." },
});

router.post("/login", loginLimiter, ctrl.login);
router.post("/logout", protect, ctrl.logout);
router.get("/me", protect, ctrl.getMe);
router.patch("/update-password", protect, ctrl.updatePassword);

module.exports = router;
