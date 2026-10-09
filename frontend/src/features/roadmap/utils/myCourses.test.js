import { describe, expect, it } from "vitest";
import { ADDED_SECTION, myCourseCodes, notNeededCodes, orderSections, progressOf, requiredCount, sectionProgress, splitCourses, withAddedCourses } from "./myCourses";

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
