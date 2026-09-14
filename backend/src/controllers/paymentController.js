const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Member = require("../models/Member");
const { AppError } = require("../middleware/errorHandler");
const logAudit = require("../utils/auditLogger");
const { toDateOnlyUTC, addDuration } = require("../utils/dateKolkata");
const { queueAndSend } = require("../services/notificationService");
const Plan = require("../models/Plan");
const { formatINR } = require("../utils/formatCurrency");

// POST /api/payments
exports.recordPayment = async (req, res, next) => {
  try {
    const { memberId, amount, paymentDate, billingStart, billingEnd, method, reference, note } = req.body;

    const numericAmount = Number(amount);

    if (!memberId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new AppError("Payment amount must be greater than zero.", 400);
    }
    const allowedMethods = ["cash", "upi", "other"];

    if (!allowedMethods.includes(method)) {
      throw new AppError("Invalid payment method.", 400);
    }

    if (method === "upi" && !reference?.trim()) {
      throw new AppError("UPI transaction ID / UTR is required.", 400);
    }
    const member = await Member.findById(memberId).populate("plan");
    if (!member) throw new AppError("Member not found.", 404);
    if (paymentDate && Number.isNaN(new Date(paymentDate).getTime())) {
      throw new AppError("Invalid payment date.", 400);
    }

    const cycleStart = billingStart ? toDateOnlyUTC(billingStart) : member.currentBillingStart;
    const cycleEnd = billingEnd ? toDateOnlyUTC(billingEnd) : member.currentBillingEnd;

    if (cycleStart >= cycleEnd) {
      throw new AppError("Billing start date must be before the billing end date.", 400);
    }

    const matchesCurrentCycle =
    cycleStart.getTime() === member.currentBillingStart.getTime() &&
    cycleEnd.getTime() === member.currentBillingEnd.getTime();

    if (!matchesCurrentCycle) {
      throw new AppError(
        "This billing period does not match the member's current open cycle. Duplicate or out-of-sequence billing periods are not allowed.",
        409
      );
    }

    if (member.currentDueAmount <= 0) {
      throw new AppError("This billing period has already been fully paid.", 409);
    }

    if (Number(amount) > member.currentDueAmount + 0.01) {
      throw new AppError(
        `Payment cannot exceed the outstanding balance of ${formatINR(member.currentDueAmount)}.`,
        400
      );
    }

    const payment = await Payment.create({
      member: member._id,
      amount: numericAmount,
      paymentDate: paymentDate ? toDateOnlyUTC(paymentDate) : toDateOnlyUTC(new Date()),
      billingStart: cycleStart,
      billingEnd: cycleEnd,
      method,
      reference,
      note,
      createdBy: req.admin._id,
    });

    member.currentDueAmount = Math.max(0, member.currentDueAmount - Number(amount));

    let rolledOver = false;
    if (member.currentDueAmount <= 0) {
      // Cycle fully paid - advance to the next billing period.
      const plan = member.plan;
      const newStart = member.currentBillingEnd;
      const newEnd = addDuration(newStart, plan.durationType, plan.durationValue);
      member.currentBillingStart = newStart;
      member.currentBillingEnd = newEnd;
      member.currentDueAmount = member.feeAmount;
      rolledOver = true;
    }
    await member.save();

    await logAudit({
      admin: req.admin,
      action: "payment.created",
      entityType: "Payment",
      entityId: payment._id,
      details: `Recorded payment of ${formatINR(amount)} for ${member.fullName} (${member.memberCode}).`,    });

    // Payment confirmation notification - best-effort, never blocks the response.
    queueAndSend({ member, type: "payment_confirmation" }).catch((e) =>
      console.error("Failed to send payment confirmation:", e.message)
    );

    res.status(201).json({
      payment,
      member,
      rolledOver,
      nextDueDate: member.currentBillingEnd,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/payments
exports.listPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, memberId, status } = req.query;
    const query = {};
    if (memberId) query.member = memberId;
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate("member", "fullName memberCode")
        .sort({ paymentDate: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      payments,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/members/:id/payments
exports.getMemberPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ member: req.params.id })
      .populate("createdBy", "name")
      .sort({ paymentDate: -1 });
    res.status(200).json({ payments });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/payments/:id/void  { reason }
exports.voidPayment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason) throw new AppError("Please provide a reason for voiding this payment.", 400);

    const payment = await Payment.findById(req.params.id);
    if (!payment) throw new AppError("Payment not found.", 404);
    if (payment.status === "voided") throw new AppError("This payment has already been voided.", 409);

    const member = await Member.findById(payment.member).populate("plan");
    if (!member) throw new AppError("Member not found.", 404);

    payment.status = "voided";
    payment.voidedBy = req.admin._id;
    payment.voidedAt = new Date();
    payment.voidReason = reason;
    await payment.save();

    // Reverse the effect on the member's current cycle if it's still the
    // same cycle. If the cycle already rolled over, the reversal is recorded
    // via the audit log for manual reconciliation rather than silently
    // rewriting a closed, historical cycle.
    const sameCycle =
      payment.billingStart.getTime() === member.currentBillingStart.getTime() &&
      payment.billingEnd.getTime() === member.currentBillingEnd.getTime();

    if (sameCycle) {
      member.currentDueAmount = Math.min(member.feeAmount, member.currentDueAmount + payment.amount);
      await member.save();
    }

    await logAudit({
      admin: req.admin,
      action: "payment.voided",
      entityType: "Payment",
      entityId: payment._id,
      details: `Voided payment of ${payment.amount} for ${member.fullName} (${member.memberCode}). Reason: ${reason}. Same-cycle reversal applied: ${sameCycle}.`,
    });

    res.status(200).json({ payment, member, sameCycleReversalApplied: sameCycle });
  } catch (err) {
    next(err);
  }
};
