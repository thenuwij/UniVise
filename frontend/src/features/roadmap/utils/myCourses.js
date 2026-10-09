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
    .map((row) => ({ code: row.code, name: row.name, uoc: row.uoc, section: row.section || ADDED_SECTION }));
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

const OPEN_PART_NOTES = {
  free_elective: "Any approved UNSW course",
  general_education: "Courses from outside your faculty",
  specialisations: "Optional. Filled by choosing a minor",
};

export function openRequirementParts(sections) {
  return (sections || [])
    .filter((s) => s?.title && !s.title.toLowerCase().includes("overview") && !s.courses?.length && Number(s.uoc) > 0 && OPEN_PART_NOTES[s.kind])
    .map((s) => ({ title: s.title, uoc: Number(s.uoc), note: OPEN_PART_NOTES[s.kind], optional: s.kind === "specialisations" }));
}

const levelOfCode = (code) => Number(String(code || "").charAt(4)) || 0;

export function ruleCheck(section, completedRows) {
  const text = `${section?.description || ""} ${section?.notes || ""}`;
  const match = text.match(/minimum of (\d+)\s*UOC of Level (\d)/i);
  if (!match) return null;
  const need = Number(match[1]);
  const level = Number(match[2]);
  const have = (completedRows || [])
    .filter((r) => r?.is_completed && levelOfCode(r.course_code) >= level)
    .reduce((sum, r) => sum + (Number(r.uoc) || 0), 0);
  return { need, level, have, met: have >= need };
}

export function rulePatterns(text) {
  const found = [];
  for (const m of String(text || "").matchAll(/\b([A-Za-z]{4})(\d)(?:\*{3}|x{3})(?![A-Za-z0-9])/gi)) {
    const pattern = { prefix: m[1].toUpperCase(), level: Number(m[2]) };
    if (!found.some((p) => p.prefix === pattern.prefix && p.level === pattern.level)) found.push(pattern);
  }
  return found;
}

export const matchesRule = (code, patterns) =>
  (patterns || []).some((p) => String(code).toUpperCase().startsWith(p.prefix) && levelOfCode(code) === p.level);

const TARGET_TEXT = /(\d+)\s*(?:UOC|units of credit)\s+of the following/i;
const listedCount = (section) => (section?.courses || []).filter((c) => c?.code).length;

export function tidySections(sections) {
  const list = (sections || []).filter((s) => s?.title);
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const section = list[i];
    const uoc = Number(section.uoc) || 0;
    const parentKind = section.kind || "core";
    if ((parentKind === "elective" || parentKind === "core") && uoc > 0 && !listedCount(section)) {
      const children = [];
      let j = i + 1;
      while (j < list.length && listedCount(list[j]) && !Number(list[j].uoc) && (list[j].kind || "core") === parentKind) {
        children.push(list[j]);
        j += 1;
      }
      if (children.length) {
        const seen = new Set();
        const courses = children.flatMap((child) =>
          child.courses.filter((c) => c?.code && !seen.has(c.code) && seen.add(c.code)).map((c) => ({ ...c, kind: "elective", list: child.title }))
        );
        out.push({ ...section, kind: "elective", courses });
        i = j - 1;
        continue;
      }
      out.push({ ...section, kind: parentKind === "elective" ? "elective" : "unlisted", courses: [] });
      continue;
    }
    if (parentKind === "elective" && listedCount(section) && !uoc) {
      const target = String(section.description || "").match(TARGET_TEXT);
      out.push(target ? { ...section, uoc: Number(target[1]) } : section);
      continue;
    }
    out.push(section);
  }
  return out;
}

export const showsOnCourses = (section) =>
  listedCount(section) > 0 || ((section?.kind === "elective" || section?.kind === "unlisted") && Number(section?.uoc) > 0);
