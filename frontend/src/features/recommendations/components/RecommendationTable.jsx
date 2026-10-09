import { Badge, Button } from "flowbite-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiAcademicCap,
  HiArrowRight,
  HiClock,
  HiOfficeBuilding,
} from "react-icons/hi";
import { TbRobot } from "react-icons/tb";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import { card } from "@/shared/ui/cardStyles";
import { roadmapStepUrl } from "@/features/roadmap/utils/roadmapSteps";
import { apiFetch } from "@/shared/lib/api";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";

// Utils
const toPercent = (v) => {
  if (v == null) return 0;
  const n = typeof v === "string"
    ? (() => {
        const m = v.match(/(\d+(?:\.\d+)?)\s*%?/);
        return m ? parseFloat(m[1]) : NaN;
      })()
    : Number(v);
  if (!Number.isFinite(n)) return 0;
  const scaled = n <= 1 ? n * 100 : n;
  return Math.max(0, Math.min(100, scaled));
};

function ProgressBar({ value }) {
  const pct = toPercent(value);
  return (
    <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-blue-600 to-sky-500 rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function BoardShell({ label, footer, children }) {
  return (
    <section className={`${card} p-6 md:p-8`}>
      <h2 className="text-xl font-bold text-ink-strong">{label}</h2>
      <p className="mt-1 text-sm text-ink-muted">Ranked by how well they suit you</p>
      <div className="mt-5">{children}</div>
      {footer}
    </section>
  );
}

function HSItemCard({ rec, onOpen }) {
  return (
    <div
      onClick={onOpen}
      className="card-glass-spotlight rounded-xl p-5 shadow-sm transition hover:shadow-lg cursor-pointer hover:scale-101"
    >
      <div
        className="absolute left-0 top-0 h-full w-3 rounded-l-2xl bg-gradient-to-b from-purple-600 to-blue-500 opacity-80"
        aria-hidden
      />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <HiAcademicCap />
            <span>{rec.degree_name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <HiOfficeBuilding />
            <span>{rec.university_name}</span>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-sm mb-1">ATAR Requirement</span>
          <Badge color="info" className="w-fit ml-10" size="sm">{rec.atar_requirement}</Badge>
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between text-sm">
            <span>Suitability</span>
            <span className="font-medium">{toPercent(rec.suitability_score)}%</span>
          </div>
          <div className="mt-1">
            <ProgressBar value={rec.suitability_score} />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-xm mb-1">Avg. Years</span>
          <div className="inline-flex items-center gap-1">
            <HiClock />
            <span className="font-medium">{rec.est_completion_years}</span>
          </div>
        </div>
      </div>
      <Button
        size="xs"
        color="light"
        pill
        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition"
        onClick={(e) => { e.stopPropagation(); onOpen(); }}
      >
        View details <HiArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

function UniItemCard({ rec }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1.6fr_1.1fr_1.1fr] items-center gap-4 md:gap-8">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-base font-bold text-ink-strong">
            <TrendingUp className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            {rec.career_title}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">{rec.industry}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-ink-muted">Education required</p>
          <span className="mt-1 inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800">
            {rec.education_required}
          </span>
        </div>
        <div>
          <p className="flex items-center justify-between text-xs font-medium text-ink-muted">
            Suitability
            <span className="text-sm font-bold text-ink-strong">{Math.round(toPercent(rec.suitability_score))}%</span>
          </p>
          <div className="mt-1.5">
            <ProgressBar value={rec.suitability_score} />
          </div>
        </div>
        <div>
          <p className="flex items-center gap-2 text-xs font-medium text-ink-muted">
            Salary
            <span className="px-1.5 py-px rounded-full text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">AI-suggested</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-strong">{rec.avg_salary_range}</p>
        </div>
      </div>
    </div>
  );
}

function ItemSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 animate-pulse">
      <div className="h-5 w-1/3 bg-line rounded" />
      <div className="mt-3 h-3 w-2/3 bg-line rounded" />
      <div className="mt-3 h-2.5 w-full bg-line rounded" />
    </div>
  );
}

// Animated indeterminate bar
function IndeterminateBar() {
  return (
    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-[slide_1.6s_ease-in-out_infinite]" />
      <style>{`
        @keyframes slide {
          0%   { transform: translateX(-200%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}

const POLL_INTERVAL_MS = 3_000;
const MAX_POLL_MS = 180_000; // 3 minutes

function PreparingState({ onRegenerate, regenerating }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-10 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
          <TbRobot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      <p className="text-base font-semibold text-slate-800 dark:text-white mb-1">
        Eunice is personalising your recommendations
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        This usually takes under a minute.
      </p>
      <div className="max-w-xs mx-auto mb-5">
        <IndeterminateBar />
      </div>
      <button
        onClick={onRegenerate}
        disabled={regenerating}
        className="text-xs text-slate-400 dark:text-slate-500 underline underline-offset-2 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-40 transition-colors"
      >
        {regenerating ? "Restarting…" : "Taking too long? Click to restart"}
      </button>
    </div>
  );
}

function StuckState({ onRegenerate, regenerating }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-10 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-900/20">
          <TbRobot className="w-8 h-8 text-amber-500" />
        </div>
      </div>
      <p className="text-base font-semibold text-slate-800 dark:text-white mb-2">
        Recommendations couldn't be loaded
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Something went wrong while making your recommendations. Try again below. You won't need to sign up again.
      </p>
      <button
        onClick={onRegenerate}
        disabled={regenerating}
        className="button-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
      >
        {regenerating ? "Regenerating…" : "Regenerate Recommendations"}
      </button>
    </div>
  );
}

// Main
export function RecommendationTable() {
  const { session } = UserAuth();
  const userType = session?.user?.user_metadata?.student_type;
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();
  const pollRef = useRef(null);
  const startedAtRef = useRef(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const fetchRecs = useCallback(async () => {
    let response;
    if (userType === "university") {
      response = await supabase.from("career_recommendations").select("*").eq("user_id", userId);
    } else if (userType === "high_school") {
      response = await supabase.from("degree_recommendations").select("*").eq("user_id", userId);
    }
    return (response?.data ?? []).sort((a, b) => toPercent(b.suitability_score) - toPercent(a.suitability_score));
  }, [userType, userId]);

  const applyRecs = useCallback((data) => {
    setRecommendations(data);
    setPreparing(false);
    setStuck(false);
    stopPolling();
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    setPreparing(true);
    setStuck(false);
    startedAtRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAtRef.current > MAX_POLL_MS) {
        stopPolling();
        setPreparing(false);
        setStuck(true); // timed out — show the regenerate button
        return;
      }
      const polled = await fetchRecs();
      if (polled.length > 0) applyRecs(polled);
    }, POLL_INTERVAL_MS);
  }, [fetchRecs, applyRecs]);

  // Call /recommendation/prompt to (re)generate from scratch
  const regenerate = useCallback(async () => {
    if (!session?.access_token) return;
    setRegenerating(true);
    setStuck(false);
    try {
      const res = await apiFetch("/recommendation/prompt", {
        method: "POST",
        token: session.access_token,
        retry: true,
      });
      if (!res.ok) throw new Error(`Recommendation generation failed (HTTP ${res.status})`);
      // Backend wiped old data — start polling
      startPolling();
    } catch (e) {
      console.error("Regenerate failed:", e);
      setStuck(true);
    } finally {
      setRegenerating(false);
    }
  }, [session, startPolling]);

  useEffect(() => {
    if (!userType || !userId) return;

    const load = async () => {
      setLoading(true);
      const data = await fetchRecs();
      setLoading(false);

      if (data.length > 0) {
        applyRecs(data);
      } else {
        // Nothing in DB — auto-trigger regeneration immediately
        await regenerate();
      }
    };

    load();
    return stopPolling;
  }, [userType, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!userType || !userId) return null;

  const label = userType === "high_school" ? "Your top degree matches" : "Your top career matches";

  return (
    <BoardShell
      label={label}
      footer={
        userType !== "high_school" && recommendations.length > 0 && !preparing && !stuck ? (
          <Link to={roadmapStepUrl("careers")} className="group mt-5 inline-flex items-center gap-1.5 text-[15px] font-bold text-blue-700 dark:text-blue-300 hover:underline">
            Explore careers for your degree
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <><ItemSkeleton /><ItemSkeleton /><ItemSkeleton /></>
        ) : preparing ? (
          <PreparingState onRegenerate={regenerate} regenerating={regenerating} />
        ) : stuck ? (
          <StuckState onRegenerate={regenerate} regenerating={regenerating} />
        ) : recommendations.length > 0 ? (
          recommendations.slice(0, 4).map((rec) =>
            userType === "high_school" ? (
              <HSItemCard key={rec.id} rec={rec} onOpen={() => navigate(`/recommendation/${rec.id}`, { state: { rec } })} />
            ) : (
              <UniItemCard key={rec.id} rec={rec} />
            )
          )
        ) : null}
      </div>
    </BoardShell>
  );
}
