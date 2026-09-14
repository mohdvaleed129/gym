const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/memberController");
const paymentCtrl = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");
const { upload, processPhoto } = require("../middleware/photoUpload");

router.use(protect);

router.post("/", upload.single("photo"), processPhoto, ctrl.createMember);
router.get("/", ctrl.listMembers);
router.get("/:id", ctrl.getMember);
router.put("/:id", upload.single("photo"), processPhoto, ctrl.updateMember);
router.patch("/:id/status", ctrl.setStatus);
router.delete("/:id", ctrl.deleteMember);
router.get("/:id/payments", paymentCtrl.getMemberPayments);

module.exports = router;
