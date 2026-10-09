import { supabase } from "@/shared/lib/supabase";
import { requiredCount, splitCourses, withAddedCourses } from "./myCourses";

export const THIN_PROGRAM_COURSES = 5;

export function parseSections(raw) {
  try {
    let parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof parsed === "string") parsed = JSON.parse(parsed);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("JSON parse error for sections:", err);
    return [];
  }
}

export const hasCourses = (section) => section?.courses?.length > 0;

const isOverview = (section) => section?.title?.toLowerCase().includes("overview");

export function courseCodesOf(sections) {
  const codes = sections.flatMap((s) => s.courses || []).map((c) => c.code).filter(Boolean);
  return Array.from(new Set(codes));
}

function normaliseProgramName(name = "") {
  return name
    .toLowerCase()
    .replace(/\s+-\s+[a-z]+(\s*\(hons\))?\s*$/i, "")
    .replace(/\(honours\)|\(hons\)|bachelor of/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

async function fetchComponentDegrees(degreeCode) {
  const { data: degree } = await supabase
    .from("unsw_degrees_final")
    .select("program_name")
    .eq("degree_code", degreeCode)
    .maybeSingle();
  const name = degree?.program_name;
  if (name?.includes("/")) {
    const { data: singles } = await supabase
      .from("unsw_degrees_final")
      .select("degree_code, program_name")
      .not("program_name", "like", "%/%");
    const byName = new Map((singles || []).map((d) => [normaliseProgramName(d.program_name), d]));
    const parts = name.split("/").map((part) => byName.get(normaliseProgramName(part))).filter(Boolean);
    if (parts.length) return parts;
  }
  return [{ degree_code: degreeCode, program_name: name || degreeCode }];
}

export async function fetchSpecialisationOptions(degreeCode) {
  const degrees = await fetchComponentDegrees(degreeCode);
  const groups = await Promise.all(degrees.map(async (d) => {
    const { data } = await supabase
      .from("unsw_specialisations")
      .select("id, major_name, specialisation_type")
      .contains("sections_degrees", JSON.stringify([{ degree_code: d.degree_code }]))
      .in("specialisation_type", ["Major", "Honours"])
      .order("major_name");
    return { ...d, options: data || [] };
  }));
  return groups.filter((g) => g.options.length);
}

export async function fetchChosenSpecialisations(degreeCode, userId) {
  if (!degreeCode || !userId) return [];
  const degrees = await fetchComponentDegrees(degreeCode);
  const codes = Array.from(new Set([degreeCode, ...degrees.map((d) => d.degree_code)]));
  const { data: rows } = await supabase
    .from("user_specialisation_selections")
    .select("major:major_id(id, major_name, sections), minor:minor_id(id, major_name, sections), honours:honours_id(id, major_name, sections)")
    .eq("user_id", userId)
    .in("degree_code", codes);
  const seen = new Set();
  return (rows || [])
    .flatMap((r) => [r.major, r.minor, r.honours])
    .filter((spec) => spec && !seen.has(spec.id) && seen.add(spec.id))
    .map((spec) => ({
      id: spec.id,
      name: spec.major_name,
      sections: parseSections(spec.sections).filter((s) => hasCourses(s) && !isOverview(s)),
    }))
    .filter((spec) => spec.sections.length);
}

export async function fetchAddedRows(userId) {
  if (!userId) return [];
  const { data } = await supabase.from("user_custom_courses").select("course_code, course_name, uoc, section_name").eq("user_id", userId);
  return (data || []).map((r) => ({ code: r.course_code, name: r.course_name, uoc: r.uoc, section: r.section_name }));
}

export async function setCourseAdded({ userId, course, section, added }) {
  const table = supabase.from("user_custom_courses");
  const { error } = added
    ? await table.upsert(
        { user_id: userId, course_code: course.code, course_name: course.name || null, uoc: course.uoc ?? null, section_name: section || null },
        { onConflict: "user_id,course_code" }
      )
    : await table.delete().eq("user_id", userId).eq("course_code", course.code);
  if (error) throw error;
}

export async function fetchMyCourses(degreeCode, userId) {
  const [{ data }, specialisations, addedRows] = await Promise.all([
    supabase.from("unsw_degrees_final").select("sections").eq("degree_code", degreeCode).maybeSingle(),
    fetchChosenSpecialisations(degreeCode, userId),
    fetchAddedRows(userId),
  ]);
  const program = { key: degreeCode, sections: parseSections(data?.sections).filter(hasCourses) };
  const mine = withAddedCourses(splitCourses([program, ...specialisations.map((s) => ({ key: s.id, sections: s.sections }))]), addedRows);
  return {
    ...mine,
    added: new Set(addedRows.map((r) => r.code)),
    thin: !specialisations.length && requiredCount(splitCourses([program])) <= THIN_PROGRAM_COURSES,
  };
}

async function fetchSelectionRows(degreeCode, userId) {
  const degrees = await fetchComponentDegrees(degreeCode);
  const codes = Array.from(new Set([degreeCode, ...degrees.map((d) => d.degree_code)]));
  const { data } = await supabase
    .from("user_specialisation_selections")
    .select("degree_code, major_id, minor_id, honours_id, major:major_id(id, major_name, specialisation_type), honours:honours_id(id, major_name, specialisation_type)")
    .eq("user_id", userId)
    .in("degree_code", codes);
  return data || [];
}

export async function fetchSpecialisationIds(degreeCode, userId) {
  const rows = await fetchSelectionRows(degreeCode, userId);
  const ids = rows.flatMap((r) => [r.major_id, r.minor_id, r.honours_id]).filter(Boolean);
  return Array.from(new Set(ids)).sort();
}

export async function fetchSavedChoices(degreeCode, userId) {
  const rows = await fetchSelectionRows(degreeCode, userId);
  return Object.fromEntries(rows.map((r) => [r.degree_code, r.major || r.honours || null]));
}

export async function saveChoices(userId, choices) {
  const rows = Object.entries(choices || {}).map(([degreeCode, spec]) => ({
    user_id: userId,
    degree_code: degreeCode,
    major_id: spec?.specialisation_type === "Major" ? spec.id : null,
    honours_id: spec?.specialisation_type === "Honours" ? spec.id : null,
  }));
  if (!rows.length) return;
  const { error } = await supabase
    .from("user_specialisation_selections")
    .upsert(rows, { onConflict: "user_id,degree_code" });
  if (error) throw error;
}
