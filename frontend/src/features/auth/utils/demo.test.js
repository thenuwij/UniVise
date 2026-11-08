import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/supabase", () => ({ supabase: {} }));

import { isDemoUser } from "./demo";

describe("isDemoUser", () => {
  it("is true only for accounts the backend flagged as demo", () => {
    expect(isDemoUser({ app_metadata: { demo: true } })).toBe(true);
    expect(isDemoUser({ app_metadata: {} })).toBe(false);
    expect(isDemoUser({ user_metadata: { demo: true } })).toBe(false);
    expect(isDemoUser(null)).toBe(false);
  });
});
