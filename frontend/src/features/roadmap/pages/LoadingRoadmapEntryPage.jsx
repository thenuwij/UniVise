import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingPage from "../components/LoadingPage";
import GenerationError from "../components/GenerationError";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { handleRoadmapEntryGeneration } from "../utils/roadmapEntry";

// Progress bar animation constants
const PROGRESS_CAP = 95;      
const PROGRESS_STEP = 1.5;     
const PROGRESS_INTERVAL = 150; 

function LoadingRoadmapEntryPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Animate the bar until finished 
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p < PROGRESS_CAP ? p + PROGRESS_STEP : p));
    }, PROGRESS_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Generate roadmap recommendations and wait for Supabase updates
  useEffect(() => {
    const user = session?.user;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    handleRoadmapEntryGeneration({
      user,
      accessToken: session?.access_token,
      navigate,
      supabase,
      setProgress,
      onError: setError,
    });
    
  }, [session?.user, session?.access_token, navigate, attempt]);

  if (error) {
    return (
      <GenerationError
        title="We couldn't build your degree recommendations"
        message="The AI service may be busy right now. Please try again in a moment."
        onRetry={() => {
          setError(null);
          setProgress(0);
          setAttempt((a) => a + 1);
        }}
        onBack={() => navigate("/roadmap", { replace: true })}
      />
    );
  }

  return (
    <LoadingPage
      message="Generating your recommendations for roadmap..."
      progress={progress}
    />
  );
}

export default LoadingRoadmapEntryPage;
