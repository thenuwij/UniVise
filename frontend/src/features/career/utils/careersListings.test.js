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

  it("treats company suffixes as the same employer but keeps different roles", () => {
    const picks = [{ id: "p1", title: "Intern, Critical Facilities", organisation: "EQUINIX AUSTRALIA PTY LIMITED", url: "https://seek/1" }];
    const adzuna = [
      { id: "a1", title: "Intern, Critical Facilities", organisation: "Equinix", url: "https://adzuna/1" },
      { id: "a2", title: "Embedded Systems Engineer Intern", organisation: "Anduril", url: "https://adzuna/2" },
      { id: "a3", title: "2027 Electrical Engineer Intern", organisation: "Anduril", url: "https://adzuna/3" },
    ];
    expect(mergeListings(picks, adzuna).map((item) => item.id)).toEqual(["p1", "a2", "a3"]);
  });
});
