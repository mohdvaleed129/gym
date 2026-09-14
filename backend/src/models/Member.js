const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    memberCode: { type: String, required: true, unique: true }, // BF0001
    photoUrl: { type: String },
    fullName: { type: String, required: true, trim: true },
    dob: { type: Date },
    mobile: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    joiningDate: { type: Date, required: true },

    plan: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },
    planNameSnapshot: { type: String, required: true },
    feeAmount: { type: Number, required: true, min: 0 }, // current cycle fee

    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Current billing cycle tracking - backend is the source of truth for due dates.
    currentBillingStart: { type: Date, required: true },
    currentBillingEnd: { type: Date, required: true }, // == "next due date"
    currentDueAmount: { type: Number, required: true, min: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

memberSchema.index({ mobile: 1 });
memberSchema.index({ fullName: "text" });
memberSchema.index({ currentBillingEnd: 1 });
memberSchema.index({ status: 1 });

memberSchema.pre("validate", function (next) {
  if (
    this.currentBillingStart &&
    this.currentBillingEnd &&
    this.currentBillingStart >= this.currentBillingEnd
  ) {
    return next(
      new Error("Current billing start date must be before the billing end date.")
    );
  }

  next();
});

module.exports = mongoose.model("Member", memberSchema);
