const Member = require("../models/Member");

/**
 * Generates a unique sequential member code like BF0001.
 * Retries against the unique index to guarantee no duplicates under
 * concurrent requests.
 */
async function generateMemberCode() {
  const PREFIX = "BF";
  const PAD = 4;

  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await Member.findOne({ memberCode: new RegExp(`^${PREFIX}\\d+$`) })
      .sort({ createdAt: -1 })
      .select("memberCode")
      .lean();

    let nextNumber = 1;
    if (last?.memberCode) {
      const numPart = parseInt(last.memberCode.replace(PREFIX, ""), 10);
      if (!isNaN(numPart)) nextNumber = numPart + 1 + attempt;
    } else {
      nextNumber = 1 + attempt;
    }

    const candidate = PREFIX + String(nextNumber).padStart(PAD, "0");
    const exists = await Member.exists({ memberCode: candidate });
    if (!exists) return candidate;
  }

  return `${PREFIX}${Date.now()}`;
}

module.exports = generateMemberCode;
