import { apiFetch } from "@/shared/lib/api";
import { roadmapViewPath } from "./roadmapSteps";

export async function buildRoadmap({ degreeId, accessToken }) {
  const res = await apiFetch("/roadmap/unsw", {
    method: "POST",
    token: accessToken,
    credentials: "include",
    body: { degree_id: degreeId },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.detail || `Failed to generate (HTTP ${res.status})`);

  const roadmapId = json?.id || json?.roadmap_id;
  if (roadmapId) {
    apiFetch(`/roadmap/unsw/${roadmapId}/industry`, {
      method: "POST",
      token: accessToken,
      credentials: "include",
    })
      .then((industry) => {
        if (!industry.ok) console.error("Careers, internships and societies failed:", industry.status);
      })
      .catch((err) => console.error("Careers, internships and societies failed:", err));
  }
  return roadmapId;
}

export async function handleRoadmapGeneration({
  degree,
  accessToken,
  navigate,
  setProgress,
  returnToStep,
  view,
  onError,
}) {
  try {
    if (!degree) throw new Error("Missing degree context for UNSW flow.");

    setProgress(5);
    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      currentProgress = Math.min(currentProgress + 0.15, 95);
      setProgress(currentProgress);
    }, 100);

    let roadmapId;
    try {
      roadmapId = await buildRoadmap({ degreeId: degree?.degree_id ?? degree?.id ?? null, accessToken });
    } finally {
      clearInterval(progressInterval);
    }

    setProgress(100);
    const stepQuery = returnToStep ? `&step=${returnToStep}` : "";
    navigate(`${roadmapViewPath(view)}?id=${roadmapId}${stepQuery}`, { replace: true });
  } catch (e) {
    console.error("handleRoadmapGeneration error:", e);
    if (onError) {
      onError(e);
      return;
    }
    navigate("/roadmap", { replace: true });
  }
}
