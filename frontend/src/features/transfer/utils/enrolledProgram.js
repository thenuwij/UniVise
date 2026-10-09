import { supabase } from "@/shared/lib/supabase";

export async function saveEnrolledProgram(userId, degree) {
  const { data: degreeData } = await supabase
    .from("unsw_degrees_final")
    .select("minimum_uoc")
    .eq("degree_code", degree.degree_code)
    .single();

  const totalUOC = parseInt(degreeData?.minimum_uoc || 0);

  await supabase.from("user_enrolled_program").delete().eq("user_id", userId);
  await supabase.from("user_progress_stats").delete().eq("user_id", userId);
  await supabase.from("user_completed_courses").delete().eq("user_id", userId);

  const { data: programData, error: programError } = await supabase
    .from("user_enrolled_program")
    .insert({
      user_id: userId,
      degree_code: degree.degree_code,
      program_name: degree.program_name,
      specialisation_codes: [],
      specialisation_names: [],
    })
    .select()
    .single();

  if (programError) throw programError;

  await supabase.from("user_progress_stats").insert({
    user_id: userId,
    total_uoc_required: totalUOC,
    uoc_completed: 0,
    uoc_remaining: totalUOC,
    current_wam: null,
    courses_completed_count: 0,
    courses_remaining_count: 0,
  });

  return programData;
}

export async function changeEnrolledProgram(userId, degree) {
  const { data: degreeData, error: degreeError } = await supabase
    .from("unsw_degrees_final")
    .select("minimum_uoc")
    .eq("degree_code", degree.degree_code)
    .single();

  if (degreeError) throw degreeError;

  const { data: courses, error: coursesError } = await supabase
    .from("user_completed_courses")
    .select("uoc, is_completed")
    .eq("user_id", userId);

  if (coursesError) throw coursesError;

  const totalUOC = parseInt(degreeData?.minimum_uoc || 0);
  const completed = (courses || []).filter((c) => c.is_completed);
  const uocCompleted = completed.reduce((sum, c) => sum + (c.uoc || 0), 0);

  const { error: clearProgramError } = await supabase.from("user_enrolled_program").delete().eq("user_id", userId);
  if (clearProgramError) throw clearProgramError;

  const { data: programData, error: programError } = await supabase
    .from("user_enrolled_program")
    .insert({
      user_id: userId,
      degree_code: degree.degree_code,
      program_name: degree.program_name,
      specialisation_codes: [],
      specialisation_names: [],
    })
    .select()
    .single();

  if (programError) throw programError;

  const { error: clearStatsError } = await supabase.from("user_progress_stats").delete().eq("user_id", userId);
  if (clearStatsError) throw clearStatsError;

  const { error: statsError } = await supabase.from("user_progress_stats").insert({
    user_id: userId,
    total_uoc_required: totalUOC,
    uoc_completed: uocCompleted,
    uoc_remaining: totalUOC - uocCompleted,
    current_wam: null,
    courses_completed_count: completed.length,
    courses_remaining_count: 0,
  });

  if (statsError) throw statsError;

  return programData;
}
