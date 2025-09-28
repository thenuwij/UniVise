/**
 * LoadingRoadmapEntryPage
 * -----------------------
 * Shows a progress bar while generating final recommendations
 * before entering the roadmap selection page.
 * Calls backend + polls Supabase, then redirects to /roadmap.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import LoadingPage from "../components/LoadingPage";
import { handleRoadmapEntryGeneration } from "../utils/roadmapEntry";

// Progress bar animation constants
const PROGRESS_CAP = 95;       // Max before backend finishes
const PROGRESS_STEP = 1.5;     // Increment per tick
const PROGRESS_INTERVAL = 150; // Interval in ms

function LoadingRoadmapEntryPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  // Animate the bar until finished (cap at 95 until backend completes)
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
