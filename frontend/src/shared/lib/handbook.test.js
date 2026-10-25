import { describe, expect, it } from "vitest";
import { HANDBOOK_HOME, handbookUrl, officialHandbookHref } from "./handbook";

describe("official Handbook links", () => {
  it("routes codes and historical IDs through the publication resolver", () => {
    expect(handbookUrl("courses", "COMP1511")).toMatch(/\/handbook\/courses\/COMP1511$/);
    expect(officialHandbookHref("/course/a9a5a6c9-668d-40fb-8d04-268d583d3a18")).toContain("/handbook/courses/a9a5a6c9-668d-40fb-8d04-268d583d3a18");
    expect(officialHandbookHref("/degrees/3778")).toMatch(/\/handbook\/programs\/3778$/);
    expect(officialHandbookHref("/specialisation/minor/spec-id")).toMatch(/\/handbook\/specialisations\/spec-id$/);
  });
  it("preserves the study level but resolves the year of old official sources", () => {
    expect(officialHandbookHref(`${HANDBOOK_HOME}/postgraduate/courses/2026/COMP9021`)).toMatch(/\/handbook\/courses\/COMP9021\?level=postgraduate$/);
  });
  it("leaves planning, external and home links alone", () => {
    for (const href of ["/roadmap?program=3778", "https://www.unsw.edu.au", HANDBOOK_HOME, undefined]) {
      expect(officialHandbookHref(href)).toBe(href);
    }
    expect(handbookUrl("courses", null)).toBe(HANDBOOK_HOME);
  });
});
