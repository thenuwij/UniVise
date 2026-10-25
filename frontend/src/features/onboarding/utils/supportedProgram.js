import { supabase } from "@/shared/lib/supabase";

const NON_BACHELOR_PROGRAM =
  /\b(master|graduate diploma|graduate certificate|doctor|phd|diploma|certificate|preparation|preparatory)\b|pathway program/i;
export const UNSUPPORTED_PROGRAM_MESSAGE =
  "UniVise doesn't support this degree yet, so you can't continue for now.";

export function isSupportedProgram(program) {
  return (
    !!program?.id &&
    !!program.degree_code &&
    !!program.program_name &&
    program.is_offered === true &&
    !NON_BACHELOR_PROGRAM.test(program.program_name)
  );
}

export async function fetchSupportedDegree(code) {
  if (!code) return null;
  const { data, error } = await supabase
    .from("unsw_degrees_final")
    .select("id,degree_code,program_name,is_offered")
    .eq("degree_code", code)
    .maybeSingle();
  if (error) throw error;
  return isSupportedProgram(data) ? data : null;
}

export async function fetchSupportedEnrolment(userId) {
  const { data, error } = await supabase
    .from("user_enrolled_program")
    .select("degree_code")
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  return fetchSupportedDegree(data?.[0]?.degree_code);
}
