const Plan = require("../models/Plan");
const { AppError } = require("../middleware/errorHandler");
const logAudit = require("../utils/auditLogger");
const { formatINR } = require("../utils/formatCurrency");

exports.listPlans = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    const query = activeOnly === "true" ? { active: true } : {};
    const plans = await Plan.find(query).sort({ fee: 1 });
    res.status(200).json({ plans });
  } catch (err) {
    next(err);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const { name, durationType, durationValue, fee } = req.body;

    if (!name || !durationType || !durationValue || fee === undefined) {
      throw new AppError("Please fill in all plan fields.", 400);
    }

    if (Number(fee) < 0) {
      throw new AppError("Fee must be zero or greater.", 400);
    }

    const plan = await Plan.create({
      name,
      durationType,
      durationValue: Number(durationValue),
      fee: Number(fee),
    });

    await logAudit({
      admin: req.admin,
      action: "plan.created",
      entityType: "Plan",
      entityId: plan._id,
      details: `Created plan "${plan.name}" (${formatINR(plan.fee)}).`,
    });

    res.status(201).json({ plan });
  } catch (err) {
    next(err);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) throw new AppError("Plan not found.", 404);

    const { name, durationType, durationValue, fee, active } = req.body;
    if (name !== undefined) plan.name = name;
    if (durationType !== undefined) plan.durationType = durationType;
    if (durationValue !== undefined) plan.durationValue = Number(durationValue);
    if (fee !== undefined) plan.fee = Number(fee);
    if (active !== undefined) plan.active = active;
    await plan.save();

    await logAudit({
      admin: req.admin,
      action: "plan.updated",
      entityType: "Plan",
      entityId: plan._id,
      details: `Updated plan "${plan.name}".`,
    });

    res.status(200).json({ plan });
  } catch (err) {
    next(err);
  }
};
