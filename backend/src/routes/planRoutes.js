const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/planController");
const { protect } = require("../middleware/auth");

router.get("/", ctrl.listPlans); // public - membership page
router.post("/", protect, ctrl.createPlan);
router.put("/:id", protect, ctrl.updatePlan);

module.exports = router;
