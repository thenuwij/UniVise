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
