const FULL = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  timeZone: "UTC",
});

function toUtcDate(year, month, day) {
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, day);
  return value;
}

// Input: { year, month, day } (month and day may be missing). Example: "Nov 25, 2026".
function formatDate(date) {
  if (!date?.year) return null;
  if (!date.month) return String(date.year);
  if (!date.day) return MONTH_YEAR.format(toUtcDate(date.year, date.month, 1));
  return FULL.format(toUtcDate(date.year, date.month, date.day));
}

export default formatDate;