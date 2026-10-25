import { supabase } from "@/shared/lib/supabase";

async function recalculateStats(userId) {
  const { data: courses } = await supabase
    .from("user_completed_courses")
    .select("*")
    .eq("user_id", userId);

  if (!courses) return;

  const uocCompleted = courses
    .filter((c) => c.is_completed)
    .reduce((sum, c) => sum + c.uoc, 0);

  const { data: currentStats } = await supabase
    .from("user_progress_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!currentStats) return;

  const coursesCompletedCount = courses.filter((c) => c.is_completed).length;
  const uocRemaining = currentStats.total_uoc_required - uocCompleted;

  await supabase
    .from("user_progress_stats")
    .update({
      uoc_completed: uocCompleted,
      uoc_remaining: uocRemaining,
      courses_completed_count: coursesCompletedCount,
      last_updated: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export async function fetchCompletedCourses(userId) {
  const { data } = await supabase
    .from("user_completed_courses")
    .select("*")
    .eq("user_id", userId);
  return data || [];
}

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

  await recalculateStats(userId);
  return row;
}
