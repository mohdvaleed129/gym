const { todayKolkata, daysBetween } = require("./dateKolkata");

/**
 * Derives the live billing status for a member. Never trust a frontend
 * calculation of this - it is always recomputed from currentDueAmount and
 * currentBillingEnd on the backend.
 *
 * PAID    - nothing outstanding for the current cycle
 * DUE     - money outstanding, cycle has not yet ended
 * OVERDUE - money outstanding, cycle end date has passed
 * INACTIVE - member.status === 'inactive' (takes precedence over billing state)
 */
function getBillingStatus(member, settings, today = todayKolkata()) {
  if (member.status === "inactive") return "inactive";

  if (member.currentDueAmount <= 0) return "paid";

  const daysToDue = daysBetween(member.currentBillingEnd, today);
  if (daysToDue < 0) return "overdue";
  return "due";
}

/**
 * How many days overdue (positive number) or until due (negative = future).
 */
function getDaysOverdue(member, today = todayKolkata()) {
  return daysBetween(today, member.currentBillingEnd);
}

module.exports = { getBillingStatus, getDaysOverdue };
