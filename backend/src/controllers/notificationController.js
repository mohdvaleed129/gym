const Notification = require("../models/Notification");
const Member = require("../models/Member");
const { AppError } = require("../middleware/errorHandler");
const { queueAndSend } = require("../services/notificationService");
const logAudit = require("../utils/auditLogger");

// POST /api/notifications/remind  { memberId, type }
exports.sendReminder = async (req, res, next) => {
  try {
    const { memberId, type } = req.body;
    if (!["reminder_before", "due", "overdue"].includes(type)) {
      throw new AppError("Invalid reminder type.", 400);
    }

    const member = await Member.findById(memberId);
    if (!member) throw new AppError("Member not found.", 404);

    // Never send an unpaid reminder to a member who has already paid this cycle.
    if (member.currentDueAmount <= 0) {
      throw new AppError("This member has already paid for the current billing period.", 409);
    }

    const { notification, alreadyExisted } = await queueAndSend({ member, type, triggeredBy: req.admin });

    await logAudit({
      admin: req.admin,
      action: "notification.reminder_sent",
      entityType: "Notification",
      entityId: notification._id,
      details: `Triggered ${type} reminder for ${member.fullName} (${member.memberCode}). Status: ${notification.status}.`,
    });

    res.status(alreadyExisted ? 200 : 201).json({ notification, alreadyExisted });
  } catch (err) {
    next(err);
  }
};

// GET /api/notifications
exports.listNotifications = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const query = {};
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate("member", "fullName memberCode")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Notification.countDocuments(query),
    ]);

    res.status(200).json({
      notifications,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/retry
exports.retryNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id).populate("member");
    if (!notification) throw new AppError("Notification not found.", 404);
    if (notification.status !== "failed") {
      throw new AppError("Only failed notifications can be retried.", 400);
    }

    const { send } = require("../services/notificationProvider");
    const { buildMessage, getSettings } = require("../services/notificationService");
    const settings = await getSettings();
    const message = buildMessage(notification.type, notification.member, settings.gymName);
    const result = await send(notification.channel, notification.member.mobile, message);

    if (result.success) {
      notification.status = "sent";
      notification.sentAt = new Date();
      notification.providerReference = result.providerReference;
      notification.errorMessage = undefined;
    } else {
      notification.errorMessage = result.errorMessage;
    }
    await notification.save();

    res.status(200).json({ notification });
  } catch (err) {
    next(err);
  }
};
