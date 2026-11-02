import { describe, expect, it } from "vitest";
import { summariseSources } from "./careerSummary";

const done = (source, items = []) => ({ source, status: "done", stale: false, items });
const job = (title) => ({ title, organisation: "Acme", url: `https://example.com/${title}`, kind: "job" });

describe("summariseSources", () => {
  it("shows the count as soon as any listings exist", () => {
    const { jobs } = summariseSources({ ai_jobs: { source: "ai_jobs", status: "running", items: [] }, adzuna: done("adzuna", [job("a"), job("b")]) });
    expect(jobs).toEqual({ count: 2, state: "ready" });
  });

  it("is loading, not zero, while a source is running or has never run", () => {
    expect(summariseSources({ ai_networking: { status: "running", items: [] } }).events.state).toBe("loading");
    expect(summariseSources({ ai_networking: { status: "never", stale: true, items: [] } }).events.state).toBe("loading");
    expect(summariseSources({}).events.state).toBe("loading");
  });

  it("is failed when a finished source failed and nothing was found", () => {
    expect(summariseSources({ ai_jobs: { status: "failed", stale: true, items: [] }, adzuna: done("adzuna") }).jobs.state).toBe("failed");
  });

  it("is empty only when every source finished with nothing", () => {
    expect(summariseSources({ ai_jobs: done("ai_jobs"), adzuna: done("adzuna") }).jobs).toEqual({ count: 0, state: "empty" });
  });

  it("leaves calendar pages out of the event count", () => {
    const { events } = summariseSources({ ai_networking: done("ai_networking", [{ kind: "calendar" }]) });
    expect(events).toEqual({ count: 0, state: "empty" });
  });
});
