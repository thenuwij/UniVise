import { supabase } from "@/shared/lib/supabase";

export async function hasCompletedSurvey(userId) {
  const { data } = await supabase
    .from("student_uni_data")
    .select("user_id")
    .eq("user_id", userId)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function pathAfterSignIn(userId) {
  return (await hasCompletedSurvey(userId)) ? "/dashboard" : "/survey";
}
