// LoadingRoadmapPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function LoadingRoadmapPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let intervalId;

    const generateAndWait = async () => {
      const userId = session?.user?.id;
      if (!userId) {
        navigate("/login", { replace: true });
        return;
      }

      const accessToken = session?.access_token;
      const type = state?.type || null;
      const degree = state?.degree || null;

      try {
        if (type === "school") {
          // ---------- SCHOOL ROADMAP FLOW ----------
          if (!degree) throw new Error("Missing degree context for school flow.");

          const body = {
            recommendation_id: degree?.source === "hs_recommendation" ? degree?.id : undefined,
            degree_name: degree?.degree_name || degree?.program_name || undefined,
            country: "AU",
          };

          const res = await fetch("http://localhost:8000/roadmap/school", {
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
            state: {
              degree,
              payload: json?.payload || null,
              roadmap_id: json?.roadmap_id || null,
            },
            replace: true,
          });
          return;
        }

        if (type === "unsw") {
          // ---------- UNSW ROADMAP FLOW ----------
          if (!degree) throw new Error("Missing degree context for UNSW flow.");

          const body = {
            degree_id: degree?.id ?? null,
            uac_code: degree?.uac_code ?? null,
            program_name: degree?.degree_name || degree?.program_name || undefined,
            specialisation: degree?.specialisation || undefined,
          };

          const res = await fetch("http://localhost:8000/roadmap/unsw", {
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

          navigate("/roadmap/unsw", {
            state: {
              degree,
              payload: json?.payload || null,
              roadmap_id: json?.roadmap_id || null,
            },
            replace: true,
          });
          return;
        }

        // ---------- DEFAULT UNIVERSITY FLOW (fallback) ----------
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
      } catch (e) {
        console.error("LoadingRoadmapPage error:", e);
        navigate("/roadmap", { replace: true });
      } finally {
        clearInterval(intervalId);
        setProgress(100);
      }
    };

    // Smooth progress bar
    intervalId = setInterval(() => {
      setProgress((prev) => (prev < 95 ? prev + 1.5 : prev));
    }, 150);

    generateAndWait();
    return () => clearInterval(intervalId);
  }, [session, navigate, state]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center mb-6">
        <div className="animate-pulse text-xl text-sky-700 font-medium">
          Generating your roadmap...
        </div>
      </div>
      <div className="w-full max-w-md bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="h-4 transition-all duration-200 bg-sky-600"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default LoadingRoadmapPage;
