const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    type: {
      type: String,
      enum: ["reminder_before", "due", "overdue", "payment_confirmation"],
      required: true,
    },
    channel: { type: String, enum: ["sms", "whatsapp"], required: true },

    billingStart: { type: Date },
    billingEnd: { type: Date },

    scheduledAt: { type: Date, required: true },
    sentAt: { type: Date },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    providerReference: { type: String },
    errorMessage: { type: String },

    // Dedupe key prevents the scheduler from sending the same reminder twice
    // for the same member/type/billing period.
    dedupeKey: { type: String, required: true, unique: true },

    triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }, // set for manual "Send Reminder"
  },
  { timestamps: true }
);

notificationSchema.index({ member: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
