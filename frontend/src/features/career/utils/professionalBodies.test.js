import { describe, expect, test } from "vitest";
import { describeBody } from "./professionalBodies";

describe("describeBody", () => {
  test("gives known bodies their short name and description", () => {
    const body = describeBody("Engineers Australia");
    expect(body.short).toBe("EA");
    expect(body.about).toMatch(/accredits engineering degrees/);
  });

  test("falls back to initials and no description for unknown bodies", () => {
    expect(describeBody("Australian Institute of Physics")).toEqual({ short: "AIP", about: null });
  });
});
