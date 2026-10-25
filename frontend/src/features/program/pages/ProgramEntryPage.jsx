import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingPage from "../components/LoadingPage";
import GenerationError from "../components/GenerationError";
import { UserAuth } from "@/app/AuthContext";
import { openOwnRoadmap } from "../utils/roadmapEntry";

function ProgramEntryPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const userId = session?.user?.id;
  const step = searchParams.get("step");
  const view = searchParams.get("view");
  const focus = searchParams.get("focus");
  const section = searchParams.get("section");

  const accessToken = session?.access_token;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    openOwnRoadmap({ userId, accessToken, navigate, step, view, focus, section, isActive: () => active }).catch((err) => {
      console.error("Opening roadmap failed:", err);
      if (active) setError(err);
    });
    return () => { active = false; };
  }, [userId, accessToken, navigate, step, view, focus, section, attempt]);

  if (error) {
    return (
      <GenerationError
        title="We couldn't open your roadmap"
        message="Please try again in a moment."
        onRetry={() => {
          setError(null);
          setAttempt((a) => a + 1);
        }}
        onBack={() => navigate("/dashboard", { replace: true })}
      />
    );
  }

  return <LoadingPage message="Getting your roadmap ready..." progress={30} />;
}

export default ProgramEntryPage;
