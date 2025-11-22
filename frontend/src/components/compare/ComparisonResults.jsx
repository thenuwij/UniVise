import React from "react";
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Award,
  Info,
} from "lucide-react";

export default function ComparisonResults({ comparisonData, setStep }) {
  if (!comparisonData) return null;

  const {
    base_program,
    target_program,
    courses_that_transfer,
    courses_that_dont_transfer,
    courses_needed,
    uoc_transferred,
    uoc_needed,
    transfer_percentage,
    total_new_courses_required,
    prerequisite_issues,
    compatibility_score,
    estimated_additional_terms,
    progress_towards_target,
    switch_difficulty_score,
    difficulty_label,
  } = comparisonData;

  return (
    <div className="max-w-7xl mx-auto">

      {/* Compact Header */}
      <div className="mb-6">
        <button
          onClick={() => setStep(2)}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-3 text-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Adjust programs or specialisations
        </button>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Program Comparison Results
            </h1>
            <div className="mt-2 flex items-center text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{base_program.name}</span>
              <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
              <span className="font-medium">{target_program.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards with Explanations - 3x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        
        {/* Compatibility */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-blue-600" />
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Compatibility
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {compatibility_score}%
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Higher means more of your existing study carries across.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Progress in Target Degree
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {progress_towards_target}%
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Based on UOC counted towards {target_program.name}.
          </p>
        </div>

        {/* Remaining Workload */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Remaining Workload
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {uoc_needed}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            UOC remaining (0-UOC requirements not counted).
          </p>
        </div>

        {/* Difficulty */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Switch Difficulty
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {switch_difficulty_score}
            <span className="text-base font-normal ml-1">({difficulty_label})</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Higher = more prereq gaps or advanced requirements.
          </p>
        </div>

        {/* Time Estimate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Time Estimate
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {estimated_additional_terms}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            additional term{estimated_additional_terms !== 1 ? "s" : ""} at ~18 UOC/term.
          </p>
        </div>

        {/* Transfer Efficiency */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
            Transfer Efficiency
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {transfer_percentage}%
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Percentage of completed courses that can be counted.
          </p>
        </div>
      </div>

      {/* Course Transfer - COMPACT 2-COLUMN GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          Course Transfer Analysis
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Courses that transfer - COMPACT */}
          <div>
            <div className="flex items-center mb-2">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Courses That Transfer ({courses_that_transfer.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-1">
              {courses_that_transfer.map((c) => (
                <div
                  key={c.course_code}
                  className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-xs">
                        {c.course_code}
                      </div>
                      <div className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-1">
                        {c.course_name}
                      </div>
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                        {c.uoc} UOC
                      </div>
                    </div>
                    {c.match_type && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-green-300 dark:border-green-700 text-[9px] uppercase text-green-700 dark:text-green-400 flex-shrink-0">
                        {c.match_type === "exact" ? "Exact" : "Equiv"}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {courses_that_transfer.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-4">
                  None of your courses transfer.
                </p>
              )}
            </div>
          </div>

          {/* Courses that don't transfer - COMPACT */}
          <div>
            <div className="flex items-center mb-2">
              <XCircle className="w-4 h-4 text-red-600 mr-2" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Courses That Do Not Transfer ({courses_that_dont_transfer.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-80 overflow-y-auto pr-1">
              {courses_that_dont_transfer.map((c) => (
                <div
                  key={c.course_code}
                  className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                >
                  <div className="font-semibold text-gray-900 dark:text-white text-xs">
                    {c.course_code}
                  </div>
                  <div className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-1">
                    {c.course_name}
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5">
                    {c.uoc} UOC
                  </div>
                </div>
              ))}

              {courses_that_dont_transfer.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-4">
                  All courses transfer.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional courses - COMPACT 3-COLUMN GRID */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Additional Courses Needed ({total_new_courses_required})
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Required courses you haven't completed yet
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-80 overflow-y-auto pr-1">
          {courses_needed.map((course) => (
            <div
              key={course.code}
              className="p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="font-semibold text-gray-900 dark:text-white text-xs">
                {course.code}
              </div>
              <div className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-1">
                {course.title}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-gray-600 dark:text-gray-400">
                  {course.uoc} UOC
                </span>
                <span className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 text-[9px] rounded uppercase text-gray-700 dark:text-gray-300 line-clamp-1">
                  {course.category}
                </span>
              </div>
            </div>
          ))}

          {courses_needed.length === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 col-span-full py-4">
              All requirements satisfied.
            </p>
          )}
        </div>
      </div>

      {/* Prerequisite issues - COMPACT 2-COLUMN */}
      {prerequisite_issues.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 p-4 mb-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mr-2" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Prerequisite Issues ({prerequisite_issues.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
            {prerequisite_issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-2 bg-white dark:bg-slate-800 rounded border border-amber-300 dark:border-amber-700"
              >
                <div className="font-medium text-gray-900 dark:text-white text-xs">
                  {issue.course_code}
                </div>
                <div className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-1">
                  {issue.course_name}
                </div>
                <div className="text-[10px] text-amber-800 dark:text-amber-300 mt-1">
                  ⚠ {issue.issue_description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}