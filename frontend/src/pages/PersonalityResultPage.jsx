import { useEffect, useState } from "react";
import { HiArrowRight, HiOutlineLightBulb } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const TYPE_META = {
  Realistic: {
    summary: "Hands-on, practical, and mechanical. You enjoy working with tools, machines, or being outdoors.",
    gradient: "from-orange-500 to-amber-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-700",
    text: "text-orange-600 dark:text-orange-400",
    bar: "from-orange-500 to-amber-400",
  },
  Investigative: {
    summary: "Analytical, curious, and intellectual. You enjoy solving problems, researching, and understanding how things work.",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-600 dark:text-blue-400",
    bar: "from-blue-500 to-cyan-400",
  },
  Artistic: {
    summary: "Creative, expressive, and original. You enjoy design, writing, music, or other artistic pursuits.",
    gradient: "from-purple-500 to-pink-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700",
    text: "text-purple-600 dark:text-purple-400",
    bar: "from-purple-500 to-pink-400",
  },
  Social: {
    summary: "Empathetic, helpful, and people-focused. You enjoy teaching, counseling, or supporting others.",
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-600 dark:text-emerald-400",
    bar: "from-emerald-500 to-teal-400",
  },
  Enterprising: {
    summary: "Persuasive, confident, and ambitious. You enjoy leading, managing, or launching new ideas.",
    gradient: "from-red-500 to-orange-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-600 dark:text-red-400",
    bar: "from-red-500 to-orange-400",
  },
  Conventional: {
    summary: "Organised, detail-oriented, and structured. You enjoy working with systems, data, and routines.",
    gradient: "from-indigo-500 to-slate-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-700",
    text: "text-indigo-600 dark:text-indigo-400",
    bar: "from-indigo-500 to-slate-400",
  },
};

const MAX_TRAIT_SCORE = 10;
const cap = (s) =>
  typeof s === "string" && s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;

function TypeCard({ typeKey, isPrimary }) {
  const key = cap(typeKey);
  const meta = TYPE_META[key] || {};
  return (
    <div className={`relative flex flex-col rounded-2xl border-2 p-7 h-full ${meta.border} ${meta.bg} overflow-hidden`}>
      {isPrimary && (
        <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
          Primary
        </span>
      )}
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.gradient} text-white text-2xl font-bold mb-5 shadow-md`}>
        {key?.[0]}
      </div>
      <h3 className={`text-2xl font-bold mb-3 ${meta.text}`}>{key}</h3>
      <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed flex-1">{meta.summary}</p>
      <div className={`mt-6 h-1 w-16 rounded-full bg-gradient-to-r ${meta.gradient} opacity-60`} />
    </div>
  );
}

function TraitBar({ label, value, isTop }) {
  const pct = Math.min(100, Math.round((value / MAX_TRAIT_SCORE) * 100));
  const key = cap(label);
  const meta = TYPE_META[key] || {};
  return (
    <div className={`rounded-xl px-4 py-3 border ${isTop ? `${meta.border} ${meta.bg}` : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-semibold capitalize ${isTop ? meta.text : "text-slate-600 dark:text-slate-300"}`}>
          {label}
        </span>
        <span className={`text-sm font-bold ${isTop ? meta.text : "text-slate-400"}`}>{pct}%</span>
      </div>
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${isTop ? (meta.bar || meta.gradient) : "from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700"} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const PersonalityResultPage = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const generateTraitDescription = async () => {
    await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/traits/results`, {
      method: "GET",
      headers: { Authorization: `Bearer ${session?.access_token}` },
    }).catch(console.error);
  };

  useEffect(() => {
    const fetchResult = async () => {
      const { data, error } = await supabase
        .from("personality_results")
        .select("*")
        .eq("user_id", session?.user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        navigate("/quiz");
      } else {
        setResult(data);
        generateTraitDescription();
      }
      setLoading(false);
    };

    if (session?.user?.id) fetchResult();
  }, [session, navigate]);

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 dark:text-slate-400 text-sm">Loading your result…</div>
      </div>
    );
  }

  if (!result) return null;

  const { top_types = [], result_summary, trait_scores } = result;

  const formattedSummary = result_summary
    ? result_summary.split("-").map(cap).join(" · ")
    : top_types.map(cap).join(" · ");

  const sortedTraits = trait_scores
    ? Object.entries(trait_scores).sort((a, b) => b[1] - a[1])
    : [];

  const topTypeKeys = top_types.map((t) => t.toLowerCase());

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />

      {/* Main content — fills remaining height, no scroll */}
      <div className="flex-1 overflow-hidden flex flex-col px-8 xl:px-16 py-6">

        {/* ── Compact hero ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
              RIASEC Personality Insights
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Your Personality Type
            </h1>
            <p className="mt-1 text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
              {formattedSummary}
            </p>
          </div>

          {/* CTAs — top right */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate("/quiz")}
              className="px-7 py-3.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-base font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 transition-all shadow-sm"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-base font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Go to Dashboard
              <HiArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── 3-column grid fills all remaining height ── */}
        <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">

          {/* Col 1 — Primary type */}
          {top_types[0] && <TypeCard typeKey={top_types[0]} isPrimary />}

          {/* Col 2 — Secondary type */}
          {top_types[1] && <TypeCard typeKey={top_types[1]} isPrimary={false} />}

          {/* Col 3 — Trait breakdown + insight */}
          <div className="flex flex-col gap-4 min-h-0 overflow-hidden">

            {/* Trait bars — flex-1 so it takes remaining space, overflow-hidden to stay in bounds */}
            <div className="flex-1 min-h-0 overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide flex-shrink-0">
                Trait Breakdown
              </h3>
              <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden justify-between">
                {sortedTraits.map(([trait, score]) => (
                  <TraitBar
                    key={trait}
                    label={trait}
                    value={score}
                    isTop={topTypeKeys.includes(trait.toLowerCase())}
                  />
                ))}
              </div>
            </div>

            {/* What this means — fixed height, never grows */}
            <div className="flex-shrink-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <HiOutlineLightBulb className="h-4 w-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">What this means for you</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Eunice will use your personality profile to tailor recommendations, career paths, and your roadmap on the dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalityResultPage;
