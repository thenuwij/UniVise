/**
 * Handles generation of roadmap entry recommendations.
 * For university users: calls backend and polls Supabase until
 * recommendations exist. For school users: quick simulated delay.
 *
 * @param {Object} params
 * @param {Object} params.user - Supabase user object
 * @param {string} params.accessToken - Current access token
 * @param {Function} params.navigate - React Router navigate function
 * @param {Object} params.supabase - Supabase client
 * @param {Function} params.setProgress - State setter for progress bar
 */
export async function handleRoadmapEntryGeneration({
  user,
  accessToken,
  navigate,
  supabase,
  setProgress,
}) {
  try {
    const userType = user.user_metadata?.student_type || "university";

    if (userType === "university") {
      // Call backend to generate final recommendations
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/final-unsw-degrees/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: "include",
      });

      const text = await res.text();
      console.log("Backend raw response:", text);

      let json = {};
      try {
        json = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse backend JSON:", err);
      }

      if (!res.ok) {
        console.error("Backend error:", json);
        throw new Error(json?.detail || `Failed to generate (HTTP ${res.status})`);
      }

      // Poll until at least 1 final recommendation appears
      const retries = 15;
      let found = false;
      for (let i = 0; i < retries; i++) {
        const { data: check, error } = await supabase
          .from("final_degree_recommendations")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Supabase poll error:", error);
        }
        if (check) {
          found = true;
          break;
        }
        await new Promise((res) => setTimeout(res, 1000));
      }

      if (!found) {
        console.warn("Final recommendations not found after polling.");
      }
    } else {
      // ---------- SCHOOL: Skip heavy generation ----------
      await new Promise((res) => setTimeout(res, 800));
    }

    // Redirect to main roadmap selection page
    navigate("/roadmap", { replace: true });
  } catch (e) {
    console.error("handleRoadmapEntryGeneration error:", e);
    navigate("/roadmap", { replace: true });
  } finally {
    setProgress(100);
  }
}
