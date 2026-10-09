import { describe, expect, it } from "vitest";
import { ADDED_SECTION, matchesRule, showsOnCourses, tidySections, myCourseCodes, notNeededCodes, openRequirementParts, orderSections, ruleCheck, rulePatterns, progressOf, requiredCount, sectionProgress, splitCourses, withAddedCourses } from "./myCourses";

const typed = [
  {
    key: "3778",
    sections: [
      {
        title: "Core Courses",
        kind: "core",
        courses: [
          { code: "COMP1511", kind: "core" },
          { code: "MATH1131", kind: "choice", choice: "Core Courses 1" },
          { code: "MATH1141", kind: "choice", choice: "Core Courses 1" },
        ],
      },
      { title: "Computing Electives", kind: "elective", courses: [{ code: "COMP3311", name: "Database Systems", uoc: 6, kind: "elective" }, { code: "COMP6080", kind: "elective" }] },
    ],
  },
];

const none = new Set();

describe("splitCourses", () => {
  it("separates core courses, choice groups and electives", () => {
    const mine = splitCourses(typed);

    expect(mine.required).toEqual(["COMP1511"]);
    expect(mine.choiceGroups).toEqual([{ key: "3778:Core Courses 1", codes: ["MATH1131", "MATH1141"] }]);
    expect(mine.options.map((o) => o.code)).toEqual(["COMP3311", "COMP6080"]);
    expect(mine.options[0]).toEqual({ code: "COMP3311", name: "Database Systems", uoc: 6, section: "Computing Electives" });
    expect(requiredCount(mine)).toBe(2);
  });

  it("treats sections without types as required, as before the import", () => {
    const mine = splitCourses([{ key: "3778", sections: [{ title: "Core", courses: [{ code: "COMP1511" }, { code: "COMP2521" }] }] }]);

    expect(mine.required).toEqual(["COMP1511", "COMP2521"]);
    expect(mine.choiceGroups).toEqual([]);
    expect(mine.options).toEqual([]);
  });
});

describe("a student's courses", () => {
  const mine = splitCourses(typed);

  it("shows core courses and alternatives, plus electives only once added or done", () => {
    expect(myCourseCodes(mine, none, none)).toEqual(["COMP1511", "MATH1131", "MATH1141"]);
    expect(myCourseCodes(mine, none, new Set(["COMP3311"]))).toContain("COMP3311");
    expect(myCourseCodes(mine, new Set(["COMP6080"]), none)).toContain("COMP6080");
  });

  it("marks the other alternatives as not needed once one is done or added", () => {
    expect(notNeededCodes(mine, none, none).size).toBe(0);
    expect([...notNeededCodes(mine, new Set(["MATH1131"]), none)]).toEqual(["MATH1141"]);
    expect([...notNeededCodes(mine, none, new Set(["MATH1141"]))]).toEqual(["MATH1131"]);
  });

  it("counts a choice group once and adds chosen electives to the total", () => {
    expect(progressOf(mine, none, none)).toEqual({ done: 0, total: 2 });
    expect(progressOf(mine, new Set(["COMP1511", "MATH1131"]), none)).toEqual({ done: 2, total: 2 });
    expect(progressOf(mine, new Set(["MATH1131"]), new Set(["COMP3311"]))).toEqual({ done: 1, total: 3 });
  });
});

describe("withAddedCourses", () => {
  const mine = { required: ["COMP1511"], choiceGroups: [{ key: "x", codes: ["MATH1131", "MATH1141"] }], options: [{ code: "COMP3121", section: "Electives" }] };

  it("adds courses from outside the program lists as options", () => {
    const result = withAddedCourses(mine, [{ code: "COMP4418", name: "Knowledge Representation", uoc: 6 }]);
    expect(result.options.at(-1)).toEqual({ code: "COMP4418", name: "Knowledge Representation", uoc: 6, section: ADDED_SECTION });
  });

  it("ignores added courses the program already lists", () => {
    const result = withAddedCourses(mine, [{ code: "COMP3121" }, { code: "COMP1511" }, { code: "MATH1141" }]);
    expect(result).toBe(mine);
  });

  it("an added outside course counts in the plan", () => {
    const result = withAddedCourses(mine, [{ code: "COMP4418" }]);
    expect(myCourseCodes(result, new Set(), new Set(["COMP4418"]))).toContain("COMP4418");
  });
});

describe("sectionProgress", () => {
  it("counts core courses and one per choice group", () => {
    const section = { title: "Core", courses: [{ code: "A" }, { code: "B" }, { code: "C", choice: "1" }, { code: "D", choice: "1" }] };
    expect(sectionProgress(section, new Set(["A", "D"]), new Set())).toEqual({ done: 2, total: 3 });
  });

  it("counts only the electives you picked or finished", () => {
    const section = { title: "Electives", kind: "elective", courses: [{ code: "A" }, { code: "B" }, { code: "C" }] };
    expect(sectionProgress(section, new Set(["A"]), new Set(["B"]))).toEqual({ done: 1, total: 2 });
    expect(sectionProgress(section, new Set(), new Set())).toEqual({ done: 0, total: 0 });
  });

  it("counts every added course", () => {
    const section = { title: ADDED_SECTION, courses: [{ code: "A" }, { code: "B" }] };
    expect(sectionProgress(section, new Set(["B"]), new Set())).toEqual({ done: 1, total: 2 });
  });
});

describe("orderSections", () => {
  it("sorts by level and puts 0 UOC sections last", () => {
    const sections = [
      { title: "Industrial Training", courses: [{ code: "ENGG4999", uoc: 0 }] },
      { title: "Level 2 Core", courses: [{ code: "B", uoc: 6 }] },
      { title: "Electives", courses: [{ code: "C", uoc: 6 }] },
      { title: "Level 1 Core", courses: [{ code: "A", uoc: 6 }] },
    ];
    expect(orderSections(sections).map((s) => s.title)).toEqual(["Level 1 Core", "Level 2 Core", "Electives", "Industrial Training"]);
  });
});

describe("openRequirementParts", () => {
  it("keeps program parts with UOC but no course list", () => {
    const sections = [
      { title: "Overview" },
      { title: "Disciplinary Component", kind: "info", uoc: 168, courses: [] },
      { title: "Industrial Training", kind: "core", uoc: 0, courses: [{ code: "ENGG4999" }] },
      { title: "Free Electives", kind: "free_elective", uoc: 12, courses: [] },
      { title: "General Education", kind: "general_education", uoc: 12, courses: [] },
      { title: "Optional Minor", kind: "specialisations", uoc: 24, courses: [] },
    ];
    expect(openRequirementParts(sections)).toEqual([
      { title: "Free Electives", uoc: 12, note: "Any approved UNSW course", optional: false },
      { title: "General Education", uoc: 12, note: "Courses from outside your faculty", optional: false },
      { title: "Optional Minor", uoc: 24, note: "Optional. Filled by choosing a minor", optional: true },
    ]);
  });
});

describe("ruleCheck", () => {
  const section = { description: "Students must complete a minimum of 36 UOC of Level 4 courses including core courses." };

  it("counts ticked UOC at the level or above", () => {
    const rows = [
      { course_code: "COMP4601", uoc: 6, is_completed: true },
      { course_code: "COMP6771", uoc: 6, is_completed: true },
      { course_code: "COMP3311", uoc: 6, is_completed: true },
      { course_code: "COMP4920", uoc: 6, is_completed: false },
    ];
    expect(ruleCheck(section, rows)).toEqual({ need: 36, level: 4, have: 12, met: false });
  });

  it("returns null when the rule can't be read", () => {
    expect(ruleCheck({ description: "Talk to your school." }, [])).toBeNull();
  });
});

describe("rulePatterns", () => {
  it("reads course code patterns from rule text", () => {
    const patterns = rulePatterns("any COMP4***, COMP6*** or COMP9*** course, or ACCT3xxx");
    expect(patterns).toEqual([
      { prefix: "COMP", level: 4 },
      { prefix: "COMP", level: 6 },
      { prefix: "COMP", level: 9 },
      { prefix: "ACCT", level: 3 },
    ]);
    expect(matchesRule("COMP6771", patterns)).toBe(true);
    expect(matchesRule("COMP3311", patterns)).toBe(false);
    expect(matchesRule("ACCT3563", patterns)).toBe(true);
  });
});

describe("tidySections", () => {
  it("merges a parent requirement with its lists", () => {
    const tidy = tidySections([
      { title: "Level 3 Prescribed Electives", kind: "elective", uoc: 30, description: "Take 30 UOC.", courses: [] },
      { title: "List A", kind: "elective", uoc: 0, courses: [{ code: "PSYC3001" }, { code: "PSYC3011" }] },
      { title: "List B", kind: "elective", uoc: 0, courses: [{ code: "PSYC3201" }, { code: "PSYC3001" }] },
      { title: "Level 4 Core", kind: "core", uoc: 48, courses: [{ code: "PSYC4093" }] },
    ]);
    expect(tidy).toHaveLength(2);
    expect(tidy[0]).toMatchObject({ title: "Level 3 Prescribed Electives", kind: "elective", uoc: 30 });
    expect(tidy[0].courses.map((c) => [c.code, c.list])).toEqual([["PSYC3001", "List A"], ["PSYC3011", "List A"], ["PSYC3201", "List B"]]);
  });

  it("does not merge lists of a different kind", () => {
    const tidy = tidySections([
      { title: "Prescribed WIL Course", kind: "elective", uoc: 6, courses: [] },
      { title: "Business FYS Course", kind: "core", uoc: 0, courses: [{ code: "COMM1100" }] },
    ]);
    expect(tidy.map((s) => [s.title, s.kind, s.courses.length])).toEqual([["Prescribed WIL Course", "elective", 0], ["Business FYS Course", "core", 1]]);
  });

  it("reads a UOC target from the rule text", () => {
    const [section] = tidySections([{ title: "Level 2", kind: "elective", description: "You must take 18 UOC of the following courses.", courses: [{ code: "SOCS2001" }] }]);
    expect(section.uoc).toBe(18);
  });

  it("keeps core requirements without a list as unlisted", () => {
    const [section] = tidySections([{ title: "Business Core Courses", kind: "core", uoc: 30, courses: [] }]);
    expect(section.kind).toBe("unlisted");
    expect(showsOnCourses(section)).toBe(true);
  });

  it("leaves engineering style sections alone", () => {
    const sections = [{ title: "Level 1 Core Courses", kind: "core", uoc: 60, courses: [{ code: "COMP1511" }] }];
    expect(tidySections(sections)).toEqual(sections);
  });
});
