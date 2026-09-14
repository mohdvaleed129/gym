const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
