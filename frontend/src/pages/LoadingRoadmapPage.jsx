import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";

function LoadingRoadmapPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let intervalId;

    const generateAndWait = async () => {
      if (!session?.user?.id) return;
      const userId = session.user.id;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const studentType = user?.user_metadata?.student_type;
      if (userError || studentType !== "university") {
        console.error("Invalid student type or user error");
        navigate("/roadmap");
        return;
      }

        console.log("Starting roadmap...");
        await fetch("http://localhost:8000/final-unsw-degrees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        // Poll for result in background
        let retries = 10;
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
      

        clearInterval(intervalId);
        setProgress(100); // Ensure full bar before redirect
        setTimeout(() => navigate("/roadmap"), 500);
    };

    // Smooth progress updater (not tied to Supabase directly)
    intervalId = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) return prev + 1.5;
        return prev; // pause near 100% until real data ready
      });
    }, 150);

    generateAndWait();

    return () => clearInterval(intervalId);
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center mb-6">
        <div className="animate-pulse text-xl text-sky-700 font-medium">
          Generating your roadmap...
        </div>
      </div>
      <div className="w-full max-w-md bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-sky-600 h-4 transition-all duration-200"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

export default LoadingRoadmapPage;
