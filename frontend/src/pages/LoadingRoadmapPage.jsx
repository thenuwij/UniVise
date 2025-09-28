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

// Progress bar animation constants
const PROGRESS_CAP = 95;       // Max before backend finishes
const PROGRESS_STEP = 1.2;     // Increment per tick
const PROGRESS_INTERVAL = 150; // Interval in ms

function LoadingRoadmapPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [progress, setProgress] = useState(0);
  const ranRef = useRef(false);

  // Animate the bar until finished (cap at 95 until backend completes)
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p < PROGRESS_CAP ? p + PROGRESS_STEP : p));
    }, PROGRESS_INTERVAL);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    const accessToken = session?.access_token;
    const type = state?.type;      // undefined until navigation state arrives
    const degree = state?.degree ?? null;

    // Wait until prerequisites are ready
    if (!userId || !accessToken) return;
    if (typeof type !== "string" || !type.trim()) return;

    // 2) Prevent React 18 StrictMode double-run in dev
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


  return <LoadingPage message="Generating your roadmap..." progress={progress} />;
}

export default LoadingRoadmapPage;
