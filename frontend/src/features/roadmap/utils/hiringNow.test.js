import { describe, expect, it } from "vitest";
import { assignAds, pickOpenNow, postedAgo, sameCompany } from "./hiringNow";

const ad = (ad_id, search_words) => ({ ad_id, search_words, title: `Graduate ${search_words}` });

describe("assignAds", () => {
  it("gives each role up to two ads from its own search", () => {
    const roles = [{ ad_search: "software engineer" }, { ad_search: "data analyst" }];
    const ads = [ad("1", "software engineer"), ad("2", "data analyst"), ad("3", "software engineer"), ad("4", "software engineer")];
    expect(assignAds(roles, ads).map((picks) => picks.map((a) => a.ad_id))).toEqual([["1", "3"], ["2"]]);
  });

  it("never shows the same ad on two roles", () => {
    const roles = [{ ad_search: "accountant" }, { ad_search: "accountant" }];
    const ads = [ad("1", "accountant"), ad("2", "accountant"), ad("3", "accountant")];
    expect(assignAds(roles, ads).map((picks) => picks.map((a) => a.ad_id))).toEqual([["1", "2"], ["3"]]);
  });

  it("leaves a role empty when nothing matches, without borrowing other ads", () => {
    const roles = [{ ad_search: "policy officer" }, { title: "Role from an older roadmap" }];
    expect(assignAds(roles, [ad("1", "accountant")])).toEqual([[], []]);
  });
});

describe("postedAgo", () => {
  const now = new Date("2026-10-07T12:00:00Z").getTime();
  it("reads as days, then weeks", () => {
    expect(postedAgo("2026-10-07T01:00:00Z", now)).toBe("today");
    expect(postedAgo("2026-10-06T10:00:00Z", now)).toBe("1 day ago");
    expect(postedAgo("2026-10-03T12:00:00Z", now)).toBe("4 days ago");
    expect(postedAgo("2026-09-20T12:00:00Z", now)).toBe("2 weeks ago");
  });
});

describe("pickOpenNow", () => {
  it("puts internship titles first, keeps each ad once and stops at five", () => {
    const ads = [
      { ad_id: "1", title: "Graduate Accountant" },
      { ad_id: "2", title: "Accounting Intern" },
      { ad_id: "1", title: "Graduate Accountant" },
      { ad_id: "3", title: "Summer Vacation Program - Audit" },
      { ad_id: "4", title: "Junior Accountant" },
      { ad_id: "5", title: "Graduate Tax Accountant" },
      { ad_id: "6", title: "Graduate Auditor" },
    ];
    expect(pickOpenNow(ads).map((a) => a.ad_id)).toEqual(["2", "3", "1", "4", "5"]);
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
