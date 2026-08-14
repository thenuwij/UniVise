import { supabase } from "../supabaseClient";

function parseSections(raw) {
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (err) {
    console.warn("Failed to parse sections", err);
    return [];
  }
}

function toSection(section, source, sourceName) {
  return {
    title: section.title,
    uoc: section.uoc,
    courses: section.courses || [],
    notes: section.notes,
    description: section.description,
    source,
    sourceName,
  };
}

// Assembles the course structure for an enrolled program: core program sections,
// any selected specialisation sections, then the user's own custom courses
// merged into the section they were filed under. Returns null if the degree
// cannot be found, so callers can leave existing state untouched.
export async function buildCourseStructure(programData, userId) {
  const { degree_code, specialisation_codes } = programData;

  const { data: degreeData } = await supabase
    .from("unsw_degrees_final")
    .select("*")
    .eq("degree_code", degree_code)
    .single();
  if (!degreeData) return null;

  const structure = [];

  parseSections(degreeData.sections)?.forEach((section) => {
    if (section?.title?.toLowerCase().includes("overview")) return;
    structure.push(toSection(section, "program", degreeData.program_name));
  });

  if (specialisation_codes?.length > 0) {
    const { data: specialisationData } = await supabase
      .from("unsw_specialisations")
      .select("*")
      .in("major_code", specialisation_codes);

    specialisationData?.forEach((spec) => {
      parseSections(spec.sections)?.forEach((section) => {
        if (section?.title?.toLowerCase().includes("overview")) return;
        structure.push(toSection(section, spec.specialisation_type, spec.major_name));
      });
    });
  }

  const { data: customCourses } = await supabase
    .from("user_custom_courses")
    .select("*")
    .eq("user_id", userId);

  const coursesBySection = {};
  customCourses?.forEach((course) => {
    if (!coursesBySection[course.section_name]) coursesBySection[course.section_name] = [];
    coursesBySection[course.section_name].push({
      code: course.course_code,
      name: course.course_name,
      uoc: course.uoc,
    });
  });

  Object.entries(coursesBySection).forEach(([sectionName, courses]) => {
    const existingSection = structure.find((s) => s.title === sectionName);
    if (existingSection) {
      existingSection.courses = [...existingSection.courses, ...courses];
    }
  });

  return structure;
}
