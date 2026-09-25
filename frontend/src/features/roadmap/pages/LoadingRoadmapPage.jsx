import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingPage from "../components/LoadingPage";
import GenerationError from "../components/GenerationError";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { handleRoadmapGeneration } from "../utils/roadmapGeneration";

const getProgressMessage = (progress, isRegeneration, type) => {
  
  // Message for school roadmaps
  if (type === "school") {
    return isRegeneration ? "Regenerating your roadmap..." : "Generating your roadmap...";
  }

  // Messages for UNSW roadmaps
  if (isRegeneration) {
    if (progress < 20) return "Customizing roadmap to your chosen specialisation...";
    if (progress < 60) return "Personalising your societies, industry and career sections...";
    if (progress < 95) return "Almost ready with your personalized roadmap...";
    return "Almost done...";
  }

  if (progress < 20) return "Generating roadmap structure...";
  if (progress < 60) return "Analyzing program details...";
  if (progress < 95) return "Finalizing your roadmap...";
  return "Almost done...";
};

function LoadingRoadmapPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const ranRef = useRef(false);

  const isRegeneration = state?.isRegeneration || false;
  const returnToStep = state?.returnToStep || null;

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
      returnToStep,
      onError: type === "unsw" ? setError : undefined,
    });
  }, [
    session?.user?.id,
    session?.access_token,
    state?.type,
    state?.degree,
    navigate,
    supabase,
    attempt,
  ]);

  const retry = () => {
    ranRef.current = false;
    setError(null);
    setProgress(0);
    setAttempt((a) => a + 1);
  };

  if (error) {
    return (
      <GenerationError
        title="We couldn't generate your roadmap"
        message="The AI service may be busy right now. Please try again in a moment."
        onRetry={retry}
        onBack={() => navigate("/roadmap", { replace: true })}
      />
    );
  }

  const message = getProgressMessage(progress, isRegeneration, state?.type);

  return <LoadingPage message={message} progress={progress} />;
}

export default LoadingRoadmapPage;