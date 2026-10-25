import { handbookUrl, officialHandbookHref } from "@/shared/lib/handbook";
import { careerSectionUrl } from "@/features/roadmap/utils/roadmapSteps";

export const PLANNING_STATES = {
  saved: "Exploring",
  next: "Next up",
  in_progress: "In progress",
  done: "Done",
};
export const CATEGORIES = {
  all: "Everything",
  jobs: "Jobs",
  internships: "Internships",
  careers: "Careers",
  certifications: "Certifications",
  networking: "Networking",
  courses: "Courses",
  programs: "Programs & majors",
  communities: "Communities",
  other: "Other",
};
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

export function planningOf(item) {
  const plan = snapshotOf(item)._shortlist || {};
  return {
    status: Object.hasOwn(PLANNING_STATES, plan.status) ? plan.status : "saved",
    target_date: datedDay(plan.target_date) || "",
    closed: plan.closed === true,
  };
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
    planningOf(item).closed ||
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

function nextDateOf(item) {
  return (
    [planningOf(item).target_date, deadlineOf(item)]
      .filter(Boolean)
      .sort()[0] || null
  );
}
export function isDueSoon(item, now = Date.now()) {
  if (
    planningOf(item).status === "done" ||
    availabilityOf(item, now).state === "expired"
  )
    return false;
  const date = nextDateOf(item);
  if (!date) return false;
  return date <= sydneyDate(now + 7 * 86400000);
}

export function filterItems(
  items,
  { category = "all", status = "all", query = "", sort = "recent" } = {},
  now = Date.now(),
) {
  const words = query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (category !== "all" && categoryOf(item) !== category) return false;
    const availability = availabilityOf(item, now).state;
    if (status === "attention" && !["expired", "check"].includes(availability))
      return false;
    if (status === "expired" && availability !== "expired") return false;
    if (status === "check" && availability !== "check") return false;
    if (status === "due" && !isDueSoon(item, now)) return false;
    if (
      Object.hasOwn(PLANNING_STATES, status) &&
      planningOf(item).status !== status
    )
      return false;
    return (
      !words ||
      `${titleOf(item)} ${item.personal_notes || ""} ${JSON.stringify(snapshotOf(item))}`
        .toLowerCase()
        .includes(words)
    );
  });
  return filtered.sort((a, b) =>
    sort === "date"
      ? (nextDateOf(a) || "9999").localeCompare(nextDateOf(b) || "9999")
      : sort === "name"
        ? titleOf(a).localeCompare(titleOf(b))
        : (Date.parse(b.saved_at) || 0) - (Date.parse(a.saved_at) || 0),
  );
}
