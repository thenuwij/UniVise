import { handbookUrl, officialHandbookHref } from "@/shared/lib/handbook";
import { careerSectionUrl } from "@/features/program/utils/roadmapSteps";

export const canonicalType = (type) => (type === "program" ? "degree" : type);
export const typeAliases = (type) =>
  canonicalType(type) === "degree" ? ["degree", "program"] : [type];

export function snapshotOf(item) {
  try {
    const data =
      typeof item.item_data === "string"
        ? JSON.parse(item.item_data)
        : item.item_data;
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

export function categoryOf(item) {
  const type = canonicalType(item.item_type);
  if (type === "job_ad")
    return snapshotOf(item).kind === "internship" ? "internships" : "jobs";
  if (["internship", "internship_program"].includes(type)) return "internships";
  if (["event", "calendar", "networking"].includes(type)) return "networking";
  if (["degree", "major", "minor", "honours", "specialisation"].includes(type))
    return "programs";
  if (["society", "professional_body"].includes(type)) return "communities";
  return (
    {
      career_path: "careers",
      certification: "certifications",
      course: "courses",
    }[type] || "other"
  );
}

export const sydneyDate = (now = Date.now()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));

// No guessed years, ambiguous numeric dates or recurring month-only periods.
export function datedDay(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const date = new Date(`${text}T12:00:00Z`);
    return Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === text
      ? text
      : null;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(text))
    return Number.isFinite(Date.parse(text))
      ? sydneyDate(Date.parse(text))
      : null;
  const matches = [
    ...text.matchAll(
      /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(20\d{2})\b/gi,
    ),
  ];
  const match = matches.at(-1);
  if (!match) return null;
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  return datedDay(
    `${match[3]}-${String(months.indexOf(match[2].slice(0, 3).toLowerCase()) + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`,
  );
}

export function deadlineOf(item) {
  const data = snapshotOf(item);
  const event = ["event", "networking"].includes(item.item_type);
  const dates = event
    ? [
        data.end_at,
        data.ends_at,
        data.end_date,
        data.event_date,
        data.start_at,
        data.starts_at,
        data.date,
        data.date_label,
      ]
    : [
        data.closing_at,
        data.closing_date,
        data.expires_at,
        data.expiry_date,
        data.application_deadline,
        data.deadline,
        data.close_date,
      ];
  return dates.map(datedDay).find(Boolean) || null;
}

export function availabilityOf(item, now = Date.now()) {
  const data = snapshotOf(item);
  const deadline = deadlineOf(item);
  const today = sydneyDate(now);
  const timestampFields = ["event", "networking"].includes(item.item_type)
    ? [data.end_at, data.ends_at]
    : [data.closing_at, data.expires_at, data.application_deadline];
  const exactExpiry = timestampFields.find(
    (value) =>
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T/.test(value) &&
      Number.isFinite(Date.parse(value)),
  );
  if (exactExpiry && Date.parse(exactExpiry) < now)
    return {
      state: "expired",
      label: "Expired",
      reason: "The saved closing or end time has passed.",
      deadline,
    };
  if (
    snapshotOf(item)._shortlist?.closed === true ||
    data.closed === true ||
    data.is_closed === true ||
    ["closed", "expired", "cancelled"].includes(data.status?.toLowerCase?.())
  )
    return {
      state: "expired",
      label: "Expired",
      reason: "Marked closed or no longer available.",
      deadline,
    };
  if (deadline && deadline < today)
    return {
      state: "expired",
      label: "Expired",
      reason: ["event", "networking"].includes(item.item_type)
        ? "The saved event date has passed."
        : "The saved closing date has passed.",
      deadline,
    };
  if (deadline)
    return {
      state: "dated",
      label: ["event", "networking"].includes(item.item_type)
        ? "Event date"
        : "Closing date",
      reason: deadline,
      deadline,
    };
  if (item.item_type === "job_ad") {
    const posted = Date.parse(data.posted_at || item.saved_at);
    if (Number.isFinite(posted) && now - posted > 28 * 86400000)
      return {
        state: "check",
        label: "Check availability",
        reason: "This ad is over four weeks old. A closing date was not saved.",
        deadline: null,
      };
  }
  if (["event", "networking"].includes(item.item_type))
    return {
      state: "check",
      label: "Check event date",
      reason: "No exact event date was saved. Check the organiser’s page.",
      deadline: null,
    };
  return { state: "unknown", label: "", reason: "", deadline: null };
}

export function titleOf(item) {
  const data = snapshotOf(item);
  return (
    item.item_name ||
    data.title ||
    data.name ||
    data.program_name ||
    data.programName ||
    data.major_name ||
    data.code ||
    item.item_id ||
    "Saved item"
  );
}

function safeHref(value) {
  if (typeof value !== "string") return null;
  if (/^\/(?!\/)/.test(value) || /^https?:\/\//i.test(value))
    return officialHandbookHref(value);
  return null;
}

export function destinationOf(item) {
  const data = snapshotOf(item);
  const type = canonicalType(item.item_type);
  if (type === "course")
    return handbookUrl("courses", data.code || item.item_id, data.source_url);
  if (type === "degree")
    return handbookUrl(
      "programs",
      data.degree_code || item.item_id,
      data.source_url,
    );
  if (["major", "minor", "honours", "specialisation"].includes(type))
    return handbookUrl(
      "specialisations",
      data.major_code || data.minor_code || data.honours_code || item.item_id,
      data.source_url,
    );
  return (
    safeHref(data.url || data.apply_url || data.website || data.source_url) ||
    (type === "career_path" ? careerSectionUrl("career-outlook") : null)
  );
}
