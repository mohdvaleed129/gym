const Notification = require("../models/Notification");
const Settings = require("../models/Settings");
const { send: sendViaProvider } = require("./notificationProvider");
const { formatDDMMMYYYY } = require("../utils/dateKolkata");
const { formatINR } = require("../utils/formatCurrency");

async function getSettings() {
  let s = await Settings.findById("settings");
  if (!s) s = await Settings.create({ _id: "settings" });
  return s;
}

function buildMessage(type, member, gymName) {
  const due = formatDDMMMYYYY(member.currentBillingEnd);

  switch (type) {
    case "reminder_before":
      return `${gymName}: Hi ${member.fullName}, a friendly reminder that your membership fee of ${formatINR(member.currentDueAmount)} is due on ${due}.`;

    case "due":
      return `${gymName}: Hi ${member.fullName}, your membership fee of ${formatINR(member.currentDueAmount)} is due today (${due}). Please pay at your earliest convenience.`;

    case "overdue":
      return `${gymName}: Hi ${member.fullName}, your membership fee of ${formatINR(member.currentDueAmount)} was due on ${due} and is now overdue. Please contact the gym.`;

    case "payment_confirmation":
      return `${gymName}: Hi ${member.fullName}, we've received your payment. Your next due date is ${due}.`;

    default:
      return `${gymName}: Hi ${member.fullName}, this is a message regarding your membership.`;
  }
}

/**
 * Creates (or returns the existing) notification for a member/type/billing
 * period, then attempts delivery through the configured provider. Dedupe
 * is enforced at the database level via a unique dedupeKey.
 */
async function queueAndSend({ member, type, triggeredBy }) {
  const settings = await getSettings();
  const channel = settings.reminders.preferredChannel;

  const dedupeKey = `${member._id}:${type}:${member.currentBillingStart.toISOString()}:${member.currentBillingEnd.toISOString()}`;

  const existing = await Notification.findOne({ dedupeKey });
  if (existing) {
    return { notification: existing, alreadyExisted: true };
  }

  const message = buildMessage(type, member, settings.gymName);

  const notification = await Notification.create({
    member: member._id,
    type,
    channel,
    billingStart: member.currentBillingStart,
    billingEnd: member.currentBillingEnd,
    scheduledAt: new Date(),
    status: "queued",
    dedupeKey,
    triggeredBy: triggeredBy?._id,
  });

  const result = await sendViaProvider(channel, member.mobile, message);

  if (result.success) {
    notification.status = "sent";
    notification.sentAt = new Date();
    notification.providerReference = result.providerReference;
  } else {
    notification.status = "failed";
    notification.errorMessage = result.errorMessage;
  }
  await notification.save();

  return { notification, alreadyExisted: false };
}

module.exports = { queueAndSend, getSettings, buildMessage };
