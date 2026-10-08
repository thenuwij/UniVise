import { describe, expect, test } from "vitest";
import { cleanText } from "./cleanText";

describe("cleanText", () => {
  test("keeps ordinary answers as they are", () => {
    expect(cleanText("Rock climbing", 60)).toBe("Rock climbing");
    expect(cleanText("C++ & C# (games)", 60)).toBe("C++ & C# (games)");
    expect(cleanText("Café, Māori studies", 60)).toBe("Café, Māori studies");
  });

  test("trims and collapses spaces, line breaks and tabs", () => {
    expect(cleanText("  Rock \n\n climbing\t ", 60)).toBe("Rock climbing");
  });

  test("removes invisible and control characters", () => {
    expect(cleanText("Avi​ation‮\u0007", 60)).toBe("Aviation");
  });

  test("removes markup and prompt formatting characters", () => {
    expect(cleanText("<script>alert(1)</script>", 60)).toBe("scriptalert(1)/script");
    expect(cleanText("```ignore``` {role: system} [x] |y|", 60)).toBe("ignore role: system x y");
  });

  test("caps the length without a trailing space", () => {
    expect(cleanText("a".repeat(80), 60)).toHaveLength(60);
    expect(cleanText("word ".repeat(20), 12)).toBe("word word wo");
  });

  test("treats missing values as empty", () => {
    expect(cleanText(null, 60)).toBe("");
    expect(cleanText(undefined, 60)).toBe("");
  });
});
