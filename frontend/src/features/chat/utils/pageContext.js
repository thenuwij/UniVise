const PAGES = [
  [/^\/course\//, "UNSW course page"],
  [/^\/degrees\//, "UNSW degree page"],
  [/^\/specialisation\/major\//, "UNSW major page"],
  [/^\/specialisation\/minor\//, "UNSW minor page"],
  [/^\/specialisation\/honours\//, "UNSW honours page"],
  [/^\/coursemesh/, "CourseMesh, their prerequisite map"],
  [/^\/roadmap/, "their degree roadmap"],
  [/^\/dashboard/, "their dashboard"],
  [/^\/handbook/, "the Handbook search"],
  [/^\/saved/, "their shortlist"],
  [/^\/compare/, "Compare programs"],
  [/^\/profile/, "their account page"],
];

const MAX_LENGTH = 300;

export function describePage(pathname, heading, eyebrow) {
  const label = PAGES.find(([pattern]) => pattern.test(pathname))?.[1];
  if (!label) return null;
  const detail = [eyebrow, heading].map((text) => (text || "").replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
  return (detail ? `${label}: ${detail}` : label).slice(0, MAX_LENGTH);
}

export function currentPage(pathname) {
  const heading = document.querySelector("h1")?.textContent;
  const eyebrow = document.querySelector("[data-eyebrow]")?.textContent;
  return describePage(pathname, heading, eyebrow);
}
