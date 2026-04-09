import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { HiArrowRight } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { UserAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

ChartJS.register(ArcElement, Tooltip, Legend);

const TYPE_META = {
  Realistic: {
    summary: "Hands-on, practical, and mechanical. You enjoy working with tools, machines, or being outdoors.",
    gradient: "from-orange-500 to-amber-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-700",
    text: "text-orange-600 dark:text-orange-400",
    hex: "#f97316",
  },
  Investigative: {
    summary: "Analytical, curious, and intellectual. You enjoy solving problems, researching, and understanding how things work.",
    gradient: "from-blue-500 to-cyan-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-600 dark:text-blue-400",
    hex: "#3b82f6",
  },
  Artistic: {
    summary: "Creative, expressive, and original. You enjoy design, writing, music, or other artistic pursuits.",
    gradient: "from-purple-500 to-pink-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700",
    text: "text-purple-600 dark:text-purple-400",
    hex: "#a855f7",
  },
  Social: {
    summary: "Empathetic, helpful, and people-focused. You enjoy teaching, counseling, or supporting others.",
    gradient: "from-emerald-500 to-teal-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-600 dark:text-emerald-400",
    hex: "#10b981",
  },
  Enterprising: {
    summary: "Persuasive, confident, and ambitious. You enjoy leading, managing, or launching new ideas.",
    gradient: "from-red-500 to-orange-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-600 dark:text-red-400",
    hex: "#ef4444",
  },
  Conventional: {
    summary: "Organised, detail-oriented, and structured. You enjoy working with systems, data, and routines.",
    gradient: "from-indigo-500 to-slate-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    border: "border-indigo-200 dark:border-indigo-700",
    text: "text-indigo-600 dark:text-indigo-400",
    hex: "#6366f1",
  },
};

const MAX_TRAIT_SCORE = 10;
const cap = (s) =>
  typeof s === "string" && s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s;

function CompactTypeCard({ typeKey, isPrimary }) {
  const key = cap(typeKey);
  const meta = TYPE_META[key] || {};
  return (
    <div className={`relative flex items-center gap-4 rounded-2xl border-2 p-4 ${meta.border} ${meta.bg}`}>
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${meta.gradient} text-white text-2xl font-bold shadow-md flex-shrink-0`}>
        {key?.[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`text-xl font-bold ${meta.text}`}>{key}</h3>
          {isPrimary && (
            <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
              Primary
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
          {meta.summary}
        </p>
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

  const pieData = {
    labels: sortedTraits.map(([trait]) => cap(trait)),
    datasets: [
      {
        data: sortedTraits.map(([, score]) => score),
        backgroundColor: sortedTraits.map(([trait]) => (TYPE_META[cap(trait)]?.hex || "#94a3b8") + "cc"),
        borderColor: sortedTraits.map(([trait]) => TYPE_META[cap(trait)]?.hex || "#94a3b8"),
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 0 },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#64748b",
          font: { size: 12, weight: "600" },
          padding: 10,
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw ?? 0;
            const pct = Math.round((val / MAX_TRAIT_SCORE) * 100);
            return ` ${ctx.label}: ${pct}%`;
          },
        },
      },
    },
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <Header />

      {/* Main content — fills remaining height, no scroll */}
      <div className="flex-1 overflow-hidden flex flex-col px-8 xl:px-16 pt-2 pb-4">

        {/* ── Compact centered hero ── */}
        <div className="text-center mb-4 flex-shrink-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Your Personality Type
          </h1>
          <p className="mt-1 text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
            {formattedSummary}
          </p>
        </div>

        {/* ── Compact horizontal type cards ── */}
        <div className="grid grid-cols-2 gap-4 mb-4 flex-shrink-0">
          {top_types[0] && <CompactTypeCard typeKey={top_types[0]} isPrimary />}
          {top_types[1] && <CompactTypeCard typeKey={top_types[1]} isPrimary={false} />}
        </div>

        {/* ── Live pie chart — fixed compact height so CTAs sit higher ── */}
        <div className="flex-shrink-0 h-72 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide flex-shrink-0 text-center">
            Trait Distribution
          </h3>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* ── Centered CTAs — sit directly below pie, not flush to bottom ── */}
        <div className="mt-5 flex items-center justify-center gap-4 flex-shrink-0">
          <button
            onClick={() => navigate("/quiz")}
            className="px-8 py-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 transition-all shadow-sm"
          >
            Retake Quiz
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="btn-cta-pulse inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-lg font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            Continue to Dashboard
            <HiArrowRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalityResultPage;
