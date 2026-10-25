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

  it("keeps Eunice active for new and existing conversations", () => {
    for (const path of ["/chat", "/chat/conversation-id"]) {
      expect(isNavigationActive("eunice", path)).toBe(true);
      expect(isNavigationActive("roadmap", path)).toBe(false);
    }
  });

  it("does not select unrelated destinations", () => {
    expect(isNavigationActive("dashboard", "/dashboard")).toBe(true);
    expect(isNavigationActive("careers", "/careers")).toBe(true);
    expect(isNavigationActive("roadmap", "/careers")).toBe(false);
    for (const section of ["dashboard", "roadmap", "careers", "eunice"]) {
      expect(isNavigationActive(section, "/profile")).toBe(false);
      expect(isNavigationActive(section, "/roadmap")).toBe(false);
    }
  });
});
