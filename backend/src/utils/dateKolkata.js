/**
 * BODY FLEX stores all business dates (joiningDate, billingStart/End,
 * paymentDate, nextDueDate) as UTC-midnight Date objects that represent a
 * calendar day in Asia/Kolkata. India has a fixed UTC+5:30 offset with no
 * DST, so treating "YYYY-MM-DD" as the calendar date directly (rather than
 * doing timezone-aware arithmetic on wall-clock times) is both correct and
 * simple. Never mix this with browser-local Date math.
 */

const TIMEZONE = "Asia/Kolkata";

function toDateOnlyUTC(input) {
  const d = typeof input === "string" ? new Date(input) : input;
  // Normalize to the Kolkata calendar date, then store as UTC midnight of that date.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return new Date(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)));
}

function todayKolkata() {
  return toDateOnlyUTC(new Date());
}

function addDays(dateOnly, days) {
  const d = new Date(dateOnly);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function addMonths(dateOnly, months) {
  const d = new Date(dateOnly);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function addDuration(dateOnly, durationType, durationValue) {
  return durationType === "days" ? addDays(dateOnly, durationValue) : addMonths(dateOnly, durationValue);
}

function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  return Math.round((new Date(a) - new Date(b)) / MS);
}

function formatDDMMMYYYY(date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

module.exports = { TIMEZONE, toDateOnlyUTC, todayKolkata, addDays, addMonths, addDuration, daysBetween, formatDDMMMYYYY };
