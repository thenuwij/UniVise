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

      const body = {
        recommendation_id: degree?.source === "hs_recommendation" ? degree?.id : undefined,
        degree_name: degree?.degree_name || degree?.program_name || undefined,
        country: "AU",
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/roadmap/school`, {
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

      navigate("/roadmap/school", {
        state: { degree, payload: json?.payload || null, roadmap_id: json?.roadmap_id || null },
        replace: true,
      });
      return;
    }

    if (type === "unsw") {
      if (!degree) throw new Error("Missing degree context for UNSW flow.");

      const body = {
        degree_id: degree?.id ?? null,
        uac_code: degree?.uac_code ?? null,
        program_name: degree?.degree_name || degree?.program_name || undefined,
        specialisation: degree?.specialisation || undefined,
      };

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

      console.log("Navigating to RoadmapUNSW with roadmap_id:", json?.id || json?.roadmap_id);

      navigate("/roadmap/unsw", {
        state: {
          degree,
          payload: json?.payload || null,
          roadmap_id: json?.id || json?.roadmap_id || null,
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
  } finally {
    setProgress(100);
  }
}
