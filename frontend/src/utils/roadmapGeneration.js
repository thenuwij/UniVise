/**
 * Handles roadmap generation for school and UNSW users.
 * Responsible for calling backend APIs, waiting for Supabase updates,
 * and navigating to the appropriate roadmap page.
 *
 * @param {Object} params
 * @param {"school"|"unsw"|null} params.type - Type of roadmap flow.
 * @param {Object|null} params.degree - Degree object passed from state.
 * @param {string} params.accessToken - Current session access token.
 * @param {string} params.userId - Supabase user ID.
 * @param {Function} params.navigate - React Router navigate function.
 * @param {Object} params.supabase - Supabase client instance.
 * @param {Function} params.setProgress - Progress state setter.
 */
export async function handleRoadmapGeneration({
  type,
  degree,
  accessToken,
  userId,
  navigate,
  supabase,
  setProgress,
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
      
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/roadmap/school`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      // Stop the animation once we get response
      clearInterval(progressInterval);
      setProgress(95);
      
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || `Failed to generate (HTTP ${res.status})`);
      
      navigate("/roadmap/school", {
        state: { degree, payload: json?.payload || null, roadmap_id: json?.roadmap_id || null },
        replace: true,
      });
      return;
    }

    if (type === "unsw") {
      if (!degree) throw new Error("Missing degree context for UNSW flow.");
      
      const body = {
        degree_id: degree?.degree_id ?? degree?.id ?? null,
        uac_code: degree?.uac_code ?? null,
        program_name: degree?.degree_name || degree?.program_name || undefined,
        specialisation: degree?.specialisation || undefined,
      };

      // Stage 1: Call API to start generation
      setProgress(5);

      // Start smooth progress animation BEFORE the blocking fetch
      let currentProgress = 5;
      const progressInterval = setInterval(() => {
        currentProgress = Math.min(currentProgress + 0.5, 90); // Slowly move to 90%
        setProgress(currentProgress);
      }, 100); // Update every 100ms

      // This blocks while backend AI generates (~10-15 seconds)
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/roadmap/unsw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.detail || `Failed to generate (HTTP ${res.status})`);

      // Stop animation once backend responds
      clearInterval(progressInterval);

      const roadmapId = json?.id || json?.roadmap_id;
      let finalPayload = json?.payload || {};

      // Quick final push to 95%
      setProgress(95);

      console.log("Initial generation complete. Navigating to roadmap...");
      console.log("Note: Flexibility, societies, and careers will continue loading in background");

      // Navigate to roadmap
      setProgress(100);
      navigate("/roadmap/unsw", {
        state: {
          degree,
          payload: finalPayload,
          roadmap_id: roadmapId,
          backgroundLoading: true, // Flag to indicate background sections are still loading
        },
        replace: true,
      });
      return;
    }

    // Fallback ONLY when caller explicitly passed null for type
    if (type === null) {
      await fetch("/api/final-unsw-degrees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
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
    navigate("/roadmap", { replace: true });
  }
}
