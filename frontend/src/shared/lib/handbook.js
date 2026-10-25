// Every entry point uses the backend's publication check and year fallback.
export const HANDBOOK_HOME = "https://www.handbook.unsw.edu.au";
const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export function handbookUrl(kind, identifier, sourceUrl) {
  if (!identifier) return HANDBOOK_HOME;
  const level = sourceUrl?.match(/\/(undergraduate|postgraduate)\//)?.[1];
  return `${API_BASE}/handbook/${kind}/${encodeURIComponent(identifier)}${level ? `?level=${level}` : ""}`;
}

// Also handles historical source URLs and links in saved Eunice conversations.
export function officialHandbookHref(href) {
  if (!href) return href;
  const official = href.match(/^https:\/\/www\.handbook\.unsw\.edu\.au\/(undergraduate|postgraduate)\/(courses|programs|specialisations)\/\d{4}\/([A-Za-z0-9]+)/);
  if (official) return handbookUrl(official[2], official[3], href);
  const legacy = href.match(/^\/(?:course\/([^/?#]+)|degrees\/([^/?#]+)|specialisation\/(?:major|minor|honours)\/([^/?#]+))(?:[?#].*)?$/);
  if (legacy) return handbookUrl(legacy[1] ? "courses" : legacy[2] ? "programs" : "specialisations", legacy[1] || legacy[2] || legacy[3]);
  return href;
}

export function openHandbook(kind, identifier, sourceUrl) {
  window.open(handbookUrl(kind, identifier, sourceUrl), "_blank", "noopener,noreferrer");
}
