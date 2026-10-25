import { supabase } from "@/shared/lib/supabase";
import { fetchSupportedEnrolment } from "./supportedProgram";

export async function hasCompletedSurvey(userId) {
  const { data, error } = await supabase
    .from("student_uni_data")
    .select("user_id")
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  if (!(data?.length > 0)) return false;
  return !!(await fetchSupportedEnrolment(userId));
}

export async function pathAfterSignIn(userId) {
  return (await hasCompletedSurvey(userId)) ? "/dashboard" : "/survey";
}
