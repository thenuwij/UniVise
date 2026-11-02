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
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId || !accessToken) return;
    let active = true;
    setStatus(Object.fromEntries(STEPS.map(({ key }) => [key, "waiting"])));
    setSlow(false);
    setFailed(false);
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
      const planned = await run("plan", async () => {
        roadmap = await findOrBuildRoadmap({ userId, accessToken, isActive });
      });
      if (!planned) {
        if (active) setFailed(true);
        return;
      }
      if (!roadmap) {
        if (active) navigate("/dashboard", { replace: true });
        return;
      }
      const started = roadmap;
      await run("paths", async () => {
        roadmap = (await finishRoadmap({ roadmap, accessToken, isActive })) || started;
      });
      const [opportunities, certifications] = await Promise.all([
        run("opportunities", () => loadOpportunities({ roadmapId: roadmap.id, accessToken, isActive })),
        run("certifications", () => loadCertifications({ roadmapId: roadmap.id, accessToken })),
      ]);
      if (active && opportunities && certifications) setTimeout(() => active && navigate("/dashboard", { replace: true }), 600);
      else if (active) setFailed(true);
    })();

    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [userId, accessToken, navigate, attempt]);

  const doneCount = STEPS.filter(({ key }) => status[key] === "done").length;

  return (
    <div className="min-h-screen app-page">
      <Header />
      <main className="mx-auto flex max-w-lg flex-col px-6 py-16">
        <div className="rounded-3xl bg-white p-8 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <h1 className="text-2xl font-bold text-ink-strong">Setting things up for you</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
          Getting everything ready for your degree.
        </p>
        <div
          className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-label="Setup progress"
          aria-valuemin={0}
          aria-valuemax={STEPS.length}
          aria-valuenow={doneCount}
        >
          <div className="h-full rounded-full bg-blue-600 transition-all duration-500 dark:bg-blue-400" style={{ width: `${(doneCount / STEPS.length) * 100}%` }} />
        </div>
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
        {(slow || failed) && (
          <div className="mt-8">
            <p className="text-sm text-ink-muted">
              {failed ? "Some of this couldn't load. You can try again, or carry on and it will keep loading on Home." : "Some of this is taking longer than usual. It will keep loading on Home."}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard", { replace: true })}
                className="button-primary rounded-xl px-5 py-3 text-sm font-semibold"
              >
                Continue to Home
              </button>
              {failed && (
                <button
                  type="button"
                  onClick={() => setAttempt((value) => value + 1)}
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-link ring-1 ring-slate-200 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
