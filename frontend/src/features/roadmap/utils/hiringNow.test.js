import { describe, expect, it } from "vitest";
import { postedAgo, sameCompany, splitAds } from "./hiringNow";

describe("postedAgo", () => {
  const now = new Date("2026-10-07T12:00:00Z").getTime();
  it("reads as days, then weeks", () => {
    expect(postedAgo("2026-10-07T01:00:00Z", now)).toBe("today");
    expect(postedAgo("2026-10-06T10:00:00Z", now)).toBe("1 day ago");
    expect(postedAgo("2026-10-03T12:00:00Z", now)).toBe("4 days ago");
    expect(postedAgo("2026-09-20T12:00:00Z", now)).toBe("2 weeks ago");
  });
});

describe("splitAds", () => {
  it("separates internship titles from jobs and keeps each ad once", () => {
    const ads = [
      { ad_id: "1", title: "Graduate Accountant" },
      { ad_id: "2", title: "Accounting Intern" },
      { ad_id: "1", title: "Graduate Accountant" },
      { ad_id: "3", title: "Summer Vacation Program - Audit" },
      { ad_id: "4", title: "Junior Accountant" },
      { ad_id: "5", title: "Graduate Tax Accountant" },
      { ad_id: "6", title: "Graduate Auditor" },
    ];
    const { jobs, internships } = splitAds(ads);
    expect(internships.map((a) => a.ad_id)).toEqual(["2", "3"]);
    expect(jobs.map((a) => a.ad_id)).toEqual(["1", "4", "5", "6"]);
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
