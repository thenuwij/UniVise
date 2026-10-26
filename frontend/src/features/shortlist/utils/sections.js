import { careerSectionUrl, roadmapStepUrl } from "@/features/program/utils/roadmapSteps";
import { availabilityOf, categoryOf, datedDay, deadlineOf, snapshotOf, sydneyDate } from "./shortlist";

export const SECTIONS = [
  {
    key: "jobs",
    title: "Jobs & internships",
    categories: ["jobs", "internships"],
    statuses: { saved: "Saved", applied: "Applied", interview: "Interview", offer: "Offer", unsuccessful: "Not successful" },
    find: { label: "Find jobs", to: careerSectionUrl("jobs") },
  },
  {
    key: "certifications",
    title: "Certifications",
    categories: ["certifications"],
    statuses: { interested: "Interested", studying: "Studying", booked: "Exam booked", earned: "Earned" },
    find: { label: "Find certifications", to: careerSectionUrl("certifications") },
  },
  { key: "courses", title: "Courses", categories: ["courses"], find: { label: "Explore next courses", to: roadmapStepUrl("next") } },
  { key: "events", title: "Events", categories: ["networking"], find: { label: "Find events", to: careerSectionUrl("networking") } },
  { key: "careers", title: "Careers", categories: ["careers"], find: { label: "See career outlook", to: careerSectionUrl("career-outlook") } },
  { key: "programs", title: "Programs & majors", categories: ["programs"], find: { label: "Explore programs", to: "/roadmap" } },
  { key: "communities", title: "Societies & professional bodies", categories: ["communities"], find: { label: "Find societies", to: roadmapStepUrl("societies") } },
  { key: "other", title: "Other", categories: ["other"] },
];

const LEGACY_STATUS = {
  jobs: { saved: "saved", next: "saved", in_progress: "applied", done: "offer" },
  certifications: { saved: "interested", next: "interested", in_progress: "studying", done: "earned" },
};

export const sectionByKey = (key) => SECTIONS.find((s) => s.key === key) || null;

export const sectionOf = (item) => SECTIONS.find((s) => s.categories.includes(categoryOf(item))) || SECTIONS.at(-1);

export function trackOf(item) {
  const section = sectionOf(item);
  const plan = snapshotOf(item)._shortlist || {};
  const statuses = section.statuses;
  const status = statuses
    ? Object.hasOwn(statuses, plan.status)
      ? plan.status
      : LEGACY_STATUS[section.key][plan.status] || Object.keys(statuses)[0]
    : null;
  return {
    status,
    going: typeof plan.going === "boolean" ? plan.going : section.key === "events" && ["in_progress", "done"].includes(plan.status),
    joined: typeof plan.joined === "boolean" ? plan.joined : section.key === "communities" && plan.status === "done",
    target_date: datedDay(plan.target_date) || "",
    applied_at: datedDay(plan.applied_at) || "",
    closed: plan.closed === true,
  };
}

export function trackedData(item, change, now = Date.now()) {
  const data = snapshotOf(item);
  const next = { ...data._shortlist, ...trackOf(item), ...change };
  if (change.status === "applied" && !next.applied_at) next.applied_at = sydneyDate(now);
  return { ...data, _shortlist: next };
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function closingSoon(item, now) {
  const deadline = deadlineOf(item);
  return !!deadline && availabilityOf(item, now).state !== "expired" && deadline <= sydneyDate(now + 7 * 86400000);
}

export function isPastEvent(item, now = Date.now()) {
  return availabilityOf(item, now).state === "expired";
}

export function sectionSummary(section, items, now = Date.now()) {
  if (!items.length) return "Nothing saved yet";
  const count = (status) => items.filter((item) => trackOf(item).status === status).length;
  const parts = [];
  if (section.key === "jobs") {
    for (const [status, label] of [["applied", "applied"], ["interview", "interview"], ["offer", "offer"]]) {
      const n = count(status);
      if (n) parts.push(`${n} ${label}${status === "applied" ? "" : n === 1 ? "" : "s"}`);
    }
    const soon = items.filter((item) => trackOf(item).status === "saved" && closingSoon(item, now)).length;
    if (soon) parts.push(`${soon} closing this week`);
  } else if (section.key === "certifications") {
    for (const [status, label] of [["studying", "studying"], ["booked", "exam booked"], ["earned", "earned"]]) {
      const n = count(status);
      if (n) parts.push(`${n} ${label}`);
    }
  } else if (section.key === "events") {
    const upcoming = items.filter((item) => !isPastEvent(item, now));
    const going = upcoming.filter((item) => trackOf(item).going).length;
    if (upcoming.length) parts.push(`${upcoming.length} coming up`);
    if (going) parts.push(`${going} going`);
  } else if (section.key === "communities") {
    const joined = items.filter((item) => trackOf(item).joined).length;
    if (joined) parts.push(`${joined} joined`);
  } else if (section.key === "careers") {
    return `${plural(items.length, "career")} · used for Certifications`;
  }
  return parts.length ? parts.join(" · ") : `${items.length} saved`;
}
