import { describe, expect, it } from "vitest";
import { describePage } from "./pageContext";

describe("describePage", () => {
  it("names a course page with its code and title", () => {
    expect(describePage("/course/COMP3231", "Operating Systems", "COMP3231 · 6 UOC")).toBe("UNSW course page: COMP3231 · 6 UOC Operating Systems");
  });

  it("uses just the label when the page has no heading", () => {
    expect(describePage("/coursemesh", undefined, undefined)).toBe("CourseMesh, their prerequisite map");
  });

  it("ignores pages Eunice has no context for", () => {
    expect(describePage("/survey", "Survey", null)).toBeNull();
  });

  it("caps very long text", () => {
    expect(describePage("/dashboard", "x".repeat(500), null)).toHaveLength(300);
  });
});
