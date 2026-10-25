const FAMILIES = [
  ["Cyber security", /\b(cyber|security|soc analyst|penetration)\b/],
  ["Networks and infrastructure", /\b(network|data cent(re|er)|infrastructure|telecommunications?|telco|systems? engineer|systems? administrator|rf)\b/],
  ["Cloud and DevOps", /\b(cloud|devops|site reliability|sre|platform engineer)\b/],
  ["Data and AI", /\b(data|analytics|machine learning|ml|ai|artificial intelligence|scientist|automation analyst)\b/],
  ["Electrical and electronics", /\b(electrical|electronics?|embedded|hardware|fpga|firmware|power systems?|control systems?|instrumentation)\b/],
  ["Software engineering", /\b(software|developer|programmer|full[ -]?stack|front[ -]?end|back[ -]?end|web|mobile|application)\b/],
  ["IT support", /\b(it support|support|help ?desk|service desk|technician|it traineeship|desktop)\b/],
  ["Mechanical and manufacturing", /\b(mechanical|manufacturing|mechatronics?|production|maintenance)\b/],
  ["Civil and construction", /\b(civil|structural|construction|site engineer|surveyor|geotechnical|project engineer)\b/],
  ["Business and consulting", /\b(business|consult(ant|ing)|product|project|operations|analyst)\b/],
  ["Finance and accounting", /\b(account(ant|ing)|finance|financial|audit|tax|actuar(y|ial)|investment|banking)\b/],
  ["Health and science", /\b(clinical|health|medical|laborator(y|ies)|lab|research|scientific|pharmac)\b/],
  ["Design and creative", /\b(design(er)?|ux|ui|creative|architect(ural)?)\b/],
];

export const OTHER_FAMILY = "Other roles for your degree";

export function jobFamily(title) {
  const text = ` ${(title || "").toLowerCase()} `;
  return FAMILIES.find(([, pattern]) => pattern.test(text))?.[0] || OTHER_FAMILY;
}

export function groupJobs(ads) {
  const groups = new Map();
  for (const ad of ads || []) {
    const family = jobFamily(ad.title);
    groups.set(family, [...(groups.get(family) || []), ad]);
  }
  return [...groups.entries()]
    .map(([title, list]) => ({ title, ads: list }))
    .sort((a, b) => (a.title === OTHER_FAMILY) - (b.title === OTHER_FAMILY) || b.ads.length - a.ads.length);
}
