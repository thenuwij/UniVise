const OPTION_KINDS = new Set(["elective", "general_education", "free_elective"]);

const kindOf = (section, course) => course.kind || section.kind || "core";

export function splitCourses(sources) {
  const required = [];
  const groups = new Map();
  const options = [];
  const seen = new Set();
  for (const { key, sections } of sources) {
    for (const section of sections || []) {
      for (const course of section?.courses || []) {
        if (!course?.code || seen.has(course.code)) continue;
        seen.add(course.code);
        const kind = kindOf(section, course);
        if (course.choice) {
          const id = `${key}:${course.choice}`;
          groups.set(id, [...(groups.get(id) || []), course.code]);
        } else if (OPTION_KINDS.has(kind)) {
          options.push({ code: course.code, name: course.name, uoc: course.uoc, section: section.title });
        } else {
          required.push(course.code);
        }
      }
    }
  }
  return { required, choiceGroups: [...groups].map(([key, codes]) => ({ key, codes })), options };
}

export const requiredCount = (mine) => mine.required.length + mine.choiceGroups.length;

function chosenOptions(mine, completed, added) {
  return mine.options.map((o) => o.code).filter((code) => added.has(code) || completed.has(code));
}

export function myCourseCodes(mine, completed, added) {
  return Array.from(new Set([...mine.required, ...mine.choiceGroups.flatMap((g) => g.codes), ...chosenOptions(mine, completed, added)]));
}

export function notNeededCodes(mine, completed, added) {
  const skip = new Set();
  for (const { codes } of mine.choiceGroups) {
    const chosen = codes.filter((code) => completed.has(code) || added.has(code));
    if (chosen.length) codes.filter((code) => !chosen.includes(code)).forEach((code) => skip.add(code));
  }
  return skip;
}

export function progressOf(mine, completed, added) {
  const extras = chosenOptions(mine, completed, added);
  const done =
    mine.required.filter((code) => completed.has(code)).length +
    mine.choiceGroups.filter((g) => g.codes.some((code) => completed.has(code))).length +
    extras.filter((code) => completed.has(code)).length;
  return { done, total: requiredCount(mine) + extras.length };
}
