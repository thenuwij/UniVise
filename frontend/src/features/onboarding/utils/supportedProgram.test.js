import { beforeEach, describe, expect, it, vi } from "vitest";
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/shared/lib/supabase", () => ({ supabase: { from } }));
import {
  fetchSupportedDegree,
  fetchSupportedEnrolment,
  isSupportedProgram,
} from "./supportedProgram";
import { hasCompletedSurvey, pathAfterSignIn } from "./surveyStatus";
const program = {
  id: "degree-id",
  degree_code: "3707",
  program_name: "Engineering (Honours)",
  is_offered: true,
};
function query(data, error = null) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.limit.mockResolvedValue({ data, error });
  builder.maybeSingle.mockResolvedValue({ data, error });
  from.mockReturnValueOnce(builder);
  return builder;
}
beforeEach(() => from.mockReset());
describe("supported personal programs", () => {
  it("accepts an offered undergraduate degree and rejects missing or unsupported choices", () => {
    expect(isSupportedProgram(program)).toBe(true);
    for (const value of [
      null,
      {},
      { ...program, is_offered: false },
      { ...program, program_name: "Master of Engineering" },
      { ...program, degree_code: null },
    ])
      expect(isSupportedProgram(value)).toBe(false);
  });
  it("revalidates the selected degree against current data", async () => {
    const lookup = query(program);
    expect(await fetchSupportedDegree("3707")).toEqual(program);
    expect(lookup.eq).toHaveBeenCalledWith("degree_code", "3707");
    query({ ...program, is_offered: false });
    expect(await fetchSupportedDegree("3707")).toBeNull();
  });
  it("does not mistake a database failure for an unsupported degree", async () => {
    query(null, new Error("offline"));
    await expect(fetchSupportedDegree("3707")).rejects.toThrow("offline");
  });
  it("checks only the signed-in student's enrolled program", async () => {
    const enrolment = query([{ degree_code: "3707" }]);
    query(program);
    expect(await fetchSupportedEnrolment("student-id")).toEqual(program);
    expect(enrolment.eq).toHaveBeenCalledWith("user_id", "student-id");
  });
  it("sends an old completed profile without a program back to setup", async () => {
    query([{ user_id: "student-id" }]);
    query([]);
    expect(await pathAfterSignIn("student-id")).toBe("/survey");
  });
  it("requires both a completed profile and a supported enrolled degree", async () => {
    query([]);
    expect(await hasCompletedSurvey("student-id")).toBe(false);
    query([{ user_id: "student-id" }]);
    query([{ degree_code: "3707" }]);
    query(program);
    expect(await pathAfterSignIn("student-id")).toBe("/dashboard");
    query([{ user_id: "student-id" }]);
    query([{ degree_code: "3707" }]);
    query({ ...program, is_offered: false });
    expect(await hasCompletedSurvey("student-id")).toBe(false);
  });
  it("preserves lookup failures for the retry screen", async () => {
    query(null, new Error("offline"));
    await expect(hasCompletedSurvey("student-id")).rejects.toThrow("offline");
  });
});
