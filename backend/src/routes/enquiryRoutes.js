const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/enquiryController");
const { protect } = require("../middleware/auth");

router.post("/", ctrl.createEnquiry); // public
router.get("/", protect, ctrl.listEnquiries);

module.exports = router;
