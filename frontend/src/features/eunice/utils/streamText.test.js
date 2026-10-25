import { describe, expect, it } from "vitest";
import { STREAM_ERROR_MARKER, readStreamText, withCutOffNote } from "./streamText";

describe("readStreamText", () => {
  it("returns a normal reply unchanged", () => {
    expect(readStreamText("Take COMP2521.", true)).toEqual({ text: "Take COMP2521.", cutOff: false });
  });

  it("strips the marker and flags the reply as cut off", () => {
    expect(readStreamText(`Take COMP${STREAM_ERROR_MARKER}`)).toEqual({ text: "Take COMP", cutOff: true });
  });

  it("hides a marker that has only partly arrived", () => {
    expect(readStreamText("Take COMP[STREAM_ER")).toEqual({ text: "Take COMP", cutOff: false });
  });

  it("keeps a trailing bracket once the stream has finished", () => {
    expect(readStreamText("See [", true)).toEqual({ text: "See [", cutOff: false });
  });
});

describe("withCutOffNote", () => {
  it("adds the note under a partial reply", () => {
    expect(withCutOffNote("Take COMP")).toBe("Take COMP\n\n*The reply was cut off. Please try again.*");
  });

  it("shows only the note when nothing arrived", () => {
    expect(withCutOffNote("")).toBe("The reply was cut off. Please try again.");
  });
});
