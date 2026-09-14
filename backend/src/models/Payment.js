const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: "Member", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true },
    billingStart: { type: Date, required: true },
    billingEnd: { type: Date, required: true },
    method: { type: String, enum: ["cash", "upi", "other"], required: true },
    reference: { type: String, trim: true },
    note: { type: String, trim: true },

    // Immutable record. Corrections go through a void workflow, never delete/edit amount.
    status: { type: String, enum: ["active", "voided"], default: "active" },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    voidedAt: { type: Date },
    voidReason: { type: String, trim: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ member: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ member: 1, billingStart: 1, billingEnd: 1 });

paymentSchema.pre("validate", function (next) {
  if (this.billingStart && this.billingEnd && this.billingStart >= this.billingEnd) {
    return next(new Error("Billing start date must be before the billing end date."));
  }

  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
