// src/components/roadmap/ProgramFlexibility.jsx
import RoadmapCard from "./RoadmapCard";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { Info, RefreshCw, TrendingUp, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

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
      
    {/* ---------- HEADER ---------- */}
    <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                    px-8 py-6 -mx-8 -mt-8 mb-6 border-b-2 border-slate-200 dark:border-slate-700
                    rounded-t-2xl">
      
      {/* Very subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
      
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
          <RefreshCw className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Program Flexibility
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Easiest degree switch options and related programs to consider
          </p>
        </div>
      </div>
    </div>

    <div className="mt-6 mb-8 p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 
                    dark:from-blue-900/20 dark:to-indigo-900/20 
                    border border-blue-200/60 dark:border-blue-800/60 flex items-start gap-3">
      {/* Info icon with circular background */}
      <div className="flex items-center justify-center w-6 h-6 rounded-full 
                  bg-blue-100 dark:bg-blue-900/40 shrink-0 mt-0.5">
          <Info className="h-4 w-4 text-blue-700 dark:text-blue-400" />
      </div>


      {/* Info text */}
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        The programs listed below show the most compatible or easiest degrees to switch into, 
        based on how many courses overlap with your current program’s core structure. 
        This comparison excludes specialisations such as majors, minors, or honours streams. 
        For a deeper analysis that includes these specialisations, visit the 
        <span className="font-semibold text-blue-700 dark:text-blue-400"> My Planner </span> 
        section of the website.
      </p>
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
                className="relative p-6 rounded-2xl border border-slate-300 dark:border-slate-600
                          bg-gradient-to-br from-white via-slate-50/70 to-gray-100/70
                          dark:from-slate-900 dark:via-slate-850 dark:to-slate-800
                          shadow-[0_4px_16px_rgba(0,0,0,0.05)]
                          transition-all duration-200"
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
                                        shadow-sm"
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

      {/* ========== LOADING/NO DATA STATE ========== */}
      {!hasNewData && (
        <div className="mb-8">
          <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 
                        dark:from-slate-800/50 dark:to-slate-800/30 
                        border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-start gap-3 mb-3">
              <Info className="h-5 w-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Flexibility Information Unavailable
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Detailed degree switching recommendations are not available for this program. 
                  This typically occurs when the program structure doesn't include specific course 
                  listings in our database. For more information about switching programs, visit the 
                  <span className="font-semibold text-blue-600 dark:text-blue-400"> My Planner </span> 
                  section or contact UNSW Student Central.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add shimmer animation to your global CSS or tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer { animation: shimmer 2s infinite; }