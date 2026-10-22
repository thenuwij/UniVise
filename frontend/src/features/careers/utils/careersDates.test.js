import { describe, expect, it } from "vitest";
import { cleanDateLabel, isRecent, monthsUntilOpen, savedAdExpired, updatedLabel } from "./careersDates";

describe("updatedLabel", () => {
  const now = Date.parse("2026-10-21T02:00:00Z");

  it("counts Sydney calendar days, not hours", () => {
    expect(updatedLabel("2026-10-20T14:00:00Z", now)).toBe("Updated today");
    expect(updatedLabel("2026-10-20T12:00:00Z", now)).toBe("Updated yesterday");
    expect(updatedLabel("2026-10-17T02:00:00Z", now)).toBe("Updated 4 days ago");
  });

  it("returns nothing without a date", () => {
    expect(updatedLabel(null, now)).toBeNull();
  });
});

describe("monthsUntilOpen", () => {
  const october = new Date("2026-10-15T00:00:00");

  it("counts forward from the current month and wraps the year", () => {
    expect(monthsUntilOpen("October", october)).toBe(0);
    expect(monthsUntilOpen("February to March", october)).toBe(4);
    expect(monthsUntilOpen("Usually opens Aug", october)).toBe(10);
  });

  it("returns null when no month is named", () => {
    expect(monthsUntilOpen("Rolling", october)).toBeNull();
  });
});

describe("isRecent", () => {
  it("flags ads posted in the last two days", () => {
    const now = Date.parse("2026-10-21T00:00:00Z");
    expect(isRecent("2026-10-20T00:00:00Z", now)).toBe(true);
    expect(isRecent("2026-10-17T00:00:00Z", now)).toBe(false);
    expect(isRecent(null, now)).toBe(false);
  });
});

describe("savedAdExpired", () => {
  const now = Date.parse("2026-10-23T00:00:00Z");

  it("expires an ad four weeks after it was listed", () => {
    expect(savedAdExpired({ posted_at: "2026-09-24T00:00:00Z" }, "2026-10-20T00:00:00Z", now)).toBe(true);
    expect(savedAdExpired({ posted_at: "2026-09-26T00:00:00Z" }, "2026-09-26T00:00:00Z", now)).toBe(false);
  });

  it("counts from the save date when the listing date is unknown", () => {
    expect(savedAdExpired({ posted_at: null }, "2026-09-20T00:00:00Z", now)).toBe(true);
    expect(savedAdExpired({ posted_at: null }, "2026-10-10T00:00:00Z", now)).toBe(false);
  });

  it("never expires without any date", () => {
    expect(savedAdExpired({}, null, now)).toBe(false);
  });
});

describe("cleanDateLabel", () => {
  it("drops the short form SEEK adds in brackets", () => {
    expect(cleanDateLabel("Listed four hours ago (4h ago)")).toBe("Listed four hours ago");
    expect(cleanDateLabel("Listed two days ago")).toBe("Listed two days ago");
    expect(cleanDateLabel(null)).toBe("");
  });
});
