import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/supabase", () => ({ supabase: {} }));

const { buildLinkIndex, findLink } = await import("./societyLinks");

const index = buildLinkIndex([
  { name: "CSE Society", short_name: "CSESoc", website_url: "https://www.csesoc.unsw.edu.au", rubric_url: "https://campus.hellorubric.com/?s=12504" },
  { name: "Electrical Engineering & Telecommunications Society (ELSOC)", short_name: null, website_url: "https://www.elsoc.net", rubric_url: null },
  { name: "Women In Consulting", short_name: "WIC", website_url: null, rubric_url: "https://campus.hellorubric.com/?s=5054" },
  { name: "Toastmasters Society", short_name: null, website_url: null, rubric_url: null },
]);

describe("findLink", () => {
  it("prefers the website and matches the AI's name format", () => {
    expect(findLink(index, "CSE Society (CSESoc)")).toEqual({ url: "https://www.csesoc.unsw.edu.au", isWebsite: true });
    expect(findLink(index, "Electrical Engineering and Telecommunications Society (ELSOC)").url).toBe("https://www.elsoc.net");
  });

  it("falls back to Rubric, then to the short form", () => {
    expect(findLink(index, "Women In Consulting")).toEqual({ url: "https://campus.hellorubric.com/?s=5054", isWebsite: false });
    expect(findLink(index, "UNSW Computing Society (CSESoc)").url).toBe("https://www.csesoc.unsw.edu.au");
  });

  it("returns nothing for societies without a link", () => {
    expect(findLink(index, "Toastmasters Society")).toBeNull();
    expect(findLink(index, "Made Up Society")).toBeNull();
  });
});
