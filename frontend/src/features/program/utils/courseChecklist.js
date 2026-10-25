import { ruleCheck } from "./myCourses";

// A rule stays within its source group, beside its explicitly named course level.
export function placeCourseRules(rules, sections) {
  const bySection = new Map();
  const remaining = [];
  for (const rule of rules) {
    const level = ruleCheck(rule, [])?.level;
    const target = level == null ? null : sections.find((section) => {
      const title = section.under || section.heading?.title || section.title;
      return Number(String(title || "").match(/\blevel\s*(\d+)/i)?.[1]) === level;
    });
    if (target) bySection.set(target, [...(bySection.get(target) || []), rule]);
    else remaining.push(rule);
  }
  return { bySection, remaining };
}

export function courseChecklistHeading(specs, programName, minimumUoc) {
  const specialisation = specs?.find((spec) => spec.type !== "Minor");
  return specialisation
    ? { name: specialisation.name, type: specialisation.type, uoc: specialisation.uoc }
    : { name: programName || "Your program", type: "Program", uoc: minimumUoc };
}
