import { describe, expect, it } from "vitest";
import { assignAds, postedAgo } from "./hiringNow";

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
