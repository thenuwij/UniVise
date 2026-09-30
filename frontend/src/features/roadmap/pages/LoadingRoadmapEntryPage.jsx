import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoadingPage from "../components/LoadingPage";
import GenerationError from "../components/GenerationError";
import { UserAuth } from "@/app/AuthContext";
import { openOwnRoadmap } from "../utils/roadmapEntry";

function LoadingRoadmapEntryPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const userId = session?.user?.id;
  const step = searchParams.get("step");

  useEffect(() => {
    if (!userId) return;
    openOwnRoadmap({ userId, navigate, step }).catch((err) => {
      console.error("Opening roadmap failed:", err);
      setError(err);
    });
  }, [userId, navigate, step, attempt]);

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

  return <LoadingPage message="Opening your roadmap..." progress={30} />;
}

export default LoadingRoadmapEntryPage;
