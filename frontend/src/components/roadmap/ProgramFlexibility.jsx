// src/components/roadmap/ProgramFlexibility.jsx
import RoadmapCard from "./RoadmapCard";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { RefreshCw, TrendingUp, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

/**
 * Premium Program Flexibility Component
 * 
 * Sophisticated design with:
 * - Elegant blue/sky/indigo gradients
 * - Enhanced progress bars
 * - Premium card layouts
 * - Professional visual hierarchy
 */

export default function ProgramFlexibility({
  flexibility,
  simulatorLink = "/switching",
}) {
  const easySwitches =
    flexibility?.easy_switches ||
    flexibility?.flexibility_detailed?.easy_switches ||
    [];

  const [degreeLinks, setDegreeLinks] = useState({});

  useEffect(() => {
    async function fetchIds() {
      const mapping = {};

      for (const opt of easySwitches) {
        if (!opt.program_name) continue;

        const { data, error } = await supabase
          .from("unsw_degrees_final")
          .select("id")
          .ilike("program_name", `%${opt.program_name}%`)
          .maybeSingle();


        if (data?.id) {
          mapping[opt.program_name] = data.id;
        }
      }

      setDegreeLinks(mapping);
    }

    if (easySwitches.length > 0) {
      fetchIds();
    }
  }, [easySwitches]);

  const hasNewData = easySwitches?.length > 0;

  const LoadingShimmer = () => (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/6" />
      <div className="flex gap-2 mt-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-24" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-24" />
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
      
      {/* ========== HEADER ========== */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm">
          <RefreshCw className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Program Flexibility
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Easiest degree switch options and related programs to consider
          </p>
        </div>
      </div>

      {/* ========== DEGREE OPTIONS ========== */}
      {hasNewData && (
        <div className="space-y-5 mb-8">
          {easySwitches.map((opt, i) => {
            const overlap = opt.overlap_percentage || 0;
            const benefits = Array.isArray(opt.key_benefits)
              ? opt.key_benefits
              : typeof opt.key_benefits === "string"
              ? opt.key_benefits.split(/[,•;]/).map((b) => b.trim())
              : [];

            return (
              <div
                key={i}
                className="group p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                           bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 
                           dark:from-slate-900 dark:via-blue-900/10 dark:to-indigo-900/10
                           hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 
                           transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-7 h-7 rounded-lg 
                                     bg-gradient-to-br from-blue-100 to-indigo-100 
                                     dark:from-blue-900/40 dark:to-indigo-900/40 
                                     border border-blue-200 dark:border-blue-700
                                     text-blue-700 dark:text-blue-300 text-sm font-bold">
                        {i + 1}
                      </span>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-tight">
                        {opt.program_name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 ml-9">
                      <span className="font-semibold">Faculty:</span>{" "}
                      <span className="text-slate-700 dark:text-slate-300">
                        {opt.faculty || "—"}
                      </span>
                    </p>
                  </div>

                  {/* Overlap Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 text-xs font-bold rounded-lg 
                                   bg-gradient-to-r from-blue-50 to-indigo-50 
                                   dark:from-blue-900/30 dark:to-indigo-900/30
                                   border border-blue-200 dark:border-blue-700
                                   text-blue-700 dark:text-blue-300 shadow-sm">
                      {overlap.toFixed(0)}% Course Overlap
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 via-sky-500 to-indigo-500 
                               dark:from-blue-500 dark:via-sky-600 dark:to-indigo-600 
                               transition-all duration-700 ease-out relative overflow-hidden"
                      style={{ width: `${overlap}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                    animate-shimmer" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {overlap >= 90 ? "Excellent match" : overlap >= 70 ? "Strong match" : "Good match"} - 
                    Most of your courses transfer directly
                  </p>
                </div>

                {/* Reason */}
                {opt.reason && (
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                    {opt.reason}
                  </p>
                )}

                {/* Key Benefits */}
                {benefits.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                      Key Benefits:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {benefits.map(
                        (b, j) =>
                          b && (
                            <span
                              key={j}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                       bg-gradient-to-r from-indigo-50 to-blue-50 
                                       dark:from-indigo-900/30 dark:to-blue-900/30
                                       border border-indigo-200 dark:border-indigo-700
                                       text-indigo-700 dark:text-indigo-300
                                       shadow-sm hover:shadow-md hover:-translate-y-0.5
                                       transition-all duration-200"
                            >
                              {b}
                            </span>
                          )
                      )}
                    </div>
                  </div>
                )}

                {/* Shared Courses */}
                {Array.isArray(opt.shared_courses) && opt.shared_courses.length > 0 && (
                  <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 
                                dark:from-slate-800/40 dark:to-slate-800/60 
                                rounded-lg border border-slate-200/60 dark:border-slate-700/60 mb-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Shared Courses ({opt.shared_courses.length}):
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                      {opt.shared_courses.join(" • ")}
                    </p>
                  </div>
                )}

                {/* View Details Button */}
                <div className="flex justify-end pt-4 border-t border-slate-200/40 dark:border-slate-700/40">
                  {degreeLinks[opt.program_name] ? (
                    <Link
                      to={`/degrees/${degreeLinks[opt.program_name]}`}
                      className="group/btn inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                                text-sm font-bold text-white
                                bg-gradient-to-r from-blue-500 via-sky-500 to-indigo-500
                                hover:from-blue-600 hover:via-sky-600 hover:to-indigo-600
                                shadow-lg hover:shadow-xl hover:-translate-y-0.5
                                transition-all duration-200"
                    >
                      View Full Details
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <span className="text-sm italic text-slate-400 flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-slate-300 border-t-blue-500 rounded-full" />
                      Loading...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========== LOADING STATE ========== */}
      {!hasNewData && (
        <div className="mb-8">
          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 mb-4 p-4 
                        bg-gradient-to-r from-blue-50/50 to-indigo-50/50 
                        dark:from-blue-900/10 dark:to-indigo-900/10 
                        rounded-xl border border-blue-200/40 dark:border-blue-800/40">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-medium">
              Generating personalized flexibility recommendations...
            </span>
          </div>
          <LoadingShimmer />
        </div>
      )}

      {/* ========== SIMULATOR LINK ========== */}
      <div className="pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 
                      dark:from-indigo-900/10 dark:to-purple-900/10 
                      rounded-xl border border-indigo-200/60 dark:border-indigo-700/60">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                Explore More Options
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Use our interactive simulator to compare majors, calculate credit transfers, and plan your optimal switching pathway.
              </p>
              <Link
                to={simulatorLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl 
                         text-sm font-bold text-white
                         bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500
                         hover:from-indigo-600 hover:via-purple-600 hover:to-violet-600
                         shadow-lg hover:shadow-xl hover:-translate-y-0.5
                         transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                Open Switching Simulator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add shimmer animation to your global CSS or tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer { animation: shimmer 2s infinite; }