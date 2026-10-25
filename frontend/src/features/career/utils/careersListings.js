import { companyKey } from "./hiringNow";

const listingKey = (item) => `${(item.title || "").trim().toLowerCase()}|${companyKey(item.organisation)}`;

export function mergeListings(...groups) {
  const seen = new Set();
  const merged = [];
  for (const item of groups.flat()) {
    const key = listingKey(item);
    if (!item.url || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}
