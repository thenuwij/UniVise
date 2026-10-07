const NOT_REQUIREMENTS = /\b(exclu\w*|equivalen\w*)\b/i;

const CHECKS = [
  [/(\d{2})\s*\+?\s*WAM|WAM\s*(?:of\s*)?(\d{2})/i, (m) => `${m[1] || m[2]} WAM`],
  [/\bWAM\b/i, () => "a minimum WAM"],
  [/\d+\s*UOC/i, () => "a UOC requirement"],
  [/enrol\w*\s+in\s+(?:the\s+)?(?:program|bachelor|\d{4})|\bprogram\s+\d{4}/i, () => "a specific program"],
  [/\b(majors?|streams?|plans?|specialisations?)\b/i, () => "a specific major or plan"],
  [/approval|permission|consent/i, () => "approval"],
];

export function otherConditions(text) {
  if (!text) return [];
  const rules = text.split(NOT_REQUIREMENTS)[0];
  const found = [];
  for (const [pattern, label] of CHECKS) {
    const match = rules.match(pattern);
    if (!match) continue;
    const value = label(match);
    if (value === "a minimum WAM" && found.some((f) => f.endsWith("WAM"))) continue;
    if (!found.includes(value)) found.push(value);
  }
  return found;
}
