import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingPage from "../components/LoadingPage";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { handleRoadmapEntryGeneration } from "../utils/roadmapEntry";

// Progress bar animation constants
const PROGRESS_CAP = 95;      
const PROGRESS_STEP = 1.5;     
const PROGRESS_INTERVAL = 150; 

function LoadingRoadmapEntryPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

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
    });
    
  }, [session?.user, session?.access_token, navigate]);

  return (
    <LoadingPage
      message="Generating your recommendations for roadmap..."
      progress={progress}
    />
  );
}

export default LoadingRoadmapEntryPage;
