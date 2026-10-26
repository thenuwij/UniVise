import { describe, expect, it } from "vitest";
import {
  availabilityOf,
  categoryOf,
  datedDay,
  deadlineOf,
  destinationOf,
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
    expect(categoryOf(item("course", "broken JSON"))).toBe("courses");
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
