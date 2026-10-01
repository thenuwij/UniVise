import { supabase } from "@/shared/lib/supabase";
import { apiFetch } from "@/shared/lib/api";
import { fetchSpecialisationIds } from "./programCourses";

const SECTIONS = ["industry_societies", "industry_experience", "career_pathways"];
const STALLED_AFTER_MS = 90 * 1000;
const POLL_MS = 3000;

const sameIds = (a = [], b = []) => a.length === b.length && a.every((id, i) => id === b[i]);
const isComplete = (payload) => SECTIONS.every((k) => payload?.[k]) || (payload?.industry_failed?.length ?? 0) > 0;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchMatchingRoadmap(userId, degreeCode, specialisationIds) {
  const { data: rows, error } = await supabase
    .from("unsw_roadmap")
    .select("id, created_at, payload")
    .eq("user_id", userId)
    .eq("degree_code", degreeCode)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) throw error;
  return (rows || []).find((r) => sameIds(r.payload?.specialisation_ids || [], specialisationIds)) || null;
}

export async function openOwnRoadmap({ userId, accessToken, navigate, step, isActive = () => true }) {
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

  const specialisationIds = await fetchSpecialisationIds(degreeCode, userId);
  let roadmap = await fetchMatchingRoadmap(userId, degreeCode, specialisationIds);
  let finishing = false;

  while (roadmap && !isComplete(roadmap.payload) && isActive()) {
    const age = Date.now() - new Date(roadmap.created_at).getTime();
    if (age > STALLED_AFTER_MS && !finishing) {
      finishing = true;
      await apiFetch(`/roadmap/unsw/${roadmap.id}/industry`, {
        method: "POST",
        token: accessToken,
        credentials: "include",
      }).catch((err) => console.error("Finishing roadmap failed:", err));
    } else {
      await wait(POLL_MS);
    }
    const { data: latest } = await supabase
      .from("unsw_roadmap")
      .select("id, created_at, payload")
      .eq("id", roadmap.id)
      .maybeSingle();
    roadmap = latest;
    if (finishing && roadmap && !isComplete(roadmap.payload)) break;
  }
  if (!isActive()) return;

  if (roadmap) {
    const stepQuery = step ? `&step=${step}` : "";
    navigate(`/roadmap/unsw?id=${roadmap.id}${stepQuery}`, { replace: true });
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
