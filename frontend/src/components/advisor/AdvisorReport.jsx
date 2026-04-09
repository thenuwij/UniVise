// src/components/advisor/AdvisorReport.jsx
// Eunice — AI Academic Advisor Experience

import { useState } from "react";
import {
  HiCheckCircle,
  HiXCircle,
  HiChevronDown,
  HiArrowRight,
  HiLightBulb,
  HiCollection,
  HiInformationCircle,
} from "react-icons/hi";

export default function AdvisorReport({ comparisonData, aiReport }) {
  const [showCourseDetails, setShowCourseDetails] = useState(false);

  if (!comparisonData || !aiReport) return null;

  // ─── Extract & normalise data ──────────────────────────────────
  let transfer = comparisonData.transfer_analysis || {};
  if (typeof transfer === "string") {
    try { transfer = JSON.parse(transfer); } catch { transfer = {}; }
  }

  let summary = comparisonData.summary || {};
  if (typeof summary === "string") {
    try { summary = JSON.parse(summary); } catch { summary = {}; }
  }

  const transferredCourses = Array.isArray(transfer.transferred_courses)
    ? transfer.transferred_courses : [];
  const wastedCourses = Array.isArray(transfer.non_transferable_courses)
    ? transfer.non_transferable_courses : [];

  // Extract remaining courses from requirements_by_level
  const remainingCourses = (() => {
    const reqs = comparisonData.requirements_by_level || {};
    const all = [];
    Object.values(reqs).forEach((group) => {
      if (Array.isArray(group?.courses)) {
        group.courses.forEach((c) => {
          const code = typeof c === "string" ? c : c.code || c.course_code || "";
          if (code) all.push(code);
        });
      }
    });
    return all;
  })();

  const totalCompleted = transferredCourses.length + wastedCourses.length;
  const transferPct = totalCompleted > 0
    ? Math.round((transferredCourses.length / totalCompleted) * 100) : 0;

  const additionalTerms = aiReport.additional_terms ?? summary.estimated_terms ?? 0;
  const estimatedCompletion = aiReport.estimated_completion || summary.estimated_completion || "";

  // ─── Verdict styling ───────────────────────────────────────────
  // All non-semantic UI elements (stats, observations, action steps,
  // course breakdown toggle, remaining courses) share the verdict accent.
  // Pros/cons stay green/red — those have fixed semantic meaning.
  const verdictConfig = {
    recommended: {
      // header
      gradient: "from-emerald-500 to-green-600",
      // summary banner
      light: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      // stats cards
      statsBg: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
      statsBorder: "border border-emerald-200 dark:border-emerald-800",
      statsValue: "text-emerald-600 dark:text-emerald-400",
      // section icon backgrounds
      iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
      // chevron toggle circle
      chevronBg: "bg-emerald-100 dark:bg-emerald-900/50",
      chevronIcon: "text-emerald-600 dark:text-emerald-400",
      // observation card left border
      insightBorder: "border-emerald-400",
      // action step cards
      stepBg: "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30",
      stepBorder: "border border-emerald-200 dark:border-emerald-800",
      stepBadge: "bg-gradient-to-br from-emerald-500 to-green-600",
      // remaining courses tags
      remainingTag: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
      remainingDot: "bg-emerald-500",
      remainingLabel: "text-emerald-700 dark:text-emerald-400",
    },
    conditional: {
      gradient: "from-amber-500 to-orange-600",
      light: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      statsBg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      statsBorder: "border border-amber-200 dark:border-amber-800",
      statsValue: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      chevronBg: "bg-amber-100 dark:bg-amber-900/50",
      chevronIcon: "text-amber-600 dark:text-amber-400",
      insightBorder: "border-amber-400",
      stepBg: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
      stepBorder: "border border-amber-200 dark:border-amber-800",
      stepBadge: "bg-gradient-to-br from-amber-500 to-orange-600",
      remainingTag: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
      remainingDot: "bg-amber-500",
      remainingLabel: "text-amber-700 dark:text-amber-400",
    },
    not_recommended: {
      gradient: "from-red-500 to-rose-600",
      light: "bg-red-50 dark:bg-red-950/40",
      text: "text-red-700 dark:text-red-300",
      statsBg: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
      statsBorder: "border border-red-200 dark:border-red-800",
      statsValue: "text-red-600 dark:text-red-400",
      iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
      chevronBg: "bg-red-100 dark:bg-red-900/50",
      chevronIcon: "text-red-600 dark:text-red-400",
      insightBorder: "border-red-400",
      stepBg: "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30",
      stepBorder: "border border-red-200 dark:border-red-800",
      stepBadge: "bg-gradient-to-br from-red-500 to-rose-600",
      remainingTag: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
      remainingDot: "bg-red-400",
      remainingLabel: "text-red-700 dark:text-red-400",
    },
  };
  const v = verdictConfig[aiReport.verdict] || verdictConfig.conditional;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">

        {/* ═══ HEADER WITH VERDICT ═══════════════════════════════════ */}
        <div className={`bg-gradient-to-r ${v.gradient} px-10 py-8`}>
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-3xl font-bold">E</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border-2 border-current" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-white">Eunice</h1>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium text-white">
                  Academic Advisor
                </span>
              </div>
              <p className="text-white/90 text-lg font-semibold">{aiReport.verdict_label}</p>
            </div>
          </div>
        </div>

        {/* ═══ BODY ══════════════════════════════════════════════════ */}
        <div className="p-10 space-y-10">

          {/* Scope note */}
          <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <HiInformationCircle className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This analysis is based on your target program's published plan and known transfer rules. Completed courses that could count as free electives or open electives in the target program may not be fully reflected here. Credit recognition for electives is assessed case-by-case by UNSW and is not captured in this overview.
            </p>
          </div>

          {/* Summary Message */}
          <div className={`${v.light} rounded-2xl p-6 border-l-4 border-current ${v.text}`}>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              {aiReport.summary}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: `${transferPct}%`, label: "Courses Transfer" },
              { value: additionalTerms > 0 ? `+${additionalTerms}` : "0", label: "Extra Terms" },
              { value: estimatedCompletion || "—", label: "Completion" },
            ].map(({ value, label }) => (
              <div key={label} className={`${v.statsBg} ${v.statsBorder} rounded-2xl p-6 text-center`}>
                <p className={`text-4xl font-bold ${v.statsValue}`}>{value}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium">{label}</p>
              </div>
            ))}
          </div>

          {/* Key Insights */}
          {aiReport.key_insights?.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl ${v.iconBg} flex items-center justify-center`}>
                  <HiLightBulb className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Key Observations</h2>
              </div>
              <div className="grid gap-4">
                {aiReport.key_insights.slice(0, 3).map((insight, idx) => (
                  <div
                    key={idx}
                    className={`bg-slate-50 dark:bg-slate-800/50 rounded-xl px-5 py-4 border-l-4 ${v.insightBorder}`}
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pros & Cons — fixed semantic green/red */}
          {(aiReport.pros?.length > 0 || aiReport.cons?.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiReport.pros?.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-5">
                    <HiCheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-base font-bold text-emerald-700 dark:text-emerald-400">Reasons to Switch</h3>
                  </div>
                  <ul className="space-y-3">
                    {aiReport.pros.slice(0, 3).map((pro, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {aiReport.cons?.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-5">
                    <HiXCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <h3 className="text-base font-bold text-red-700 dark:text-red-400">Things to Consider</h3>
                  </div>
                  <ul className="space-y-3">
                    {aiReport.cons.slice(0, 3).map((con, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Course Breakdown */}
          {(transferredCourses.length > 0 || wastedCourses.length > 0 || remainingCourses.length > 0) && (
            <div className="rounded-2xl overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-sm">
              <button
                onClick={() => setShowCourseDetails(!showCourseDetails)}
                className="w-full bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 hover:from-sky-100 hover:via-blue-100 hover:to-indigo-100 dark:hover:from-sky-900/40 dark:hover:via-blue-900/40 dark:hover:to-indigo-900/40 transition-all px-6 py-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <HiCollection className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-bold text-blue-900 dark:text-blue-100">Course Breakdown</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {transferredCourses.length} transfer · {wastedCourses.length} won't transfer · {remainingCourses.length} remaining
                        <span className="ml-2 text-blue-400 dark:text-blue-500">— tap to expand</span>
                      </p>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center transition-transform ${showCourseDetails ? "rotate-180" : ""}`}>
                    <HiChevronDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </button>

              {showCourseDetails && (
                <div className="p-6 space-y-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                  {/* Transferred — always green (semantic) */}
                  {transferredCourses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          Courses That Transfer ({transferredCourses.length})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {transferredCourses.map((course, idx) => {
                          const code = typeof course === "string" ? course : course.code || course.course_code || "";
                          return (
                            <span
                              key={code || idx}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            >
                              {code}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Non-transferable — always red (semantic) */}
                  {wastedCourses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">
                          Courses That Won't Transfer ({wastedCourses.length})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {wastedCourses.map((course, idx) => {
                          const code = typeof course === "string" ? course : course.code || course.course_code || "";
                          return (
                            <span
                              key={code || idx}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                            >
                              {code}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Remaining — fixed blue */}
                  {remainingCourses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                          Remaining Courses to Complete ({remainingCourses.length})
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {remainingCourses.map((code, idx) => (
                          <span key={code || idx} className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Steps — fixed blue */}
          {aiReport.action_steps?.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                  <HiArrowRight className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Recommendations</h2>
              </div>
              <div className="space-y-4">
                {aiReport.action_steps.slice(0, 3).map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-5"
                  >
                    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ═══ FOOTER ════════════════════════════════════════════════ */}
        <div className="px-10 py-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            This analysis is for guidance only. Please consult with a UNSW academic advisor before making any changes.
          </p>
        </div>

      </div>
    </div>
  );
}
