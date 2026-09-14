const Enquiry = require("../models/Enquiry");
const { AppError } = require("../middleware/errorHandler");

exports.createEnquiry = async (req, res, next) => {
  try {
    const { name, mobile, email, message } = req.body;
    if (!name || !mobile) throw new AppError("Name and mobile number are required.", 400);
    const enquiry = await Enquiry.create({ name, mobile, email, message });
    res.status(201).json({ message: "Thank you! We will get back to you soon.", enquiry });
  } catch (err) {
    next(err);
  }
};

exports.listEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ enquiries });
  } catch (err) {
    next(err);
  }
};
