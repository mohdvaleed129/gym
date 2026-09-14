require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const Plan = require("../models/Plan");
const Settings = require("../models/Settings");
const Member = require("../models/Member");
const Payment = require("../models/Payment");
const { toDateOnlyUTC, addDuration, todayKolkata } = require("../utils/dateKolkata");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding BODY FLEX demo data...");

  // --- Admin ---
  const adminEmail = (process.env.ADMIN_EMAIL || "owner@bodyflex.in").toLowerCase();
  let admin = await Admin.findOne({ email: adminEmail });
  if (!admin) {
    admin = new Admin({ name: process.env.ADMIN_NAME || "Gym Owner", email: adminEmail });
    await admin.setPassword(process.env.ADMIN_PASSWORD || "ChangeMe123!");
    await admin.save();
    console.log(`Admin created: ${adminEmail}`);
  } else {
    console.log("Admin already exists, skipping.");
  }

  // --- Settings ---
  let settings = await Settings.findById("settings");
  if (!settings) {
    settings = await Settings.create({
      _id: "settings",
      gymName: "BODY FLEX",
      phone: "+91 98765 43210",
      email: "info@bodyflex.in",
      address: "12 MG Road, Bareilly, Uttar Pradesh",
      openingHours: "6:00 AM - 10:00 PM",
      aboutText:
        "BODY FLEX is a professional strength and conditioning facility built around clean equipment, expert coaching and a disciplined training environment.",
    });
    console.log("Settings created.");
  }

  // --- Plans ---
  const planDefs = [
    { name: "Monthly", durationType: "months", durationValue: 1, fee: 1000 },
    { name: "Quarterly", durationType: "months", durationValue: 3, fee: 2700 },
    { name: "Yearly", durationType: "months", durationValue: 12, fee: 10000 },
  ];
  const plans = {};
  for (const def of planDefs) {
    let plan = await Plan.findOne({ name: def.name });
    if (!plan) plan = await Plan.create(def);
    plans[def.name] = plan;
  }
  console.log("Plans ready.");

  // --- Demo members ---
  const existingCount = await Member.countDocuments({});
  if (existingCount > 0) {
    console.log(`${existingCount} member(s) already exist, skipping member seed.`);
    process.exit(0);
  }

  const today = todayKolkata();
  const monthly = plans["Monthly"];

  async function makeMember({ code, name, mobile, monthsAgoJoined, paidCycles, partialAmount, status = "active" }) {
    const joining = new Date(today);
    joining.setUTCMonth(joining.getUTCMonth() - monthsAgoJoined);

    let cycleStart = joining;
    let cycleEnd = addDuration(cycleStart, monthly.durationType, monthly.durationValue);

    const member = await Member.create({
      memberCode: code,
      fullName: name,
      mobile,
      joiningDate: joining,
      plan: monthly._id,
      planNameSnapshot: monthly.name,
      feeAmount: monthly.fee,
      status,
      currentBillingStart: cycleStart,
      currentBillingEnd: cycleEnd,
      currentDueAmount: monthly.fee,
      createdBy: admin._id,
    });

    // Fully pay `paidCycles` historical cycles, rolling the member's current cycle forward each time.
    for (let i = 0; i < paidCycles; i++) {
      await Payment.create({
        member: member._id,
        amount: monthly.fee,
        paymentDate: cycleStart,
        billingStart: cycleStart,
        billingEnd: cycleEnd,
        method: i % 2 === 0 ? "cash" : "upi",
        reference: i % 2 === 0 ? undefined : `TXN${1000 + i}`,
        createdBy: admin._id,
      });
      cycleStart = cycleEnd;
      cycleEnd = addDuration(cycleStart, monthly.durationType, monthly.durationValue);
    }

    member.currentBillingStart = cycleStart;
    member.currentBillingEnd = cycleEnd;
    member.currentDueAmount = monthly.fee;

    if (partialAmount) {
      await Payment.create({
        member: member._id,
        amount: partialAmount,
        paymentDate: cycleStart,
        billingStart: cycleStart,
        billingEnd: cycleEnd,
        method: "cash",
        createdBy: admin._id,
      });
      member.currentDueAmount = monthly.fee - partialAmount;
    }

    await member.save();
    return member;
  }

  // BF0001 - Active + Paid (just paid this cycle in full, well before due)
  await makeMember({ code: "BF0001", name: "Rahul Sharma", mobile: "9876500001", monthsAgoJoined: 2, paidCycles: 2 });

  // BF0002 - Active + Due (partially paid, cycle ending soon)
  const m2 = await makeMember({ code: "BF0002", name: "Priya Verma", mobile: "9876500002", monthsAgoJoined: 1, paidCycles: 0, partialAmount: 600 });

  // BF0003 - Active + Overdue (cycle ended, nothing paid)
  const m3 = await Member.create({
    memberCode: "BF0003",
    fullName: "Aman Gupta",
    mobile: "9876500003",
    joiningDate: (() => { const d = new Date(today); d.setUTCMonth(d.getUTCMonth() - 2); return d; })(),
    plan: monthly._id,
    planNameSnapshot: monthly.name,
    feeAmount: monthly.fee,
    status: "active",
    currentBillingStart: (() => { const d = new Date(today); d.setUTCMonth(d.getUTCMonth() - 1); d.setUTCDate(d.getUTCDate() - 5); return d; })(),
    currentBillingEnd: (() => { const d = new Date(today); d.setUTCDate(d.getUTCDate() - 5); return d; })(),
    currentDueAmount: monthly.fee,
    createdBy: admin._id,
  });

  // BF0004 - Active + Paid (long-standing member)
  await makeMember({ code: "BF0004", name: "Sneha Kapoor", mobile: "9876500004", monthsAgoJoined: 5, paidCycles: 5 });

  // BF0005 - Inactive
  await makeMember({ code: "BF0005", name: "Vikram Singh", mobile: "9876500005", monthsAgoJoined: 4, paidCycles: 1, status: "inactive" });

  console.log("Demo members BF0001-BF0005 created with realistic payment histories.");
  console.log(`\nLogin with: ${adminEmail} / ${process.env.ADMIN_PASSWORD || "ChangeMe123!"}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
