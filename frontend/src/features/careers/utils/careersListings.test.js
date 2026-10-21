import { describe, expect, it } from "vitest";
import { mergeListings } from "./careersListings";

describe("mergeListings", () => {
  it("keeps the first copy of a job seen in two sources and drops listings without a link", () => {
    const adzuna = [{ id: "a1", title: "Graduate Engineer", organisation: "Telstra", url: "https://adzuna/1" }];
    const web = [
      { id: "w1", title: "graduate engineer ", organisation: "telstra", url: "https://seek/1" },
      { id: "w2", title: "Junior Analyst", organisation: "Westpac", url: "https://seek/2" },
      { id: "w3", title: "No link", organisation: "Optus", url: "" },
    ];
    expect(mergeListings(adzuna, web).map((item) => item.id)).toEqual(["a1", "w2"]);
  });
});
