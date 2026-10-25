import { describe, expect, it } from "vitest";
import { courseChecklistHeading, placeCourseRules } from "./courseChecklist";

const rule = { title: "Level 4 UOC Minimum", description: "Complete a minimum of 36 UOC of Level 4 courses." };

describe("course checklist rule placement", () => {
  it("places a rule at its course level once, within the supplied group", () => {
    const sections = [{ title: "Level 3 Core" }, { title: "Level 4 Core" }, { title: "Level 4 Electives" }];
    const result = placeCourseRules([rule], sections);
    expect([...result.bySection]).toEqual([[sections[1], [rule]]]);
    expect(result.remaining).toEqual([]);
    expect(placeCourseRules([rule], [{ title: "Free Electives" }]).remaining).toEqual([rule]);
  });
  it("recognises a shared level heading on split requirements", () => {
    const section = { title: "Choose one", heading: { title: "Level 4 Core" } };
    expect(placeCourseRules([rule], [section]).bySection.get(section)).toEqual([rule]);
    const under = { title: "Part two", under: "Level 4 Core" };
    expect(placeCourseRules([rule], [under]).bySection.get(under)).toEqual([rule]);
  });
  it("keeps rules visible separately when their level cannot be placed", () => {
    const unknown = { title: "Approval required", description: "Speak with your school." };
    expect(placeCourseRules([rule, unknown], []).remaining).toEqual([rule, unknown]);
  });
});

describe("course checklist heading", () => {
  it("uses the degree name before a specialisation is chosen, including with a minor", () => {
    for (const specs of [null, [], [{ name: "Mathematics", type: "Minor" }]]) {
      expect(courseChecklistHeading(specs, "Bachelor of Engineering (Honours)", 192)).toEqual({ name: "Bachelor of Engineering (Honours)", type: "Program", uoc: 192 });
    }
  });
  it("uses the selected specialisation rather than its optional minor", () => {
    expect(courseChecklistHeading([{ name: "Maths", type: "Minor" }, { name: "Computer Engineering", type: "Honours", uoc: 168 }], "Engineering", 192)).toEqual({ name: "Computer Engineering", type: "Honours", uoc: 168 });
  });
});
