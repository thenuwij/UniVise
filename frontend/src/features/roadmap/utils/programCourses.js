import { supabase } from "@/shared/lib/supabase";

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

export async function fetchComponentDegrees(degreeCode) {
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
      name: spec.major_name,
      sections: parseSections(spec.sections).filter((s) => hasCourses(s) && !isOverview(s)),
    }))
    .filter((spec) => spec.sections.length);
}

export async function fetchMyCourses(degreeCode, userId) {
  const [{ data }, specialisations] = await Promise.all([
    supabase.from("unsw_degrees_final").select("sections").eq("degree_code", degreeCode).maybeSingle(),
    fetchChosenSpecialisations(degreeCode, userId),
  ]);
  const programCodes = courseCodesOf(parseSections(data?.sections).filter(hasCourses));
  const codes = Array.from(new Set([...programCodes, ...courseCodesOf(specialisations.flatMap((s) => s.sections))]));
  return {
    codes,
    thin: !specialisations.length && programCodes.length <= THIN_PROGRAM_COURSES,
  };
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
