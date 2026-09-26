const UNSAFE_SEARCH_CHARS = /[^\p{L}\p{N}\s&'-]+/gu;

export function toSearchTerm(query) {
  return query.replace(UNSAFE_SEARCH_CHARS, " ").replace(/\s+/g, " ").trim();
}
