// src/components/advisor/AdvisorReport.jsx
// Step 4 Report — combines comparison data + transfer recommendation
// REDESIGNED for better visibility and user experience

import { useState } from "react";
import {
  HiCheckCircle,
  HiXCircle,
  HiChevronDown,
  HiChevronUp,
  HiExclamationCircle,
  HiArrowRight,
  HiInformationCircle,
  HiAcademicCap,
} from "react-icons/hi";

export default function AdvisorReport({
  comparisonData,
  aiReport,
  currentProgram,
  targetProgram,
  baseSelectedSpecs,
  targetSelectedSpecs,
  baseSpecsOptions,
  targetSpecsOptions,
}) {
  const [expandedSections, setExpandedSections] = useState({
    transferable: true, // EXPANDED BY DEFAULT
    nonTransferable: true, // EXPANDED BY DEFAULT
    remaining: false,
    prerequisites: false,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  if (!comparisonData || !aiReport) return null;

  // ─── Extract & normalise data ──────────────────────────────────
  // Parse transfer_analysis if it's a JSON string
  let transfer = comparisonData.transfer_analysis || {};
  if (typeof transfer === "string") {
    try {
      transfer = JSON.parse(transfer);
    } catch (e) {
      console.error("Failed to parse transfer_analysis:", e);
      transfer = {};
    }
  }

  // Parse detailed_breakdown if it's a JSON string
  let breakdown = comparisonData.detailed_breakdown || {};
  if (typeof breakdown === "string") {
    try {
      breakdown = JSON.parse(breakdown);
    } catch (e) {
      console.error("Failed to parse detailed_breakdown:", e);
      breakdown = {};
    }
  }

  const requirements = Array.isArray(comparisonData.requirements_by_level)
    ? comparisonData.requirements_by_level
    : Object.values(comparisonData.requirements_by_level || {});
  const criticalIssues = Array.isArray(comparisonData.critical_issues)
    ? comparisonData.critical_issues
    : [];

  const transferredCourses = Array.isArray(transfer.transferred_courses)
    ? transfer.transferred_courses
    : [];
  const wastedCourses = Array.isArray(transfer.non_transferable_courses)
    ? transfer.non_transferable_courses
    : [];

  // Flatten remaining courses from requirements
  const allRemainingCourses = requirements.flatMap((lvl) => {
    if (!lvl || typeof lvl !== "object") return [];
    return Array.isArray(lvl.courses) ? lvl.courses : [];
  });
  const prereqIssues = allRemainingCourses.filter(
    (c) => c && typeof c === "object" && c.has_prereq_issue
  );

  // ─── Course-count-based stats (reliable) ───────────────────────
  const totalCompleted = transferredCourses.length + wastedCourses.length;
  const transferPct =
    totalCompleted > 0
      ? Math.round((transferredCourses.length / totalCompleted) * 100)
      : 0;

  // Spec name lookups
  const getSpecNames = (codes, options) =>
    (codes || [])
      .map((c) => (options || []).find((s) => s.major_code === c)?.major_name)
      .filter(Boolean);

  const baseSpecNames = getSpecNames(baseSelectedSpecs, baseSpecsOptions);
  const targetSpecNames = getSpecNames(targetSelectedSpecs, targetSpecsOptions);

  // ─── Verdict styling ───────────────────────────────────────────
  const verdictMap = {
    recommended: {
      border: "border-emerald-500/40",
      accent: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
      dot: "bg-emerald-500",
    },
    conditional: {
      border: "border-amber-500/40",
      accent: "text-amber-600 dark:text-amber-400",
      bg: "bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20",
      dot: "bg-amber-500",
    },
    not_recommended: {
      border: "border-red-500/40",
      accent: "text-red-600 dark:text-red-400",
      bg: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20",
      dot: "bg-red-500",
    },
  };
  const v = verdictMap[aiReport.verdict] || verdictMap.conditional;

  return (
    <div className="space-y-6">
      {/* ── Program Comparison Header ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiAcademicCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Program Comparison
          </h3>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Current Program
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {currentProgram?.name || breakdown.base_program_name || "—"}
            </p>
            {baseSpecNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {baseSpecNames.map((name) => (
                  <span
                    key={name}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <HiArrowRight className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>

          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Target Program
            </p>
            <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {targetProgram?.name || breakdown.target_program_name || "—"}
            </p>
            {targetSpecNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 justify-end">
                {targetSpecNames.map((name) => (
                  <span
                    key={name}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Transfer Analysis ─────────────────────────────────────── */}
      <div className={`rounded-2xl border-2 ${v.border} ${v.bg} shadow-lg p-6`}>
        <div className="flex items-start gap-4">
          <div className={`w-3 h-3 rounded-full ${v.dot} mt-2 flex-shrink-0`} />
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${v.accent} mb-2`}>
              {aiReport.verdict_label}
            </h2>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              {aiReport.summary}
            </p>
          </div>
        </div>
      </div>

      {/* ── Overview Stats (course-count based only) ──────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
          <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
          Transfer Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatItem
            label="Transfer Rate"
            value={`${transferPct}%`}
            detail={`${transferredCourses.length} of ${totalCompleted} courses`}
            color="blue"
          />
          <StatItem
            label="Non-Transferable"
            value={wastedCourses.length}
            detail={
              wastedCourses.length === 0
                ? "None lost"
                : `${wastedCourses.length} course${
                    wastedCourses.length !== 1 ? "s" : ""
                  } won't count`
            }
            color="red"
          />
          <StatItem
            label="Remaining"
            value={allRemainingCourses.length}
            detail="New courses needed"
            color="blue"
          />
          <StatItem
            label="Prereq Issues"
            value={prereqIssues.length}
            detail={prereqIssues.length === 0 ? "All clear" : "Needs attention"}
            color="amber"
          />
        </div>
      </div>

      {/* ── Key Insights ──────────────────────────────────────────── */}
      {aiReport.key_insights?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
            Key Insights
          </h3>
          <div className="space-y-3">
            {aiReport.key_insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pros & Cons ───────────────────────────────────────────── */}
      {(aiReport.pros?.length > 0 || aiReport.cons?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {aiReport.pros?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 shadow-lg p-6">
              <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-4 flex items-center gap-2">
                <HiCheckCircle className="w-6 h-6" />
                Reasons to Switch
              </h3>
              <ul className="space-y-3">
                {aiReport.pros.map((pro, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20"
                  >
                    <HiCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {pro}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {aiReport.cons?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-200 dark:border-red-800 shadow-lg p-6">
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                <HiXCircle className="w-6 h-6" />
                Reasons to Stay
              </h3>
              <ul className="space-y-3">
                {aiReport.cons.map((con, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20"
                  >
                    <HiXCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {con}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Transfer Breakdown ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="px-6 py-5 border-b-2 border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
            Transfer Breakdown
          </h3>
        </div>

        {transferredCourses.length > 0 && (
          <CollapsibleSection
            title={`Transferable Courses (${transferredCourses.length})`}
            expanded={expandedSections.transferable}
            onToggle={() => toggleSection("transferable")}
            variant="success"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {transferredCourses.map((course, idx) => {
                const code =
                  typeof course === "string"
                    ? course
                    : course.code || course.course_code || "";
                const name =
                  typeof course === "string"
                    ? ""
                    : course.name || course.course_name || "";
                return (
                  <div
                    key={code || idx}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                  >
                    <HiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {code}
                      </span>
                      {name && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                          {name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {wastedCourses.length > 0 && (
          <CollapsibleSection
            title={`Non-Transferable Courses (${wastedCourses.length})`}
            expanded={expandedSections.nonTransferable}
            onToggle={() => toggleSection("nonTransferable")}
            variant="error"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {wastedCourses.map((course, idx) => {
                const code =
                  typeof course === "string"
                    ? course
                    : course.code || course.course_code || "";
                const name =
                  typeof course === "string"
                    ? ""
                    : course.name || course.course_name || "";
                return (
                  <div
                    key={code || idx}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                  >
                    <HiXCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-bold text-slate-900 dark:text-white block">
                        {code}
                      </span>
                      {name && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                          {name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {allRemainingCourses.length > 0 && (
          <CollapsibleSection
            title={`Remaining Courses Needed (${allRemainingCourses.length})`}
            expanded={expandedSections.remaining}
            onToggle={() => toggleSection("remaining")}
            variant="info"
          >
            <div className="space-y-4">
              {requirements.map((level, levelIdx) => {
                if (!level || typeof level !== "object") return null;
                const courses = Array.isArray(level.courses) ? level.courses : [];
                if (courses.length === 0) return null;
                return (
                  <div key={level.level || levelIdx}>
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Level {level.level || "?"} — {courses.length} course
                      {courses.length !== 1 ? "s" : ""}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {courses.map((course, cIdx) => {
                        if (typeof course === "string") {
                          return (
                            <div
                              key={course || cIdx}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                            >
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {course}
                              </span>
                            </div>
                          );
                        }
                        const code = course.code || course.course_code || "";
                        const name = course.name || course.course_name || "";
                        return (
                          <div
                            key={code || cIdx}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${
                              course.has_prereq_issue
                                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                                : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {course.has_prereq_issue && (
                              <HiExclamationCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                                {code}
                              </span>
                              {name && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
                                  {name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {prereqIssues.length > 0 && (
          <CollapsibleSection
            title={`Prerequisite Issues (${prereqIssues.length})`}
            expanded={expandedSections.prerequisites}
            onToggle={() => toggleSection("prerequisites")}
            variant="warning"
          >
            <div className="space-y-2">
              {prereqIssues.map((course, idx) => {
                const code =
                  typeof course === "string"
                    ? course
                    : course.code || course.course_code || "";
                const name =
                  typeof course === "string"
                    ? ""
                    : course.name || course.course_name || "";
                const prereqs =
                  typeof course === "string" ? "" : course.prerequisites || "";
                return (
                  <div
                    key={code || idx}
                    className="px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {code}
                      {name ? ` — ${name}` : ""}
                    </p>
                    {prereqs && (
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Requires: {prereqs}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}
      </div>

      {/* ── Critical Blockers ─────────────────────────────────────── */}
      {criticalIssues.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-300 dark:border-red-800 shadow-lg p-6">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
            <HiExclamationCircle className="w-6 h-6" />
            Critical Blockers
          </h3>
          <div className="space-y-3">
            {criticalIssues.map((issue, idx) => {
              const title =
                typeof issue === "string"
                  ? issue
                  : issue.title || issue.type || "Issue";
              const desc = typeof issue === "string" ? "" : issue.description || "";
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                >
                  <HiExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {title}
                    </p>
                    {desc && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recommended Next Steps ────────────────────────────────── */}
      {aiReport.action_steps?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
            Recommended Next Steps
          </h3>
          <div className="space-y-3">
            {aiReport.action_steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Detailed Analysis ─────────────────────────────────────── */}
      {aiReport.detailed_analysis && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
            Detailed Analysis
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {aiReport.detailed_analysis}
            </p>
          </div>
        </div>
      )}

      {/* ── Disclaimer ────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800">
        <HiInformationCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          This analysis is based on course overlap and is for guidance only.
          Transfer eligibility is subject to UNSW program rules and approval.
          Please consult with a UNSW academic advisor before making any program
          changes.
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function StatItem({ label, value, detail, color = "blue" }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    red: "from-red-500 to-red-600",
    amber: "from-amber-500 to-amber-600",
    emerald: "from-emerald-500 to-emerald-600",
  };

  return (
    <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      <p
        className={`text-3xl font-bold bg-gradient-to-br ${
          colorMap[color] || colorMap.blue
        } bg-clip-text text-transparent mb-1`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}

function CollapsibleSection({
  title,
  expanded,
  onToggle,
  children,
  variant = "default",
}) {
  const variantMap = {
    success:
      "bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
    error:
      "bg-red-50/50 dark:bg-red-950/10 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-700 dark:text-red-400",
    warning:
      "bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-400",
    info:
      "bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-700 dark:text-blue-300",
    default:
      "bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300",
  };

  return (
    <div className="border-t-2 border-slate-200 dark:border-slate-700">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${
          variantMap[variant]
        }`}
      >
        <span className="text-sm font-bold">{title}</span>
        {expanded ? (
          <HiChevronUp className="w-5 h-5" />
        ) : (
          <HiChevronDown className="w-5 h-5" />
        )}
      </button>
      {expanded && <div className="px-6 pb-5">{children}</div>}
    </div>
  );
}
