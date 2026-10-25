import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, CircleAlert, Loader2 } from "lucide-react";
import { UserAuth } from "@/app/AuthContext";
import { Header } from "@/shared/layout/Header";
import { finishRoadmap } from "@/features/program/utils/roadmapEntry";
import { findOrBuildRoadmap, loadCertifications, loadOpportunities } from "../utils/setupPlan";

const STEPS = [
  { key: "plan", label: "Setting up your program plan" },
  { key: "paths", label: "Finding societies and career paths" },
  { key: "opportunities", label: "Getting jobs, internships and events" },
  { key: "certifications", label: "Matching certifications to your careers" },
];
const SLOW_AFTER_MS = 2 * 60 * 1000;

function StepIcon({ status }) {
  if (status === "done") return <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
  if (status === "failed") return <CircleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />;
  if (status === "running") return <Loader2 className="h-5 w-5 animate-spin text-link" aria-hidden="true" />;
  return <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden="true" />;
}

export default function SetupPage() {
  const { session } = UserAuth();
  const navigate = useNavigate();
  const userId = session?.user?.id;
  const accessToken = session?.access_token;
  const [status, setStatus] = useState(() => Object.fromEntries(STEPS.map(({ key }) => [key, "waiting"])));
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!userId || !accessToken) return;
    let active = true;
    const isActive = () => active;
    const mark = (key, value) => active && setStatus((previous) => ({ ...previous, [key]: value }));
    const run = async (key, task) => {
      mark(key, "running");
      try {
        await task();
        mark(key, "done");
        return true;
      } catch (error) {
        console.error(`Setup step ${key} failed:`, error);
        mark(key, "failed");
        return false;
      }
    };
    const slowTimer = setTimeout(() => active && setSlow(true), SLOW_AFTER_MS);

    (async () => {
      let roadmap = null;
      await run("plan", async () => {
        roadmap = await findOrBuildRoadmap({ userId, accessToken, isActive });
        if (!roadmap) throw new Error("No roadmap was created");
      });
      if (!roadmap) {
        if (active) navigate("/dashboard", { replace: true });
        return;
      }
      await run("paths", async () => {
        roadmap = await finishRoadmap({ roadmap, accessToken, isActive });
      });
      const [opportunities, certifications] = await Promise.all([
        run("opportunities", () => loadOpportunities({ roadmapId: roadmap.id, accessToken, isActive })),
        run("certifications", () => loadCertifications({ roadmapId: roadmap.id, accessToken })),
      ]);
      if (active && opportunities && certifications) setTimeout(() => active && navigate("/dashboard", { replace: true }), 600);
      else if (active) setSlow(true);
    })();

    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [userId, accessToken, navigate]);

  return (
    <div className="min-h-screen app-page">
      <Header />
      <main className="mx-auto flex max-w-md flex-col px-6 py-16">
        <h1 className="text-2xl font-bold text-ink-strong">Setting up your plan</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
          This takes about a minute, so everything is ready when you reach Home.
        </p>
        <ol className="mt-8 space-y-4">
          {STEPS.map(({ key, label }) => (
            <li key={key} className="flex items-center gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                <StepIcon status={status[key]} />
              </span>
              <span className={`text-[15px] ${status[key] === "waiting" ? "text-ink-muted" : "font-medium text-ink-strong"}`}>{label}</span>
            </li>
          ))}
        </ol>
        {slow && (
          <div className="mt-10">
            <p className="text-sm text-ink-muted">Some of this is taking longer than usual. It will keep loading on Home.</p>
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="button-primary mt-4 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              Continue to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
