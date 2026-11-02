import { supabase } from "@/shared/lib/supabase";
import { apiJson } from "@/shared/lib/api";
import { fetchSpecialisationIds } from "@/features/program/utils/programCourses";
import { fetchMatchingRoadmap, wait } from "@/features/program/utils/roadmapEntry";
import { buildRoadmap } from "@/features/program/utils/roadmapGeneration";

const POLL_MS = 3000;
const WAIT_FOR_SURVEY_BUILD_MS = 90 * 1000;
const WAIT_FOR_OTHER_REFRESH_MS = 3 * 60 * 1000;

export async function findOrBuildRoadmap({ userId, accessToken, isActive }) {
  const { data: programs, error } = await supabase
    .from("user_enrolled_program")
    .select("degree_code")
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  const degreeCode = programs?.[0]?.degree_code;
  if (!degreeCode) return null;

  const specialisationIds = await fetchSpecialisationIds(degreeCode, userId);
  const started = Date.now();
  while (isActive() && Date.now() - started < WAIT_FOR_SURVEY_BUILD_MS) {
    const roadmap = await fetchMatchingRoadmap(userId, degreeCode, specialisationIds);
    if (roadmap) return roadmap;
    await wait(POLL_MS);
  }
  if (!isActive()) return null;

  const { data: degree, error: degreeError } = await supabase
    .from("unsw_degrees_final")
    .select("id")
    .eq("degree_code", degreeCode)
    .single();
  if (degreeError) throw degreeError;
  await buildRoadmap({ degreeId: degree.id, accessToken });
  const built = await fetchMatchingRoadmap(userId, degreeCode, specialisationIds);
  if (!built) throw new Error("No roadmap was created");
  return built;
}

const sourceLoaded = (source) => source.status === "done" || source.items?.length > 0;

export async function loadOpportunities({ roadmapId, accessToken, isActive }) {
  const readFeed = () => apiJson(`/careers/feed?roadmap_id=${encodeURIComponent(roadmapId)}`, { token: accessToken });
  const feed = await readFeed();
  await Promise.allSettled(
    feed.sources
      .filter((source) => source.stale)
      .map((source) => apiJson("/careers/refresh", { method: "POST", token: accessToken, body: { roadmap_id: roadmapId, source: source.source } }))
  );

  const started = Date.now();
  while (isActive() && Date.now() - started < WAIT_FOR_OTHER_REFRESH_MS) {
    const latest = await readFeed();
    if (!latest.sources.some((source) => source.status === "running")) {
      if (!latest.sources.every(sourceLoaded)) throw new Error("Some career sources failed to refresh");
      return;
    }
    await wait(POLL_MS);
  }
  if (isActive()) throw new Error("Career sources are still refreshing");
}

export async function loadCertifications({ roadmapId, accessToken }) {
  const data = await apiJson(`/careers/certifications?roadmap_id=${encodeURIComponent(roadmapId)}`, { token: accessToken });
  if (data.failed) throw new Error("Certifications could not be generated");
}
