const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/memberController");
const paymentCtrl = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");
const { upload, processPhoto } = require("../middleware/photoUpload");

router.use(protect);

// Create member
router.post(
  "/",
  upload.single("photo"),
  processPhoto,
  ctrl.createMember
);

// List all members
router.get("/", ctrl.listMembers);

// Get a single member
router.get("/:id", ctrl.getMember);

// Extend member's billing due date
router.patch("/:id/extend-due-date", ctrl.extendDueDate);

// Update member details
router.put(
  "/:id",
  upload.single("photo"),
  processPhoto,
  ctrl.updateMember
);

// Update member status
router.patch("/:id/status", ctrl.setStatus);

// Delete member
router.delete("/:id", ctrl.deleteMember);

// Get member payment history
router.get("/:id/payments", paymentCtrl.getMemberPayments);

module.exports = router;