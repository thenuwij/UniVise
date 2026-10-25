import { describe, expect, it } from "vitest";
import { postedAgo, sameCompany } from "./hiringNow";

describe("postedAgo", () => {
  const now = new Date("2026-10-07T12:00:00Z").getTime();
  it("reads as days, then weeks", () => {
    expect(postedAgo("2026-10-07T01:00:00Z", now)).toBe("today");
    expect(postedAgo("2026-10-06T10:00:00Z", now)).toBe("1 day ago");
    expect(postedAgo("2026-10-03T12:00:00Z", now)).toBe("4 days ago");
    expect(postedAgo("2026-09-20T12:00:00Z", now)).toBe("2 weeks ago");
  });
});

describe("sameCompany", () => {
  it("ignores company suffixes but not different firms", () => {
    expect(sameCompany("Deloitte Australia", "Deloitte")).toBe(true);
    expect(sameCompany("SMEC Services Pty Limited", "SMEC")).toBe(true);
    expect(sameCompany("Atlassian Pty Ltd", "atlassian")).toBe(true);
    expect(sameCompany("Commonwealth Bank", "Commonwealth Bank of Australia")).toBe(true);
    expect(sameCompany("KPMG", "Deloitte")).toBe(false);
    expect(sameCompany("Bank", "Commonwealth Bank")).toBe(false);
    expect(sameCompany("", "Deloitte")).toBe(false);
  });
});
