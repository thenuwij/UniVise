import { supabase } from "@/shared/lib/supabase";

export async function changeEnrolledProgram(userId, degree) {
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

  return programData;
}
