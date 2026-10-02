import { apiFetch } from "@/shared/lib/api";

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
  type,
  degree,
  accessToken,
  userId,
  navigate,
  supabase,
  setProgress,
  returnToStep,
  onError,
}) {
  try {
    if (type === "school") {
      if (!degree) throw new Error("Missing degree context for school flow.");
      
      setProgress(20);
      
      const body = {
        recommendation_id: degree?.source === "hs_recommendation" ? degree?.id : undefined,
        degree_name: degree?.degree_name || degree?.program_name || undefined,
        country: "AU",
      };
      
      setProgress(40);
      
      // Start smooth progress animation to 95%
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 0.3; // Increment by 0.3% every interval
        });
      }, 100); // Update every 100ms
      
      const res = await apiFetch("/roadmap/school", {
        method: "POST",
        token: accessToken,
        credentials: "include",
        body,
      });
      
      // Stop the animation once we get response
      clearInterval(progressInterval);
      setProgress(95);
      
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || `Failed to generate (HTTP ${res.status})`);
      
      navigate("/roadmap/school", {
        state: { degree, payload: json?.payload || null, roadmap_id: json?.id || null },
        replace: true,
      });
      return;
    }

    if (type === "unsw") {
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
      navigate(`/roadmap/unsw?id=${roadmapId}${stepQuery}`, { replace: true });
      return;
    }

    // Fallback ONLY when caller explicitly passed null for type
    if (type === null) {
      await apiFetch("/final-unsw-degrees/", {
        method: "POST",
        token: accessToken,
        credentials: "include",
      });

      const retries = 10;
      for (let i = 0; i < retries; i++) {
        const { data: check } = await supabase
          .from("final_degree_recommendations")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (check) break;
        await new Promise((res) => setTimeout(res, 1000));
      }

      navigate("/roadmap", { replace: true });
    }
  } catch (e) {
    console.error("handleRoadmapGeneration error:", e);
    if (onError) {
      onError(e);
      return;
    }
    navigate("/roadmap", { replace: true });
  }
}
