const Payment = require("../models/Payment");
const Member = require("../models/Member");
const { todayKolkata } = require("../utils/dateKolkata");

// GET /api/reports/collection?range=daily|monthly&from=&to=
exports.getCollectionReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = { status: "active" };
    if (from || to) {
      match.paymentDate = {};
      if (from) match.paymentDate.$gte = new Date(from);
      if (to) match.paymentDate.$lte = new Date(to);
    }

    const daily = await Payment.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const monthly = await Payment.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$paymentDate" } }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({ daily, monthly });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/members-summary
exports.getMembersSummary = async (req, res, next) => {
  try {
    const today = todayKolkata();
    const [total, active, inactive, overdue, newThisMonth] = await Promise.all([
      Member.countDocuments({}),
      Member.countDocuments({ status: "active" }),
      Member.countDocuments({ status: "inactive" }),
      Member.countDocuments({ status: "active", currentDueAmount: { $gt: 0 }, currentBillingEnd: { $lt: today } }),
      Member.countDocuments({ createdAt: { $gte: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)) } }),
    ]);
    res.status(200).json({ total, active, inactive, overdue, newThisMonth });
  } catch (err) {
    next(err);
  }
};
