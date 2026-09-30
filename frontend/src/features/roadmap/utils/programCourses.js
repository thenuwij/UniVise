import { supabase } from "@/shared/lib/supabase";

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

function courseCodesOf(sections) {
  const codes = sections.flatMap((s) => s.courses || []).map((c) => c.code).filter(Boolean);
  return Array.from(new Set(codes));
}

export async function fetchMajorSections(userId, degreeCode) {
  const { data: selections } = await supabase
    .from("user_specialisation_selections")
    .select("major_id")
    .eq("user_id", userId)
    .eq("degree_code", degreeCode)
    .limit(1);
  const majorId = selections?.[0]?.major_id;
  if (!majorId) return null;
  const { data: spec } = await supabase
    .from("unsw_specialisations")
    .select("major_name, sections")
    .eq("id", majorId)
    .maybeSingle();
  if (!spec) return null;
  const sections = parseSections(spec.sections).filter(
    (sec) => hasCourses(sec) && !sec.title?.toLowerCase().includes("overview")
  );
  return sections.length ? { name: spec.major_name, sections } : null;
}

export async function fetchComponentDegrees(degreeCode) {
  const { data: degree } = await supabase
    .from("unsw_degrees_final")
    .select("program_name")
    .eq("degree_code", degreeCode)
    .maybeSingle();
  const name = degree?.program_name;
  if (name?.includes("/")) {
    const { data: parts } = await supabase
      .from("unsw_degrees_final")
      .select("degree_code, program_name")
      .in("program_name", name.split("/").map((n) => n.trim()));
    if (parts?.length) return parts;
  }
  return name ? [{ degree_code: degreeCode, program_name: name }] : [{ degree_code: degreeCode, program_name: degreeCode }];
}

export async function fetchProgramCourseCodes(degreeCode, userId) {
  const { data } = await supabase
    .from("unsw_degrees_final")
    .select("sections")
    .eq("degree_code", degreeCode)
    .maybeSingle();
  const sections = parseSections(data?.sections).filter(hasCourses);
  if (sections.length) return courseCodesOf(sections);
  const major = userId ? await fetchMajorSections(userId, degreeCode) : null;
  return courseCodesOf(major?.sections || []);
}

export async function fetchSpecialisationCourseCodes(degreeCode, userId) {
  const degrees = await fetchComponentDegrees(degreeCode);
  const { data: rows } = await supabase
    .from("user_specialisation_selections")
    .select("major:major_id(sections), minor:minor_id(sections), honours:honours_id(sections)")
    .eq("user_id", userId)
    .in("degree_code", degrees.map((d) => d.degree_code));
  const sections = (rows || [])
    .flatMap((r) => [r.major, r.minor, r.honours])
    .filter(Boolean)
    .flatMap((spec) => parseSections(spec.sections));
  return courseCodesOf(sections);
}
