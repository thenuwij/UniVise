import { describe, expect, it } from "vitest";
import { groupJobs, jobFamily, OTHER_FAMILY } from "./jobFamilies";

describe("jobFamily", () => {
  it.each([
    ["IT Support – Graduate or Early Career", "IT support"],
    ["Graduate Electrical Engineer", "Electrical and electronics"],
    ["Data Centre Technician - Trainee Program (Australia)", "Networks and infrastructure"],
    ["IT Traineeship (Junior) - Helpdesk", "IT support"],
    ["Junior DevOps / Cloud Engineer", "Cloud and DevOps"],
    ["Network & Systems Engineer", "Networks and infrastructure"],
    ["Junior Data Analyst / Scientist", "Data and AI"],
    ["Graduate Software Engineer - Engine by Starling", "Software engineering"],
    ["Graduate Business Analyst", "Business and consulting"],
    ["Graduate Quantity Surveyor", "Civil and construction"],
    ["Graduate Cyber Security Analyst", "Cyber security"],
    ["Graduate Accountant", "Finance and accounting"],
    ["Barista", OTHER_FAMILY],
  ])("%s is %s", (title, family) => {
    expect(jobFamily(title)).toBe(family);
  });
});

describe("groupJobs", () => {
  it("puts the largest group first and other roles last", () => {
    const groups = groupJobs([
      { title: "Barista" },
      { title: "IT Support Analyst" },
      { title: "Helpdesk Officer" },
      { title: "Graduate Electrical Engineer" },
    ]);
    expect(groups.map((g) => [g.title, g.ads.length])).toEqual([
      ["IT support", 2],
      ["Electrical and electronics", 1],
      [OTHER_FAMILY, 1],
    ]);
  });
});
