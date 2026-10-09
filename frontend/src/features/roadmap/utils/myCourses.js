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

export const ADDED_SECTION = "Added courses";

export function withAddedCourses(mine, addedRows) {
  const listed = new Set([...mine.required, ...mine.choiceGroups.flatMap((g) => g.codes), ...mine.options.map((o) => o.code)]);
  const extras = (addedRows || [])
    .filter((row) => row.code && !listed.has(row.code))
    .map((row) => ({ code: row.code, name: row.name, uoc: row.uoc, section: ADDED_SECTION }));
  return extras.length ? { ...mine, options: [...mine.options, ...extras] } : mine;
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

export function sectionProgress(section, completed, added) {
  let done = 0;
  let total = 0;
  const groups = new Map();
  const count = (isDone) => {
    total += 1;
    if (isDone) done += 1;
  };
  for (const course of section?.courses || []) {
    if (!course?.code) continue;
    const isDone = completed.has(course.code);
    if (course.choice) groups.set(course.choice, groups.get(course.choice) || isDone);
    else if (section.title !== ADDED_SECTION && OPTION_KINDS.has(kindOf(section, course))) {
      if (isDone || added.has(course.code)) count(isDone);
    } else count(isDone);
  }
  for (const groupDone of groups.values()) count(groupDone);
  return { done, total };
}

const levelOf = (title) => Number(title?.match(/level\s*(\d+)/i)?.[1] ?? 99);

const noUoc = (section) =>
  section?.courses?.length > 0 && section.courses.every((c) => c.uoc !== "" && c.uoc != null && Number(c.uoc) === 0);

export function orderSections(sections) {
  const rank = (s) => (noUoc(s) ? 1000 : levelOf(s.title));
  return [...(sections || [])].sort((a, b) => rank(a) - rank(b));
}
