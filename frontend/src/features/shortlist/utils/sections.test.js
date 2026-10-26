import { describe, expect, it } from "vitest";
import { sectionByKey, sectionOf, sectionSummary, trackedData, trackOf } from "./sections";

const NOW = Date.parse("2026-10-26T02:00:00Z");
const item = (item_type, data = {}, extra = {}) => ({ id: item_type, item_type, item_id: item_type, item_data: data, saved_at: "2026-10-20T00:00:00Z", ...extra });

describe("shortlist sections", () => {
  it("groups jobs with internships and events with calendars", () => {
    expect(sectionOf(item("job_ad", { kind: "internship" })).key).toBe("jobs");
    expect(sectionOf(item("internship")).key).toBe("jobs");
    expect(sectionOf(item("calendar")).key).toBe("events");
    expect(sectionOf(item("degree")).key).toBe("programs");
    expect(sectionOf(item("mystery")).key).toBe("other");
  });

  it("maps old planning statuses onto each section's own steps", () => {
    expect(trackOf(item("job_ad", { _shortlist: { status: "in_progress" } })).status).toBe("applied");
    expect(trackOf(item("job_ad", { _shortlist: { status: "done" } })).status).toBe("offer");
    expect(trackOf(item("certification", { _shortlist: { status: "done" } })).status).toBe("earned");
    expect(trackOf(item("event", { _shortlist: { status: "done" } })).going).toBe(true);
    expect(trackOf(item("society", { _shortlist: { status: "done" } })).joined).toBe(true);
    expect(trackOf(item("course", { _shortlist: { status: "in_progress" } })).status).toBeNull();
  });

  it("records the applied date the first time a job is marked applied", () => {
    const job = item("job_ad", { title: "Graduate Engineer" });
    expect(trackedData(job, { status: "applied" }, NOW)._shortlist).toMatchObject({ status: "applied", applied_at: "2026-10-26" });
    const already = item("job_ad", { _shortlist: { status: "applied", applied_at: "2026-10-01" } });
    expect(trackedData(already, { status: "interview" }, NOW)._shortlist.applied_at).toBe("2026-10-01");
  });

  it("summarises each section with live counts", () => {
    const jobs = [
      item("job_ad", { _shortlist: { status: "applied" } }),
      item("job_ad", { _shortlist: { status: "interview" } }),
      item("job_ad", { closing_date: "2026-10-29" }),
    ];
    expect(sectionSummary(sectionByKey("jobs"), jobs, NOW)).toBe("1 applied · 1 interview · 1 closing this week");
    expect(sectionSummary(sectionByKey("careers"), [item("career_path")], NOW)).toBe("1 career · used for Certifications");
    expect(sectionSummary(sectionByKey("events"), [item("event", { event_date: "2026-11-02", _shortlist: { going: true } }), item("event", { event_date: "2026-10-01" })], NOW)).toBe("1 coming up · 1 going");
    expect(sectionSummary(sectionByKey("courses"), [], NOW)).toBe("Nothing saved yet");
  });
});
