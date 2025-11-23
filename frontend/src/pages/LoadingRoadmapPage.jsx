/**
 * LoadingRoadmapPage
 * ------------------
 * Shows a progress bar while generating a roadmap (school or UNSW).
 * Uses `handleRoadmapGeneration` to call the backend and redirect
 * once the roadmap is ready.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import LoadingPage from "../components/LoadingPage";
import { handleRoadmapGeneration } from "../utils/roadmapGeneration";

// Progress stage messages
const getProgressMessage = (progress, isRegeneration) => {
  const prefix = isRegeneration ? "Regenerating" : "Generating";

  if (progress < 25) return `${prefix} roadmap structure...`;
  if (progress < 50) return "Building flexibility options...";
  if (progress < 75) return "Finding societies and communities...";
  if (progress < 100) return "Finalizing your roadmap...";
  
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


  const message = getProgressMessage(progress, isRegeneration);
  return <LoadingPage message={message} progress={progress} />;
}

export default LoadingRoadmapPage;
