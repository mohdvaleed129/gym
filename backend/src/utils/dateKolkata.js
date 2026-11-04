/**
 * BODY FLEX business dates use UTC midnight
 * representing calendar dates in Asia/Kolkata.
 */

const TIMEZONE = "Asia/Kolkata";

function toDateOnlyUTC(input) {
  const d = typeof input === "string" ? new Date(input) : input;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);

  const map = Object.fromEntries(
    parts.map((p) => [p.type, p.value])
  );

  return new Date(
    Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day)
    )
  );
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
  const source = new Date(dateOnly);

  const year = source.getUTCFullYear();
  const month = source.getUTCMonth() + months;
  const day = source.getUTCDate();

  const firstOfTarget = new Date(
    Date.UTC(year, month, 1)
  );

  const lastDay = new Date(
    Date.UTC(
      firstOfTarget.getUTCFullYear(),
      firstOfTarget.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  return new Date(
    Date.UTC(
      firstOfTarget.getUTCFullYear(),
      firstOfTarget.getUTCMonth(),
      Math.min(day, lastDay)
    )
  );
}

function addDuration(dateOnly, durationType, durationValue) {
  return durationType === "days"
    ? addDays(dateOnly, durationValue)
    : addMonths(dateOnly, durationValue);
}

function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;

  return Math.round(
    (new Date(a) - new Date(b)) / MS
  );
}

function formatDDMMMYYYY(date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

module.exports = {
  TIMEZONE,
  toDateOnlyUTC,
  todayKolkata,
  addDays,
  addMonths,
  addDuration,
  daysBetween,
  formatDDMMMYYYY,
};