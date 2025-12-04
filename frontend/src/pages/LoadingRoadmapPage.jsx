import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingPage from "../components/LoadingPage";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { handleRoadmapGeneration } from "../utils/roadmapGeneration";

const getProgressMessage = (progress, isRegeneration, type) => {
  
  // Message for school roadmaps
  if (type === "school") {
    return isRegeneration ? "Regenerating your roadmap..." : "Generating your roadmap...";
  }

  // Messages for UNSW roadmaps 
  const prefix = isRegeneration ? "Regenerating" : "Generating";
  
  if (progress < 20) return `${prefix} roadmap structure...`;
  if (progress < 60) return "Analyzing program details...";
  if (progress < 95) return "Finalizing your roadmap...";
  return "Almost done...";
};

function LoadingRoadmapPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [progress, setProgress] = useState(0);
  const ranRef = useRef(false);

  const isRegeneration = state?.isRegeneration || false;

  console.log("LoadingRoadmapPage state:", state);
  console.log("isRegeneration:", isRegeneration);

  useEffect(() => {
    const userId = session?.user?.id;
    const accessToken = session?.access_token;
    const type = state?.type;
    const degree = state?.degree ?? null;

    // Wait until prerequisites are ready
    if (!userId || !accessToken) return;
    if (typeof type !== "string" || !type.trim()) return;
    if (ranRef.current) return;

    ranRef.current = true;

    handleRoadmapGeneration({
      type,
      degree,
      accessToken,
      userId,
      navigate,
      supabase,
      setProgress,
    });
  }, [
    session?.user?.id,
    session?.access_token,
    state?.type,
    state?.degree,
    navigate,
    supabase,
  ]);

  const message = getProgressMessage(progress, isRegeneration, state?.type);

  return <LoadingPage message={message} progress={progress} />;
}

export default LoadingRoadmapPage;