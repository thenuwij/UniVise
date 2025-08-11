import React, { useEffect, useState } from "react";
import { Badge, Button } from "flowbite-react";
import { supabase } from "../supabaseClient";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  HiAcademicCap,
  HiOfficeBuilding,
  HiTrendingUp,
  HiClock,
  HiCurrencyDollar,
  HiArrowRight,
} from "react-icons/hi";

// ---------------- Utils ----------------
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
    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// --------------- Aura Shell ---------------
function AuraBoardShell({ label, children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-sm">
      {/* soft spotlight aura */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(680px_260px_at_92%_-12%,rgba(56,189,248,0.18),transparent),radial-gradient(560px_260px_at_0%_-10%,rgba(99,102,241,0.16),transparent)]" />
      <div className="relative p-5 md:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-500" />
            {label}
          </div>
          <span className="text-xs text-slate-500">Click a card to view details</span>
        </div>
        {children}
        <div className="mt-4 text-[11px] text-slate-500">
          Tip: Sorted by suitability (highest first).
        </div>
      </div>
    </div>
  );
}

// --------------- Item Cards ---------------
function HSItemCard({ rec, onOpen }) {
  return (
    <div
      onClick={onOpen}
      className="group relative rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:shadow-md cursor-pointer"
    >
      {/* left accent based on suitability */}
      <div
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gradient-to-b from-purple-600 to-blue-500 opacity-80"
        aria-hidden
      />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
            <HiAcademicCap className="text-slate-700" />
            <span>{rec.degree_name}</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
            <HiOfficeBuilding />
            <span>{rec.university_name}</span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-sm text-slate-500 mb-1">ATAR Requirement</span>
          <Badge color="info" className="w-fit ml-10" size="sm">{rec.atar_requirement}</Badge>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Suitability</span>
            <span className="font-medium text-slate-700">{toPercent(rec.suitability_score)}%</span>
          </div>
          <div className="mt-1">
            <ProgressBar value={rec.suitability_score} />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xm text-slate-500 mb-1">Avg. Years</span>
          <div className="inline-flex items-center gap-1 text-slate-800">
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

function UniItemCard({ rec, onOpen }) {
  return (
    <div
      onClick={onOpen}
      className="group relative rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:shadow-md cursor-pointer"
    >
      <div
        className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-gradient-to-b from-purple-600 to-blue-500 opacity-80"
        aria-hidden
      />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-lg">
            <HiTrendingUp className="text-slate-700" />
            <span>{rec.career_title}</span>
          </div>
          <div className="mt-1 text-sm text-slate-600">{rec.industry}</div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs text-slate-500 mb-1">Education Required</span>
          <Badge color="info" className="w-fit">{rec.education_required}</Badge>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Suitability</span>
            <span className="font-medium text-slate-700">{toPercent(rec.suitability_score)}%</span>
          </div>
          <div className="mt-1">
            <ProgressBar value={rec.suitability_score} />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <span className="text-xs text-slate-500 mb-1">Average Salary</span>
          <div className="inline-flex items-center gap-1 text-slate-800">
            <HiCurrencyDollar />
            <span className="font-medium">{rec.avg_salary_range}</span>
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

function ItemSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 animate-pulse">
      <div className="h-5 w-1/3 bg-slate-200 rounded" />
      <div className="mt-3 h-3 w-2/3 bg-slate-200 rounded" />
      <div className="mt-3 h-2.5 w-full bg-slate-200 rounded" />
    </div>
  );
}

// --------------- Main ---------------
export function RecommendationTable() {
  const { session } = UserAuth();
  const userType = session?.user?.user_metadata?.student_type;
  const userId = session?.user?.id;
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        let response;
        if (userType === "university") {
          response = await supabase
            .from("career_recommendations")
            .select("*")
            .eq("user_id", userId);
        } else if (userType === "high_school") {
          response = await supabase
            .from("degree_recommendations")
            .select("*")
            .eq("user_id", userId);
        }
        if (response?.error) {
          console.error("Error fetching recommendations:", response.error);
        } else {
          const recs = response?.data ?? [];
          setRecommendations(
            recs.sort((a, b) => (toPercent(b.suitability_score) - toPercent(a.suitability_score)))
          );
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userType && userId) {
      fetchRecommendations();
    }
  }, [userType, userId]);

  if (!userType || !userId) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-xl shadow-sm p-6 text-center text-slate-600">
        Loading user data...
      </div>
    );
  }

  const label = userType === "high_school" ? "Degree Recommendations" : "Career Recommendations";

  return (
    <AuraBoardShell label={label}>
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <>
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </>
        ) : recommendations.length > 0 ? (
          recommendations.map((rec) =>
            userType === "high_school" ? (
              <HSItemCard
                key={rec.id}
                rec={rec}
                onOpen={() => navigate(`/recommendation/${rec.id}`, { state: { rec } })}
              />
            ) : (
              <UniItemCard
                key={rec.id}
                rec={rec}
                onOpen={() => navigate(`/recommendation/${rec.id}`, { state: { rec } })}
              />
            )
          )
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-8 text-center text-slate-600">
            No recommendations found.
          </div>
        )}
      </div>
    </AuraBoardShell>
  );
}
