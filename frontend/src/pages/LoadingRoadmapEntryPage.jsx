// LoadingRoadmapEntryPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function LoadingRoadmapEntryPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let intervalId;

    const generateAndWait = async () => {
      const user = session?.user;
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const userType = user.user_metadata?.student_type || "university"; // default to uni
      const accessToken = session?.access_token;

      try {
        if (userType === "university") {
          // ---------- UNIVERSITY: Call backend to generate final degree recommendations ----------
          const res = await fetch("http://localhost:8000/final-unsw-degrees/", {
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
          await new Promise((res) => setTimeout(res, 800)); // quick pause for UX
        }

        // Redirect to main roadmap selection page
        navigate("/roadmap", { replace: true });
      } catch (e) {
        console.error("LoadingRoadmapEntryPage error:", e);
        navigate("/roadmap", { replace: true });
      } finally {
        clearInterval(intervalId);
        setProgress(100);
      }
    };

    // Smooth progress bar animation
    intervalId = setInterval(() => {
      setProgress((prev) => (prev < 95 ? prev + 1.5 : prev));
    }, 150);

    generateAndWait();
    return () => clearInterval(intervalId);
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center mb-6">
        <div className="animate-pulse text-xl text-sky-700 font-medium">
          Generating your recommendations for roadmap...
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

export default LoadingRoadmapEntryPage;
