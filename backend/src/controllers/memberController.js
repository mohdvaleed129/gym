const mongoose = require("mongoose");
const Member = require("../models/Member");
const Plan = require("../models/Plan");
const Payment = require("../models/Payment");
const generateMemberCode = require("../utils/memberCode");
const { AppError } = require("../middleware/errorHandler");
const logAudit = require("../utils/auditLogger");
const { toDateOnlyUTC, addDuration } = require("../utils/dateKolkata");
const { getBillingStatus, getDaysOverdue } = require("../utils/billing");
const { queueAndSend } = require("../services/notificationService");

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

function serializeMember(member, settings, today) {
  const obj = member.toObject ? member.toObject() : member;
  return {
    ...obj,
    billingStatus: getBillingStatus(member, settings, today),
    daysOverdue: getDaysOverdue(member, today),
  };
}

// POST /api/members  (multipart/form-data if photo included)
exports.createMember = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const {
      fullName,
      dob,
      mobile,
      address,
      joiningDate,
      planId,
      feeAmount, // optional override of plan fee
      initialPayment, // { amount, method, reference, note } as JSON string in form-data
      status,
    } = req.body;

    if (!fullName?.trim() || !mobile || !joiningDate || !planId) {
      throw new AppError("Full name, mobile, joining date, and membership plan are required.", 400);
    }
    if (!INDIAN_MOBILE_REGEX.test(mobile)) {
      throw new AppError("Please enter a valid Indian mobile number.", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(planId)) {
      throw new AppError("Invalid membership plan.", 400);
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.active) throw new AppError("Selected membership plan is not available.", 400);

    const fee = feeAmount !== undefined && feeAmount !== "" ? Number(feeAmount) : plan.fee;
    if (isNaN(fee) || fee < 0) throw new AppError("Fee amount must be zero or greater.", 400);

    const existingMobile = await Member.findOne({ mobile, status: "active" });
    if (existingMobile) {
      // Warn but do not hard-block - duplicate mobile can be legitimate (family members).
      // Surface as a 409 the frontend can choose to confirm past.
      if (req.body.confirmDuplicateMobile !== "true") {
        throw new AppError(
          `A member with this mobile number already exists (${existingMobile.memberCode} - ${existingMobile.fullName}). Resubmit with confirmation to proceed.`,
          409
        );
      }
    }

    const joining = toDateOnlyUTC(joiningDate);
    const billingEnd = addDuration(joining, plan.durationType, plan.durationValue);
    const memberCode = await generateMemberCode();

    let parsedPayment = null;
    if (initialPayment) {
      parsedPayment = typeof initialPayment === "string" ? JSON.parse(initialPayment) : initialPayment;
    }
    const initialPaidAmount = parsedPayment ? Number(parsedPayment.amount) : 0;

    if (!Number.isFinite(initialPaidAmount) || initialPaidAmount < 0) {
      throw new AppError("Initial payment amount must be zero or greater.", 400);
    }

    if (initialPaidAmount > fee) {
      throw new AppError("Initial payment cannot exceed the fee amount.", 400);
    }
    if (parsedPayment) {
      const allowedMethods = ["cash", "upi", "other"];

      if (!allowedMethods.includes(parsedPayment.method)) {
        throw new AppError("Invalid initial payment method.", 400);
      }

      if (parsedPayment.method === "upi" && !parsedPayment.reference?.trim()) {
        throw new AppError("UPI transaction ID / UTR is required for the initial payment.", 400);
      }
    }
    const [member] = await Member.create(
      [{
        memberCode,
        photoUrl: req.photoUrl,
        fullName,
        dob: dob ? toDateOnlyUTC(dob) : undefined,
        mobile,
        address,
        joiningDate: joining,
        plan: plan._id,
        planNameSnapshot: plan.name,
        feeAmount: fee,
        status: status === "inactive" ? "inactive" : "active",
        currentBillingStart: joining,
        currentBillingEnd: billingEnd,
        currentDueAmount: fee - initialPaidAmount,
        createdBy: req.admin._id,
      }],
      { session }
    );

    if (parsedPayment && initialPaidAmount > 0) {
      await Payment.create(
        [{
          member: member._id,
          amount: initialPaidAmount,
          paymentDate: toDateOnlyUTC(new Date()),
          billingStart: joining,
          billingEnd,
          method: parsedPayment.method || "cash",
          reference: parsedPayment.reference,
          note: parsedPayment.note,
          createdBy: req.admin._id,
        }],
        { session }
      );
    }

    await session.commitTransaction();
    await logAudit({
      admin: req.admin,
      action: "member.created",
      entityType: "Member",
      entityId: member._id,
      details: `Created member ${member.fullName} (${member.memberCode}).`,
    });

    res.status(201).json({ member });
    } catch (err) {
      await session.abortTransaction();
      next(err);
    } finally {
      await session.endSession();
    }
  };

// GET /api/members
exports.listMembers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status, billingStatus, sortBy = "createdAt", sortDir = "desc" } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { fullName: new RegExp(search, "i") },
        { mobile: new RegExp(search, "i") },
        { memberCode: new RegExp(search, "i") },
      ];
    }

    const sortField = ["fullName", "joiningDate", "currentBillingEnd"].includes(sortBy) ? sortBy : "createdAt";
    const sort = { [sortField]: sortDir === "asc" ? 1 : -1 };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    let members = await Member.find(query)
      .populate("plan", "name")
      .sort(sort)
      .lean();

    const { getSettings } = require("../services/notificationService");
    const settings = await getSettings();
    const { todayKolkata } = require("../utils/dateKolkata");
    const today = todayKolkata();

    members = members.map((m) => serializeMember(m, settings, today));

    if (billingStatus) {
      members = members.filter((m) => m.billingStatus === billingStatus);
    }

    const total = members.length;
    const paged = members.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      members: paged,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/members/:id
exports.getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id).populate("plan", "name durationType durationValue fee");
    if (!member) throw new AppError("Member not found.", 404);

    const { getSettings } = require("../services/notificationService");
    const settings = await getSettings();
    const { todayKolkata } = require("../utils/dateKolkata");
    const today = todayKolkata();

    const payments = await Payment.find({ member: member._id }).sort({ paymentDate: -1 });
    const totalPaid = payments
      .filter((p) => p.status === "active")
      .reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      member: serializeMember(member, settings, today),
      payments,
      summary: {
        totalFee: member.feeAmount,
        totalPaid,
        currentDue: member.currentDueAmount,
        latestPayment: payments[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/members/:id
exports.updateMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) throw new AppError("Member not found.", 404);

    const { fullName, dob, mobile, address } = req.body;

    if (fullName !== undefined && !fullName.trim()) {
      throw new AppError("Member name cannot be empty.", 400);
    }

    if (mobile && !INDIAN_MOBILE_REGEX.test(mobile)) {
      throw new AppError("Please enter a valid Indian mobile number.", 400);
    }

    if (mobile && mobile !== member.mobile) {
      const existingMobile = await Member.findOne({
      mobile,
      status: "active",
      _id: { $ne: member._id },
    });

    if (existingMobile) {
      throw new AppError(
        `A member with this mobile number already exists (${existingMobile.memberCode} - ${existingMobile.fullName}).`,
        409
      );
    }
  }
    const changes = [];
    if (fullName && fullName !== member.fullName) { member.fullName = fullName; changes.push("name"); }
    if (dob) { member.dob = toDateOnlyUTC(dob); changes.push("date of birth"); }
    if (mobile && mobile !== member.mobile) { member.mobile = mobile; changes.push("mobile"); }
    if (address !== undefined && address !== member.address) { member.address = address; changes.push("address"); }
    if (req.photoUrl) { member.photoUrl = req.photoUrl; changes.push("photo"); }

    await member.save();

    if (changes.length) {
      await logAudit({
        admin: req.admin,
        action: "member.updated",
        entityType: "Member",
        entityId: member._id,
        details: `Updated ${changes.join(", ")} for ${member.fullName} (${member.memberCode}).`,
      });
    }

    res.status(200).json({ member });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/members/:id/status  { status: 'active'|'inactive' }
exports.setStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) throw new AppError("Invalid status.", 400);

    const member = await Member.findById(req.params.id);
    if (!member) throw new AppError("Member not found.", 404);

    member.status = status;
    await member.save();

    await logAudit({
      admin: req.admin,
      action: status === "inactive" ? "member.deactivated" : "member.activated",
      entityType: "Member",
      entityId: member._id,
      details: `${status === "inactive" ? "Deactivated" : "Activated"} ${member.fullName} (${member.memberCode}).`,
    });

    res.status(200).json({ member });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/members/:id
exports.deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      throw new AppError("Member not found.", 404);
    }

    // Keep an audit record before permanently removing the member.
    await logAudit({
      admin: req.admin,
      action: "member.deleted",
      entityType: "Member",
      entityId: member._id,
      details: `Permanently deleted member ${member.fullName} (${member.memberCode}).`,
    });

    // Remove all payment records belonging to this member.
    await Payment.deleteMany({ member: member._id });

    // Remove the member itself.
    await Member.deleteOne({ _id: member._id });

    res.status(200).json({
      message: "Member and associated payment records permanently deleted.",
    });
  } catch (err) {
    next(err);
  }
};
