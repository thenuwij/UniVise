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
  const rank = (s) => (noUoc(s) ? 1000 : levelOf(s.under || s.title));
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
  for (const m of String(text || "").matchAll(/\b([A-Za-z]{4}\d{0,3})([*x#]{1,4})(?![A-Za-z0-9*#])/gi)) {
    if (m[1].length + m[2].length !== 8) continue;
    const prefix = m[1].toUpperCase();
    if (!found.some((p) => p.prefix === prefix)) found.push({ prefix });
  }
  return found;
}

export const sectionRules = (section) => (section?.rules?.length ? section.rules : rulePatterns(section?.description));

export const canCheckRules = (rules) => (rules || []).length > 0 && rules.every((r) => r.prefix);

export const matchesRule = (code, rules) => {
  const upper = String(code).toUpperCase();
  return (rules || []).some((r) => r.prefix && upper.startsWith(r.prefix) && !(r.except || []).includes(upper));
};

const TARGET_TEXT = /(\d+)\s*(?:UOC|units of credit)\s+(?:of|from) the following/i;
const LOOSE_TARGET = /(?:at least|either|take|complete)\s+(\d+)\s*(?:UOC|units of credit)/i;
const readTarget = (text) => Number((String(text || "").match(TARGET_TEXT) || String(text || "").match(LOOSE_TARGET) || [])[1]) || 0;
const listedCount = (section) => (section?.courses || []).filter((c) => c?.code).length;
const hasText = (section) => Boolean(String(section?.description || "").trim());
const baseTitle = (title) => {
  const full = String(title || "").trim();
  return (full.replace(/\s*(?:core\s+)?courses?\s*$/i, "") || full).toLowerCase();
};
const asElective = (courses) => courses.map((c) => ({ ...c, kind: "elective", choice: undefined }));

function isContinuation(previous, section) {
  if (!previous || !listedCount(section) || hasText(section) || Number(section.uoc)) return false;
  const kind = section.kind || "core";
  if (kind === "choice" || (previous.kind || "core") !== kind) return false;
  const base = baseTitle(previous.title);
  return Boolean(base) && baseTitle(section.title).startsWith(base);
}

function mergeContinuations(list) {
  const out = [];
  for (const section of list) {
    const previous = out[out.length - 1];
    if (isContinuation(previous, section)) {
      const seen = new Set((previous.courses || []).map((c) => c.code));
      out[out.length - 1] = { ...previous, courses: [...(previous.courses || []), ...section.courses.filter((c) => c?.code && !seen.has(c.code))] };
    } else {
      out.push(section);
    }
  }
  return out;
}

function tidyCore(section, nextIsChoice) {
  const courses = (section.courses || []).filter((c) => c?.code);
  if (!courses.length) return section;
  const plain = courses.filter((c) => !c.choice);
  const target = Number(section.uoc) || readTarget(section.description);
  if (!target) {
    const zero = section.uoc === 0 || section.uoc === "0";
    if (zero && plain.length > 1 && !hasText(section) && /\bcourse$/i.test(String(section.title).trim())) {
      return { ...section, pickOne: `${section.title}: one of`, courses: courses.map((c) => (c.choice ? c : { ...c, choice: `${section.title}: one of` })) };
    }
    return section;
  }
  const withTarget = { ...section, uoc: target };
  if (plain.some((c) => c.uoc == null || c.uoc === "")) return withTarget;
  const groups = new Map();
  for (const c of courses) if (c.choice && !groups.has(c.choice)) groups.set(c.choice, Number(c.uoc) || 0);
  const listed = plain.reduce((sum, c) => sum + (Number(c.uoc) || 0), 0) + [...groups.values()].reduce((x, y) => x + y, 0);
  if (listed === target || (listed < target && nextIsChoice)) return withTarget;
  return { ...withTarget, kind: "elective", courses: asElective(courses) };
}

const shareOf = (section) =>
  Number(section.uoc) || (section.kind === "choice" ? Number((section.courses || []).find((c) => c?.code)?.uoc) || 0 : 0);

function attachHeadings(sections) {
  const out = [];
  for (let i = 0; i < sections.length; i += 1) {
    const header = sections[i];
    const target = Number(header.uoc) || 0;
    if (header.kind === "unlisted" && target) {
      let sum = 0;
      let j = i + 1;
      while (j < sections.length && sum < target && !["unlisted", "info", "limit"].includes(sections[j].kind)) {
        sum += shareOf(sections[j]);
        j += 1;
      }
      if (j > i + 1 && sum === target) {
        const heading = { title: header.title, uoc: target };
        sections.slice(i + 1, j).forEach((child, k) => out.push({ ...child, under: header.title, ...(k === 0 ? { heading } : {}) }));
        i = j - 1;
        continue;
      }
    }
    out.push(header);
  }
  return out;
}

export function tidySections(sections) {
  const list = mergeContinuations((sections || []).filter((s) => s?.title));
  const out = [];
  for (let i = 0; i < list.length; i += 1) {
    const section = list[i];
    const uoc = Number(section.uoc) || 0;
    const parentKind = section.kind || "core";
    if ((parentKind === "elective" || parentKind === "core") && uoc > 0 && !listedCount(section)) {
      const children = [];
      let j = i + 1;
      while (j < list.length && !Number(list[j].uoc) && (list[j].kind || "core") === parentKind) {
        children.push(list[j]);
        j += 1;
      }
      if (children.length) {
        const seen = new Set();
        const courses = children.flatMap((child) =>
          (child.courses || []).filter((c) => c?.code && !seen.has(c.code) && seen.add(c.code)).map((c) => ({ ...c, kind: "elective", list: child.title }))
        );
        out.push({ ...section, kind: "elective", courses });
        i = j - 1;
        continue;
      }
      out.push({ ...section, kind: parentKind === "elective" ? "elective" : "unlisted", courses: [] });
      continue;
    }
    if (parentKind === "elective" && listedCount(section) && !uoc) {
      const target = readTarget(section.description);
      out.push(target ? { ...section, uoc: target } : section);
      continue;
    }
    const tidied = parentKind === "core" ? tidyCore(section, list[i + 1]?.kind === "choice") : section;
    const previous = out[out.length - 1];
    if (tidied.pickOne && previous?.pickOne) {
      out.push({ ...tidied, pickOne: previous.pickOne, courses: tidied.courses.map((c) => (c.choice === tidied.pickOne ? { ...c, choice: previous.pickOne } : c)) });
    } else {
      out.push(tidied);
    }
  }
  return attachHeadings(out);
}

export const showsOnCourses = (section) =>
  listedCount(section) > 0 || ((section?.kind === "elective" || section?.kind === "unlisted") && Number(section?.uoc) > 0);
