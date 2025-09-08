import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { HiSparkles, HiArrowRight, HiOutlineLightBulb } from "react-icons/hi";
import { DashboardNavBar } from "../components/DashboardNavBar";
import { MenuBar } from "../components/MenuBar";
import { Button } from "flowbite-react";
import { Header } from "../components/Header";

const personalityDescriptions = {
  Realistic: {
    name: "Realistic",
    summary: "Hands-on, practical, and mechanical. You enjoy working with tools, machines, or being outdoors.",
  },
  Investigative: {
    name: "Investigative",
    summary: "Analytical, curious, and intellectual. You enjoy solving problems, researching, and understanding how things work.",
  },
  Artistic: {
    name: "Artistic",
    summary: "Creative, expressive, and original. You enjoy design, writing, music, or other artistic pursuits.",
  },
  Social: {
    name: "Social",
    summary: "Empathetic, helpful, and people-focused. You enjoy teaching, counseling, or supporting others.",
  },
  Enterprising: {
    name: "Enterprising",
    summary: "Persuasive, confident, and ambitious. You enjoy leading, managing, or launching new ideas.",
  },
  Conventional: {
    name: "Conventional",
    summary: "Organised, detail-oriented, and structured. You enjoy working with systems, data, and routines.",
  },
};

// ---------- tiny helpers ----------
const cap = (s) => (typeof s === "string" && s.length ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);

const toPercent = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return Math.max(0, Math.min(100, v <= 1 ? v * 100 : v));
  if (typeof v === "string") {
    const m = v.match(/(\d+(?:\.\d+)?)\s*%?/);
    return m ? Math.max(0, Math.min(100, parseFloat(m[1]))) : 0;
  }
  return 0;
};

// ---------- UI atoms ----------
function AuraShell({ children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200  backdrop-blur-xl shadow-sm">
      {/* soft spotlight aura */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(680px_260px_at_92%_-12%,rgba(56,189,248,0.18),transparent),radial-gradient(560px_260px_at_0%_-10%,rgba(99,102,241,0.16),transparent)]" />
      <div className="relative p-6 sm:p-8">{children}</div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
      {children}
    </span>
  );
}

function TraitBar({ label, value }) {
  // value is the raw sum (0–25)
  const pct = Math.round((value / 25) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
      <div className="flex items-center justify-between mb-2">
        {/* Label + raw score */}
        <span className="text-slate-700 font-medium capitalize">
          {label}
        </span>
        {/* Percentage */}
        <span className="text-slate-600 text-sm">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}


function TypeCard({ typeKey }) {
  const key = cap(typeKey);
  const d = personalityDescriptions[key];
  return (
    <div className="rounded-2xl p-5 card-glass-spotlight">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs">
          {key?.[0] || "?"}
        </span>
        <h3 className="text-lg font-semibold">{d?.name || key}</h3>
      </div>
      <p>{d?.summary || "Description not available."}</p>
    </div>
  );
}

// ---------- Page ----------
const PersonalityResultPage = () => {
  const navigate = useNavigate();
  const { session } = UserAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);
  
  const generateTraitDescription = async () => {
    const resp = await fetch('http://localhost:8000/traits/results', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${session?.access_token}` },
    });
    if (!resp.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await resp.json();
      console.log("Recommendations:", data);
      return data;
  }

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
        console.error("Error fetching result:", error);
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
      <div className="min-h-screen grid place-items-center bg-gradient-to-tr from-sky-100 via-white to-indigo-100">
        <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-sm backdrop-blur-xl">
          <p className="text-slate-600">Loading your personality result…</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { top_types = [], result_summary, trait_scores } = result;

  return (
    <div className="w-full flex flex-col max-h-screen">
      <Header />
        <div className="flex-1 p-4 sm:p-6">
        <AuraShell>
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
            Personality Insights
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold">
            Your Personality Result
          </h1>
          <p className="mt-2 text-lg ">
            You are a{" "}
            <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              {result_summary}
            </span>{" "}
            type.
          </p>

          {/* Top types chips */}
          {Array.isArray(top_types) && top_types.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {top_types.map((t) => (
                <Chip key={t}>{cap(t)}</Chip>
              ))}
            </div>
          )}
        </div>

        {/* Type descriptions */}
        {Array.isArray(top_types) && top_types.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {top_types.map((t) => (
              <TypeCard key={t} typeKey={t} />
            ))}
          </div>
        )}

        {/* What this means */}
        <div className="mt-8 card-glass-spotlight p-4">
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineLightBulb className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold ">What this means for you</h3>
          </div>
          <p>
            Your profile blends the strengths of your top traits. Use this to guide subject choices,
            projects, and internship hunting. We’ll tailor recommendations to this pattern on your Dashboard.
          </p>
        </div>

        {/* Trait Scores */}
        {trait_scores && (
          <div className="mt-10">
            <h3 className="text-lg font-semibold  mb-3">Trait Scores</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(trait_scores).map(([trait, score]) => (
                <TraitBar key={trait} label={trait} value={score} />
              ))}
            </div>
          </div>
        )}

        {/* CTA row */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Button
            onClick={() => navigate("/quiz")}
            pill
            size="xl"
            color="alternative"
          >
            Retake Quiz
          </Button>

          <Button
            onClick={() => navigate("/dashboard")}
            pill
            size="xl"
            >
            Continue to Dashboard
            <HiArrowRight className="h-4 w-4 opacity-80 group-hover:translate-x-0.5 transition" />
          </Button>
        </div>

        {/* Subtle tip */}
        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-00">
          Tip: Your recommendations and roadmap will adapt to these traits.
        </p>
      </AuraShell>
      </div>
    </div>
  );
};

export default PersonalityResultPage;
