import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useRoadmapData() {
  const [userType, setUserType] = useState("university");
  const [hasTranscript, setHasTranscript] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const user = userData?.user;
        if (!user) throw new Error("No authenticated user found");

        const currentUserType = user.user_metadata?.student_type || "university";
        if (!active) return;
        setUserType(currentUserType);
        console.log("Current userType:", currentUserType);
        // Pick correct tables
        const analysisTable =
          currentUserType === "high_school"
            ? "school_report_analysis"
            : "transcript_analysis";

        const recsTable =
          currentUserType === "high_school"
            ? "degree_recommendations"
            : "final_degree_recommendations";

        // Transcript check
        const { data: analysisData } = await supabase
          .from(analysisTable)
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;
        setHasTranscript(!!analysisData);

        // --- Recommendations ---
        const { data: recs, error: recsError } = await supabase
          .from(recsTable)
          .select("*") 
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });


        if (recsError) throw recsError;
        if (!active) return;

        if (currentUserType === "high_school") {
          setRecommendations(recs || []);
          return;
        }

        if (currentUserType === "university" && recs?.length) {
          const codes = recs.map(r => r.degree_code).filter(Boolean);

          const { data: unswRecords, error: unswError } = await supabase
            .from("unsw_degrees_final")
            .select("*")
            .in("degree_code", codes);

          if (unswError) console.warn("UNSW join error:", unswError.message);

          // Merge UNSW degree info + recommendation reason
          const enriched = recs.map(r => {
            const match = unswRecords?.find(u => u.degree_code === r.degree_code);
            return match ? { ...r, ...match, reason: r.reason, id: r.id } : r;
          });

          setRecommendations(enriched);
        } else {
          setRecommendations(recs || []);
        }

      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();

    return () => {
      active = false; 
    };
  }, []);

  return { userType, hasTranscript, recommendations, loading, error };
}
