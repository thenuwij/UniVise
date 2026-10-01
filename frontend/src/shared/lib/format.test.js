import { describe, expect, test } from "vitest";
import { formatDuration, hasContent, toBlocks } from "./format";

describe("hasContent", () => {
  test("treats placeholders as missing", () => {
    for (const value of [null, undefined, "", "  ", "Not specified", "N/A", "null", "Information temporarily unavailable", "Data not available"]) {
      expect(hasContent(value)).toBe(false);
    }
  });

  test("keeps real text and numbers", () => {
    expect(hasContent("Prerequisite: COMP1511")).toBe(true);
    expect(hasContent("Not specified in the rules below")).toBe(true);
    expect(hasContent(0)).toBe(true);
  });
});

describe("formatDuration", () => {
  test("uses the numeric column first", () => {
    expect(formatDuration(4, "4 Year(s)")).toBe("4 years");
    expect(formatDuration(1, "1 Year(s)")).toBe("1 year");
    expect(formatDuration(6.7, null)).toBe("6.7 years");
    expect(formatDuration("4.0", null)).toBe("4 years");
  });

  test("falls back to the stored text", () => {
    expect(formatDuration(null, "1-3 Year(s)")).toBe("1 to 3 years");
    expect(formatDuration(null, "5 years full-time")).toBe("5 years");
    expect(formatDuration(null, null)).toBeNull();
    expect(formatDuration(null, "Not specified")).toBeNull();
  });
});

describe("toBlocks", () => {
  test("splits an inline numbered list", () => {
    const blocks = toBlocks("Students must complete 192 UOC when taken as a standalone program. 1. 180 UOC specialisation 2. 12 UOC General Education");
    expect(blocks).toEqual([
      { type: "p", text: "Students must complete 192 UOC when taken as a standalone program." },
      { type: "ol", items: ["180 UOC specialisation", "12 UOC General Education"] },
    ]);
  });

  test("does not treat decimals as a numbered list", () => {
    expect(toBlocks("A WAM of 65.5 is needed. Then 2.5 years remain.").every((b) => b.type === "p")).toBe(true);
  });

  test("turns a run-on list sentence into a list", () => {
    const names = ["Genetics", "Psychiatry", "Surgery", "Medical Education", "Dermatology", "Rural and Remote Medicine", "Emergency Medicine", "Anaesthetics", "Pain Medicine"];
    const blocks = toBlocks(`Students must choose one of the following specialisations. ${names.join(", ")}.`);
    expect(blocks[0]).toEqual({ type: "p", text: "Students must choose one of the following specialisations." });
    expect(blocks[1].type).toBe("ul");
    expect(blocks[1].items).toEqual(names);
  });

  test("moves text after a numbered list back into a paragraph", () => {
    expect(toBlocks("Complete 192 UOC. 1. 180 UOC specialisation 2. 12 UOC General Education. Students must also complete industrial training.")).toEqual([
      { type: "p", text: "Complete 192 UOC." },
      { type: "ol", items: ["180 UOC specialisation", "12 UOC General Education"] },
      { type: "p", text: "Students must also complete industrial training." },
    ]);
  });

  test("splits course lists at each course code", () => {
    expect(toBlocks("Level 1 Core Courses: BABS1201 6 UOC Molecules, Cells and Genes, BENV1010 6 UOC Communication, DESN1000 6 UOC Design, ENGG1300 6 UOC Mechanics.")).toEqual([
      { type: "p", text: "Level 1 Core Courses:" },
      { type: "ul", items: ["BABS1201 6 UOC Molecules, Cells and Genes", "BENV1010 6 UOC Communication", "DESN1000 6 UOC Design", "ENGG1300 6 UOC Mechanics"] },
    ]);
  });

  test("leaves enrolment rules with course logic as text", () => {
    const rule = "Prerequisite: (ACTL2131 or MATH2901) and ACTL2102 and ACTL2111 and ACCT1511. Corequisite: ACTL3141.";
    expect(toBlocks(rule).every((b) => b.type === "p")).toBe(true);
  });

  test("does not turn a lowercase comma series into a list", () => {
    const text = "In the program you study biology, microbiology, toxicology, chemistry, physics, nutrition, sensory science, engineering and packaging in depth.";
    expect(toBlocks(text).every((b) => b.type === "p")).toBe(true);
  });

  test("keeps ordinary comma-heavy prose as a paragraph", () => {
    const prose = "This course covers accounting, finance, auditing, tax, ethics, analytics, reporting and regulation, with case studies drawn from industry, government and the not-for-profit sector across many long and detailed real examples that run well past the length of a list item.";
    expect(toBlocks(prose).every((b) => b.type === "p")).toBe(true);
  });

  test("breaks a wall of text into paragraphs", () => {
    const sentence = "This program builds strong research skills across a range of fields and methods.";
    const blocks = toBlocks(Array(12).fill(sentence).join(" "));
    expect(blocks.length).toBeGreaterThan(1);
    expect(blocks.every((b) => b.type === "p")).toBe(true);
  });

  test("respects existing line breaks", () => {
    expect(toBlocks("Overview line\n1. First\n2. Second\n• Note")).toEqual([
      { type: "p", text: "Overview line" },
      { type: "ol", items: ["First", "Second"] },
      { type: "ul", items: ["Note"] },
    ]);
  });

  test("can keep lists as plain paragraphs", () => {
    const names = ["Genetics", "Psychiatry", "Surgery", "Dermatology", "Anaesthetics", "Pain Medicine", "Radiology", "Pathology"];
    expect(toBlocks(`Choose one: ${names.join(", ")}.`, { lists: false }).every((b) => b.type === "p")).toBe(true);
    expect(toBlocks("1. First 2. Second", { lists: false })).toEqual([{ type: "p", text: "1. First 2. Second" }]);
  });

  test("returns nothing for placeholders", () => {
    expect(toBlocks("Not specified")).toEqual([]);
  });
});
