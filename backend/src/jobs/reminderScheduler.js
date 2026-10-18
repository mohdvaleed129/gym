
const cron = require("node-cron");
const Member = require("../models/Member");
const { queueAndSend, getSettings } = require("../services/notificationService");
const { todayKolkata, daysBetween } = require("../utils/dateKolkata");

async function runDailyReminderJob({ dryRun = process.env.REMINDER_DRY_RUN !== "false" } = {}) {
  const settings = await getSettings();
  const today = todayKolkata();

  const members = await Member.find({
    status: "active",
    currentDueAmount: { $gt: 0 },
  });

  const results = {
    checked: members.length,
    eligible: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    dryRun,
  };

  for (const member of members) {
    try {
      const daysToDue = daysBetween(member.currentBillingEnd, today);

      if (!settings.reminders.dueEnabled || daysToDue !== 0) {
        results.skipped++;
        continue;
      }

      results.eligible++;

      if (dryRun) {
        console.log(`[DRY RUN] Eligible: ${member.memberCode}`);
        continue;
      }

      const { notification, alreadyExisted } = await queueAndSend({
        member,
        type: "due",
      });

      if (alreadyExisted) results.skipped++;
      else if (notification.status === "sent") results.sent++;
      else results.failed++;
    } catch (err) {
      console.error(`Reminder job failed for ${member.memberCode}:`, err.message);
      results.failed++;
    }
  }

  console.log("Daily reminder job complete:", results);
  return results;
}

function scheduleDailyReminderJob() {
  cron.schedule(
    "0 9 * * *",
    () => runDailyReminderJob().catch((err) =>
      console.error("Reminder job crashed:", err.message)
    ),
    { timezone: "Asia/Kolkata" }
  );

  console.log(
    `BODY FLEX scheduler registered for 9:00 AM IST. Mode: ${
      process.env.REMINDER_DRY_RUN === "false" ? "LIVE SENDING" : "DRY RUN — no messages sent"
    }`
  );
}

module.exports = { runDailyReminderJob, scheduleDailyReminderJob };

if (require.main === module && process.argv.includes("--run-once")) {
  require("dotenv").config({
    path: require("path").resolve(__dirname, "../../.env"),
  });

  const connectDB = require("../config/db");
  const mongoose = require("mongoose");

  (async () => {
    try {
      await connectDB();

      const dryRun = process.env.REMINDER_DRY_RUN !== "false";
      const results = await runDailyReminderJob({ dryRun });

      if (results.failed > 0) process.exitCode = 1;
    } catch (err) {
      console.error("Reminder job failed:", err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })();
}

