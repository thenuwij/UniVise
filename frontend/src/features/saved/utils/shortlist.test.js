import { describe, expect, it } from "vitest";
import {
  availabilityOf,
  categoryOf,
  datedDay,
  deadlineOf,
  destinationOf,
  filterItems,
  isDueSoon,
  planningOf,
  snapshotOf,
} from "./shortlist";
const now = Date.parse("2026-10-25T01:00:00Z");
const item = (type, data = {}, extra = {}) => ({
  id: "saved-1",
  item_type: type,
  item_id: "item-1",
  item_data: data,
  saved_at: "2026-10-20T00:00:00Z",
  ...extra,
});

describe("shortlist compatibility", () => {
  it("categorises legacy programs, minors, internship ads and unknown types", () => {
    expect(categoryOf(item("program"))).toBe("programs");
    expect(categoryOf(item("minor"))).toBe("programs");
    expect(categoryOf(item("job_ad", { kind: "internship" }))).toBe(
      "internships",
    );
    expect(categoryOf(item("legacy_type"))).toBe("other");
  });
  it("safely reads JSON snapshots and keeps malformed records visible", () => {
    expect(snapshotOf(item("course", '{"code":"COMP3222"}'))).toEqual({
      code: "COMP3222",
    });
    for (const data of ["broken JSON", null, [], "null"])
      expect(snapshotOf(item("course", data))).toEqual({});
    expect(filterItems([item("course", "broken JSON")])).toHaveLength(1);
  });
  it("uses official Handbook links and rejects unsafe source links", () => {
    expect(destinationOf(item("course", { code: "COMP3222" }))).toContain(
      "/handbook/courses/COMP3222",
    );
    expect(destinationOf(item("program", { degree_code: "3707" }))).toContain(
      "/handbook/programs/3707",
    );
    expect(
      destinationOf(item("event", { url: "javascript:alert(1)" })),
    ).toBeNull();
  });
});
describe("saved item expiry", () => {
  it("keeps date-only deadlines open throughout the Sydney closing day", () => {
    const job = item("job_ad", { closing_date: "2026-10-25" });
    expect(availabilityOf(job, now).state).toBe("dated");
    expect(availabilityOf(job, Date.parse("2026-10-25T13:01:00Z")).state).toBe(
      "expired",
    );
  });
  it("expires exact closing times on the same day", () => {
    expect(
      availabilityOf(
        item("job_ad", { expires_at: "2026-10-25T00:00:00Z" }),
        now,
      ).state,
    ).toBe("expired");
  });
  it("expires known events and uses the end of a dated range", () => {
    expect(
      availabilityOf(item("event", { event_date: "2026-10-24" }), now).state,
    ).toBe("expired");
    expect(
      deadlineOf(
        item("event", { date_label: "24 October 2026 to 26 October 2026" }),
      ),
    ).toBe("2026-10-26");
  });
  it("marks old ads for review without treating age as proof of expiry", () => {
    expect(
      availabilityOf(item("job_ad", { posted_at: "2026-09-01T00:00:00Z" }), now)
        .state,
    ).toBe("check");
    expect(
      availabilityOf(
        item("job_ad", {
          closing_date: "2026-11-01",
          posted_at: "2026-09-01T00:00:00Z",
        }),
        now,
      ).state,
    ).toBe("dated");
  });
  it("does not guess years or ambiguous/invalid dates", () => {
    expect(
      availabilityOf(
        item("internship", { application_period: "February to March" }),
        now,
      ).state,
    ).toBe("unknown");
    expect(
      availabilityOf(item("event", { date_label: "6 Nov, 6pm" }), now).state,
    ).toBe("check");
    expect(datedDay("2026-02-31")).toBeNull();
    expect(datedDay("03/04/2026")).toBeNull();
  });
  it("respects closed markers and leaves undated careers alone", () => {
    expect(
      availabilityOf(item("job_ad", { _shortlist: { closed: true } }), now)
        .state,
    ).toBe("expired");
    expect(availabilityOf(item("career_path"), now).state).toBe("unknown");
  });
});
describe("planning and filtering", () => {
  it("does not hide a nearby closing date behind a later personal target", () => {
    expect(
      isDueSoon(
        item("job_ad", {
          closing_date: "2026-10-27",
          _shortlist: { target_date: "2026-12-01" },
        }),
        now,
      ),
    ).toBe(true);
  });
  it("separates personal target dates from source expiry", () => {
    const course = item("course", {
      _shortlist: { status: "next", target_date: "2026-10-23" },
    });
    expect(isDueSoon(course, now)).toBe(true);
    expect(availabilityOf(course, now).state).toBe("unknown");
    expect(
      isDueSoon(
        item("course", {
          _shortlist: { status: "done", target_date: "2026-10-23" },
        }),
        now,
      ),
    ).toBe(false);
    expect(
      planningOf(
        item("course", {
          _shortlist: { status: "invalid", target_date: "2026-99-99" },
        }),
      ),
    ).toEqual({ status: "saved", target_date: "", closed: false });
  });
  it("searches notes, filters planning status and sorts dates before undated items", () => {
    const course = item(
      "course",
      {
        code: "COMP3222",
        _shortlist: { status: "next", target_date: "2026-11-01" },
      },
      { personal_notes: "Ask about FPGA projects" },
    );
    const cert = item(
      "certification",
      { name: "Cloud training" },
      { id: "saved-2" },
    );
    expect(
      filterItems(
        [course, cert],
        { query: "FPGA", category: "courses", status: "next" },
        now,
      ),
    ).toEqual([course]);
    expect(filterItems([cert, course], { sort: "date" }, now)).toEqual([
      course,
      cert,
    ]);
  });
  it("includes expired and uncertain items together in Needs review", () => {
    const expired = item("event", { event_date: "2026-10-24" });
    const check = item(
      "job_ad",
      { posted_at: "2026-09-01T00:00:00Z" },
      { id: "saved-2" },
    );
    expect(
      filterItems(
        [expired, check, item("course")],
        { status: "attention" },
        now,
      ),
    ).toHaveLength(2);
  });
});
