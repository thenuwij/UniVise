const SYDNEY = "Australia/Sydney";
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

const sydneyDay = (date) => {
  const [y, m, d] = new Date(date).toLocaleDateString("en-CA", { timeZone: SYDNEY }).split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
};

export function updatedLabel(updatedAt, now = Date.now()) {
  if (!updatedAt) return null;
  const days = sydneyDay(now) - sydneyDay(updatedAt);
  if (Number.isNaN(days)) return null;
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
}

export function monthsUntilOpen(period, now = new Date()) {
  const match = (period || "").toLowerCase().match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/);
  if (!match) return null;
  return (MONTHS.indexOf(match[1]) - now.getMonth() + 12) % 12;
}

export const isRecent = (postedAt, now = Date.now(), days = 2) =>
  !!postedAt && now - new Date(postedAt).getTime() <= days * 86400000;

const SAVED_AD_DAYS = 28;

export function savedAdExpired(ad, savedAt, now = Date.now()) {
  const from = ad?.posted_at || savedAt;
  if (!from) return false;
  return now - new Date(from).getTime() > SAVED_AD_DAYS * 86400000;
}

export const cleanDateLabel = (label) => (label || "").replace(/\s*\([^)]*\)\s*$/, "");
