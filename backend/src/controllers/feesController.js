const Member = require("../models/Member");
const { getSettings } = require("../services/notificationService");
const { todayKolkata, daysBetween } = require("../utils/dateKolkata");
const { getBillingStatus, getDaysOverdue } = require("../utils/billing");

// GET /api/fees/due  - grouped due today / due soon / overdue
exports.getDueMembers = async (req, res, next) => {
  try {
    const settings = await getSettings();
    const today = todayKolkata();
    const beforeDays = settings.reminders.beforeDays;

    const members = await Member.find({ status: "active", currentDueAmount: { $gt: 0 } })
      .populate("plan", "name")
      .lean();

    const withStatus = members.map((m) => ({
      ...m,
      billingStatus: getBillingStatus(m, settings, today),
      daysOverdue: getDaysOverdue(m, today),
    }));

    const dueToday = withStatus.filter((m) => daysBetween(m.currentBillingEnd, today) === 0);
    const dueSoon = withStatus.filter((m) => {
      const d = daysBetween(m.currentBillingEnd, today);
      return d > 0 && d <= beforeDays;
    });
    const overdue = withStatus.filter((m) => m.billingStatus === "overdue");

    res.status(200).json({ dueToday, dueSoon, overdue });
  } catch (err) {
    next(err);
  }
};
