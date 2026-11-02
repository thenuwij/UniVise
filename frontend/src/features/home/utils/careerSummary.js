import { mergeListings } from "@/features/career/utils/careersListings";

function rowState(count, states) {
  if (count > 0) return "ready";
  if (states.some((s) => s?.status === "running")) return "loading";
  if (states.some((s) => s?.status === "failed")) return "failed";
  if (states.some((s) => !s || s.status === "never" || s.stale)) return "loading";
  return "empty";
}

export function summariseSources(sources) {
  const items = (key, kind) => (sources[key]?.items || []).filter((item) => !kind || item.kind === kind);
  const row = (count, keys) => ({ count, state: rowState(count, keys.map((key) => sources[key])) });
  const jobs = mergeListings(items("ai_jobs"), items("adzuna", "job"));
  return {
    latestJobs: jobs.slice(0, 3),
    jobs: row(jobs.length, ["ai_jobs", "adzuna"]),
    internships: row(mergeListings(items("ai_internships"), items("adzuna", "internship")).length, ["ai_internships", "adzuna"]),
    events: row(items("ai_networking").filter((item) => item.kind !== "calendar").length, ["ai_networking"]),
  };
}
