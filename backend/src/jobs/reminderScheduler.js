const cron = require("node-cron");
const Member = require("../models/Member");
const { queueAndSend, getSettings } = require("../services/notificationService");
const { todayKolkata, daysBetween } = require("../utils/dateKolkata");

/**
 * Runs once per member per eligible day. Idempotent via the Notification
 * model's unique dedupeKey - safe to re-run without creating duplicates.
 * One member failing does not stop the rest of the run.
 */
async function runDailyReminderJob() {
  const settings = await getSettings();
  const today = todayKolkata();

  const members = await Member.find({ status: "active", currentDueAmount: { $gt: 0 } });

  const results = { checked: members.length, sent: 0, failed: 0, skipped: 0 };

  for (const member of members) {
    try {
      const daysToDue = daysBetween(member.currentBillingEnd, today);

      let type = null;
      if (settings.reminders.beforeEnabled && daysToDue === settings.reminders.beforeDays) {
        type = "reminder_before";
      } else if (settings.reminders.dueEnabled && daysToDue === 0) {
        type = "due";
      } else if (settings.reminders.afterEnabled && daysToDue === -settings.reminders.afterDays) {
        type = "overdue";
      }

      if (!type) {
        results.skipped++;
        continue;
      }

      // Never remind a member who has already fully paid this cycle.
      if (member.currentDueAmount <= 0) {
        results.skipped++;
        continue;
      }

      const { notification, alreadyExisted } = await queueAndSend({ member, type });
      if (alreadyExisted) {
        results.skipped++;
      } else if (notification.status === "sent") {
        results.sent++;
      } else {
        results.failed++;
      }
    } catch (err) {
      console.error(`Reminder job failed for member ${member.memberCode}:`, err.message);
      results.failed++;
      // Continue to the next member - one failure must not stop the run.
    }
  }

  console.log("Daily reminder job complete:", results);
  return results;
}

function scheduleDailyReminderJob() {
  // Runs every day at 9:00 AM Asia/Kolkata.
  cron.schedule(
    "0 9 * * *",
    () => {
      runDailyReminderJob().catch((err) => console.error("Reminder job crashed:", err.message));
    },
    { timezone: "Asia/Kolkata" }
  );
}

module.exports = { runDailyReminderJob, scheduleDailyReminderJob };
