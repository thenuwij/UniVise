import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  TrendingUp,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Target,
} from "lucide-react";

export default function ComparisonResults({ 
    comparisonData, 
    onReselect,
    baseSelectedSpecs = [],
    targetSelectedSpecs = [],
    baseSpecsOptions = [],
    targetSpecsOptions = []
  }) {
  const [expandedLevels, setExpandedLevels] = useState({ "1": true });

  if (!comparisonData) return null;

  // Get spec names from codes
  const baseSpecNames = baseSpecsOptions
    .filter(s => baseSelectedSpecs.includes(s.major_code))
    .map(s => s.major_name);
  
  const targetSpecNames = targetSpecsOptions
    .filter(s => targetSelectedSpecs.includes(s.major_code))
    .map(s => s.major_name);

  const {
    can_transfer,
    recommendation,
    summary,
    transfer_analysis,
    requirements_by_level,
    critical_issues,
    detailed_breakdown
  } = comparisonData;

  // Recommendation styling
  const getRecommendationStyle = () => {
    const styles = {
      "Easy Transfer": {
        color: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50",
        border: "border-emerald-300 dark:border-emerald-700",
        icon: CheckCircle2,
        iconColor: "text-emerald-600 dark:text-emerald-400"
      },
      "Moderate Effort": {
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50",
        border: "border-blue-300 dark:border-blue-700",
        icon: Target,
        iconColor: "text-blue-600 dark:text-blue-400"
      },
      "Significant Commitment": {
        color: "text-amber-700 dark:text-amber-300",
        bg: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50",
        border: "border-amber-300 dark:border-amber-700",
        icon: AlertTriangle,
        iconColor: "text-amber-600 dark:text-amber-400"
      },
      "Very Difficult": {
        color: "text-red-700 dark:text-red-300",
        bg: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50",
        border: "border-red-300 dark:border-red-700",
        icon: AlertCircle,
        iconColor: "text-red-600 dark:text-red-400"
      }
    };
    return styles[recommendation] || styles["Moderate Effort"];
  };

  const style = getRecommendationStyle();
  const RecommendationIcon = style.icon;

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ===== HEADER SECTION ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Program Path */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Current Program
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {detailed_breakdown.base_program.name}
                </div>
                {baseSpecNames.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {baseSpecNames.join(" • ")}
                  </div>
                )}
              </div>
              
              <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Target Program
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {detailed_breakdown.target_program.name}
                </div>
                {targetSpecNames.length > 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {targetSpecNames.join(" • ")}
                  </div>
                )}
              </div>
            </div>

            {/* Reselect Button */}
            {onReselect && (
              <button
                onClick={onReselect}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg 
                  bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                  transition-all duration-200 shadow-sm hover:shadow-md flex-shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                Change Program
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== ASSESSMENT CARD ===== */}
      <div className={`${style.bg} rounded-xl border-2 ${style.border} shadow-sm overflow-hidden`}>
        <div className="p-8">
          <div className="flex items-start justify-between gap-6">
            {/* Left: Assessment */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <RecommendationIcon className={`w-7 h-7 ${style.iconColor}`} />
                <h1 className={`text-2xl font-bold ${style.color}`}>
                  {recommendation}
                </h1>
              </div>
              
              <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                Based on your academic progress, {summary.courses_transfer} of your completed courses 
                ({summary.uoc_transfer} UOC) will transfer to your target program. You will need to complete 
                an additional {summary.courses_needed} courses totaling {summary.uoc_needed} UOC.
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transfer Rate</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {transfer_analysis.transfer_rate}%
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Progress</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.progress_percentage}%
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">UOC Remaining</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {summary.uoc_needed}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="text-center bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50 min-w-[180px]">
              <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {summary.estimated_terms}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Terms Remaining
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">Estimated Completion</div>
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1">
                  {summary.estimated_completion}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
              <span>Degree Completion Progress</span>
              <span>{summary.progress_percentage}%</span>
            </div>
            <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-500 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${summary.progress_percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== CRITICAL ISSUES ===== */}
      {critical_issues && critical_issues.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Important Considerations
              </h2>
            </div>
            <div className="space-y-3">
              {critical_issues.map((issue, idx) => {
                const isHigh = issue.severity === "high";
                return (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      isHigh 
                        ? "bg-red-50/50 dark:bg-red-950/20 border-red-500 dark:border-red-600" 
                        : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500 dark:border-amber-600"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        isHigh ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {issue.message}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5">
                          {issue.impact}
                        </p>
                        {issue.affected_courses.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {issue.affected_courses.slice(0, 5).map(code => (
                              <span 
                                key={code}
                                className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-xs font-mono border border-gray-300 dark:border-gray-600"
                              >
                                {code}
                              </span>
                            ))}
                            {issue.affected_courses.length > 5 && (
                              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                                +{issue.affected_courses.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== TRANSFER ANALYSIS ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Credit Transfer Analysis
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transferred Courses */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Transferring Courses
                </h3>
                <span className="ml-auto text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                  {transfer_analysis.transferred_courses.length} courses
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {transfer_analysis.transferred_courses.map((course) => (
                  <div
                    key={course.code}
                    className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {course.code}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {course.uoc} UOC
                        </p>
                      </div>
                      {course.match_type === "equivalent" && (
                        <span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          EQUIVALENT
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-transferring Courses */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <XCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Non-Transferring Courses
                </h3>
                <span className="ml-auto text-xs font-medium text-gray-700 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {transfer_analysis.wasted_courses.length} courses
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {transfer_analysis.wasted_courses.length > 0 ? (
                  transfer_analysis.wasted_courses.map((course) => (
                    <div
                      key={course.code}
                      className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {course.code}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {course.uoc} UOC
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <GraduationCap className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mb-2" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      All courses transfer!
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your completed coursework fully applies
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== REQUIRED COURSES ===== */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Outstanding Course Requirements
              </h2>
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {summary.courses_needed} courses • {summary.uoc_needed} UOC
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(requirements_by_level).map(([levelKey, levelGroup]) => {
              const isExpanded = expandedLevels[levelKey];
              
              return (
                <div key={levelKey} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Level Header */}
                  <button
                    onClick={() => toggleLevel(levelKey)}
                    className="w-full px-5 py-4 bg-gray-50/80 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1 h-10 rounded-full ${
                        levelGroup.has_prerequisite_issues 
                          ? "bg-gradient-to-b from-amber-400 to-amber-600" 
                          : "bg-gradient-to-b from-blue-400 to-blue-600"
                      }`} />
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                          {levelGroup.level_name}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {levelGroup.total_courses} courses • {levelGroup.total_uoc} UOC
                          {levelGroup.has_prerequisite_issues && (
                            <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                              ⚠ Prerequisites required
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      )}
                    </div>
                  </button>

                  {/* Course Grid */}
                  {isExpanded && (
                    <div className="p-5 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {levelGroup.courses.map((course) => (
                        <div
                          key={course.code}
                          className={`p-4 rounded-lg border transition-all duration-200 ${
                            course.has_prereq_issue
                              ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800 hover:shadow-md hover:border-amber-400 dark:hover:border-amber-700"
                              : "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                {course.code}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                                {course.name}
                              </p>
                            </div>
                            {course.has_prereq_issue && (
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {course.uoc} UOC
                            </span>
                            {course.category && (
                              <span className="text-[10px] text-gray-500 dark:text-gray-500 truncate">
                                • {course.category}
                              </span>
                            )}
                          </div>

                          {course.missing_prerequisites && course.missing_prerequisites.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/50">
                              <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400 mb-1">
                                {course.prereq_type === 'or' || course.prereq_type === 'mixed' 
                                  ? 'Requires ONE of:' 
                                  : 'Prerequisites:'}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {course.missing_prerequisites.map((prereq, idx) => (
                                  <React.Fragment key={prereq}>
                                    <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                                      {prereq}
                                    </span>
                                    {idx < course.missing_prerequisites.length - 1 && 
                                     (course.prereq_type === 'or' || course.prereq_type === 'mixed') && (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">OR</span>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {Object.keys(requirements_by_level).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GraduationCap className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mb-3" />
                <p className="text-base font-medium text-emerald-700 dark:text-emerald-400">
                  No additional courses required
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  You've completed all requirements for this program
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}