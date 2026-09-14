const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "settings" },
    gymName: { type: String, default: "BODY FLEX" },
    logoUrl: { type: String },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    openingHours: { type: String, default: "6:00 AM - 10:00 PM" },

    aboutText: { type: String, default: "" },
    philosophyText: { type: String, default: "" },

    defaultBillingDurationType: { type: String, enum: ["days", "months"], default: "months" },
    defaultBillingDurationValue: { type: Number, default: 1 },
    defaultFee: { type: Number, default: 1000 },

    reminders: {
      beforeEnabled: { type: Boolean, default: true },
      beforeDays: { type: Number, default: 3 },
      dueEnabled: { type: Boolean, default: true },
      afterEnabled: { type: Boolean, default: true },
      afterDays: { type: Number, default: 3 },
      preferredChannel: { type: String, enum: ["sms", "whatsapp"], default: "whatsapp" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
