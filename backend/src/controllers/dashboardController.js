const Member = require("../models/Member");
const Payment = require("../models/Payment");
const { todayKolkata } = require("../utils/dateKolkata");

// GET /api/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const today = todayKolkata();
    const startOfDay = today;
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const startOfMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

    const [totalMembers, activeMembers, dueTodayCount, overdueCount, todayCollectionAgg, monthCollectionAgg, recentPayments] =
      await Promise.all([
        Member.countDocuments({}),
        Member.countDocuments({ status: "active" }),
        Member.countDocuments({ status: "active", currentDueAmount: { $gt: 0 }, currentBillingEnd: startOfDay }),
        Member.countDocuments({ status: "active", currentDueAmount: { $gt: 0 }, currentBillingEnd: { $lt: startOfDay } }),
        Payment.aggregate([
          { $match: { status: "active", paymentDate: { $gte: startOfDay, $lte: endOfDay } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          { $match: { status: "active", paymentDate: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.find({ status: "active" })
          .populate("member", "fullName memberCode")
          .sort({ paymentDate: -1 })
          .limit(10),
      ]);

    res.status(200).json({
      totalMembers,
      activeMembers,
      dueToday: dueTodayCount,
      overdue: overdueCount,
      todaysCollection: todayCollectionAgg[0]?.total || 0,
      monthlyCollection: monthCollectionAgg[0]?.total || 0,
      recentPayments,
    });
  } catch (err) {
    next(err);
  }
};
