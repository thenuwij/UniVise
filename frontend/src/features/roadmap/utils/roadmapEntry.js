import { supabase } from "@/shared/lib/supabase";

export async function openOwnRoadmap({ userId, navigate, step }) {
  const { data: programs, error: programError } = await supabase
    .from("user_enrolled_program")
    .select("degree_code")
    .eq("user_id", userId)
    .limit(1);
  if (programError) throw programError;

  const degreeCode = programs?.[0]?.degree_code;
  if (!degreeCode) {
    navigate("/roadmap", { replace: true });
    return;
  }

  const { data: roadmaps, error: roadmapError } = await supabase
    .from("unsw_roadmap")
    .select("id")
    .eq("user_id", userId)
    .eq("degree_code", degreeCode)
    .order("created_at", { ascending: false })
    .limit(1);
  if (roadmapError) throw roadmapError;

  if (roadmaps?.length) {
    const stepQuery = step ? `&step=${step}` : "";
    navigate(`/roadmap/unsw?id=${roadmaps[0].id}${stepQuery}`, { replace: true });
    return;
  }

  const { data: degree, error: degreeError } = await supabase
    .from("unsw_degrees_final")
    .select("*")
    .eq("degree_code", degreeCode)
    .single();
  if (degreeError) throw degreeError;

  navigate("/roadmap-loading", {
    replace: true,
    state: { type: "unsw", degree: { ...degree, degree_id: degree.id }, returnToStep: step || null },
  });
}
