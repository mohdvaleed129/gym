const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/", ctrl.recordPayment);
router.get("/", ctrl.listPayments);
router.patch("/:id/void", ctrl.voidPayment);

module.exports = router;
