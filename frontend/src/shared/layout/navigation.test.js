import { describe, expect, it } from "vitest";
import { isNavigationActive } from "./navigation";

describe("shared navigation", () => {
  it("keeps personal roadmap steps and loading screens under Roadmap", () => {
    for (const path of [
      "/roadmap-entryload",
      "/roadmap-loading",
      "/roadmap/unsw",
    ]) {
      expect(isNavigationActive("roadmap", path)).toBe(true);
      expect(isNavigationActive("explore", path)).toBe(false);
    }
  });

  it("keeps program browsing and handbook detail pages under Explore", () => {
    for (const path of [
      "/roadmap",
      "/handbook",
      "/degrees/12",
      "/course/34",
      "/specialisation/major/56",
      "/compare",
    ]) {
      expect(isNavigationActive("explore", path)).toBe(true);
      expect(isNavigationActive("roadmap", path)).toBe(false);
    }
  });

  it("does not select unrelated destinations", () => {
    expect(isNavigationActive("coursemesh", "/coursemesh")).toBe(true);
    expect(isNavigationActive("explore", "/coursemesh")).toBe(false);
    expect(isNavigationActive("dashboard", "/dashboard")).toBe(true);
    expect(isNavigationActive("careers", "/careers")).toBe(true);
    expect(isNavigationActive("roadmap", "/careers")).toBe(false);
    for (const section of ["dashboard", "roadmap", "careers", "explore", "coursemesh"]) {
      expect(isNavigationActive(section, "/profile")).toBe(false);
      expect(isNavigationActive(section, "/chat")).toBe(false);
    }
  });
});
