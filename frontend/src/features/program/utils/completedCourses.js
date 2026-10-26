import { supabase } from "@/shared/lib/supabase";

export async function fetchCompletedCourses(userId) {
  const { data } = await supabase
    .from("user_completed_courses")
    .select("*")
    .eq("user_id", userId);
  return data || [];
}

export const fetchCompletedCourse = (userId, code) =>
  supabase.from("user_completed_courses").select("*").eq("user_id", userId).eq("course_code", code).maybeSingle();

export async function setCourseCompleted({ userId, course, existing, isCompleted, category = null, source = null }) {
  let row;
  if (existing?.id) {
    const { data, error } = await supabase
      .from("user_completed_courses")
      .update({ is_completed: isCompleted })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    row = data;
  } else {
    const { data, error } = await supabase
      .from("user_completed_courses")
      .insert({
        user_id: userId,
        course_code: course.code,
        course_name: course.name,
        uoc: parseInt(course.uoc) || 6,
        is_completed: isCompleted,
        category,
        source_type: source?.source_type || "program",
        source_code: source?.source_code || null,
      })
      .select()
      .single();
    if (error) throw error;
    row = data;
  }

  return row;
}
