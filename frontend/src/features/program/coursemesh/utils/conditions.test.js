import { describe, expect, it } from "vitest";
import { otherConditions } from "./conditions";

describe("otherConditions", () => {
  it("names the WAM in a rule", () => {
    expect(otherConditions("Prerequisite: COMP3821, or (COMP3121 and a 75 WAM)")).toEqual(["75 WAM"]);
    expect(otherConditions("Pre-requisite: (ACCT1501 or COMM1140) AND 65+ WAM")).toEqual(["65 WAM"]);
    expect(otherConditions("Corequisite: CEIC4953; Prerequisite: CEIC4952; WAM of 65")).toEqual(["65 WAM"]);
  });

  it("names programs, majors, UOC and approval", () => {
    expect(otherConditions("Prerequisite: FINS3646 or enrolment in program 3736")).toEqual(["a specific program"]);
    expect(otherConditions("Prerequisite: MATH1251 AND (ACTL1101 OR in MATHE1, MATHM1 or MATHT1 majors)")).toEqual(["a specific major or plan"]);
    expect(otherConditions("Prerequisite: LEGT1710 or TABL1710 or 12 UOC offered by the UNSW Business School.")).toEqual(["a UOC requirement"]);
    expect(otherConditions("Prerequisite: ARTS1660 or language placement approval")).toEqual(["approval"]);
  });

  it("ignores plain course rules and exclusions", () => {
    expect(otherConditions("Prerequisite: COMP1511 or DPST1091")).toEqual([]);
    expect(otherConditions("Prerequisite: COMP2521. Exclusion: students enrolled in program 3778")).toEqual([]);
    expect(otherConditions(null)).toEqual([]);
  });
});
