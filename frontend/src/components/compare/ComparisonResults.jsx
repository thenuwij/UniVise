import {
  HiCheckCircle,
  HiXCircle,
  HiExclamationCircle,
  HiClock,
  HiTrendingUp,
  HiAcademicCap,
  HiChevronDown,
  HiChevronUp,
  HiBookOpen,
  HiSparkles,
  HiInformationCircle,
} from "react-icons/hi";
import React, { useState } from "react";

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
      "Not Yet Started": {
        color: "text-slate-700 dark:text-slate-300",
        bg: "bg-gradient-to-br from-slate-50/40 to-slate-100/40 dark:from-slate-900/20 dark:to-slate-800/20",
        border: "border-slate-300 dark:border-slate-700",
        icon: HiInformationCircle,
        iconColor: "text-slate-600 dark:text-slate-400"
      },
      "Easy Transfer": {
        color: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-gradient-to-br from-emerald-50/40 to-teal-50/40 dark:from-emerald-900/20 dark:to-teal-900/20",
        border: "border-emerald-300 dark:border-emerald-700",
        icon: HiCheckCircle,
        iconColor: "text-emerald-600 dark:text-emerald-400"
      },
      "Moderate Effort": {
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-gradient-to-br from-blue-50/40 to-indigo-50/40 dark:from-blue-900/20 dark:to-indigo-900/20",
        border: "border-blue-300 dark:border-blue-700",
        icon: HiAcademicCap,
        iconColor: "text-blue-600 dark:text-blue-400"
      },
      "Significant Commitment": {
        color: "text-amber-700 dark:text-amber-300",
        bg: "bg-gradient-to-br from-amber-50/40 to-orange-50/40 dark:from-amber-900/20 dark:to-orange-900/20",
        border: "border-amber-300 dark:border-amber-700",
        icon: HiExclamationCircle,
        iconColor: "text-amber-600 dark:text-amber-400"
      },
      "Very Difficult": {
        color: "text-red-700 dark:text-red-300",
        bg: "bg-gradient-to-br from-red-50/40 to-rose-50/40 dark:from-red-900/20 dark:to-rose-900/20",
        border: "border-red-300 dark:border-red-700",
        icon: HiXCircle,
        iconColor: "text-red-600 dark:text-red-400"
      }
    };
    return styles[recommendation] || styles["Moderate Effort"];
  };

  const style = getRecommendationStyle();
  const RecommendationIcon = style.icon;

  // Get appropriate help text based on recommendation
  const getHelpText = () => {
    if (recommendation === "Not Yet Started") {
      return "You haven't marked any courses as completed yet. Complete some courses in your Progress Page to see how they would transfer to this program.";
    }
    return "This shows how feasible it is to switch programs based on your completed courses and remaining requirements.";
  };

  const toggleLevel = (level) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  return (
    <div className="space-y-6">

      {/* PROGRAM PATH HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Program Path */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Current Program
              </div>
              <div className="font-bold text-slate-900 dark:text-white">
                {detailed_breakdown.base_program.name}
              </div>
              {baseSpecNames.length > 0 && (
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {baseSpecNames.join(" • ")}
                </div>
              )}
            </div>
            
            <HiSparkles className="w-5 h-5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Target Program
              </div>
              <div className="font-bold text-slate-900 dark:text-white">
                {detailed_breakdown.target_program.name}
              </div>
              {targetSpecNames.length > 0 && (
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {targetSpecNames.join(" • ")}
                </div>
              )}
            </div>
          </div>

          {/* Reselect Button */}
          {onReselect && (
            <button
              onClick={onReselect}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-sky-600 text-white text-sm font-bold hover:from-blue-700 hover:to-sky-700 transition-all shadow-md hover:shadow-lg"
            >
              <HiSparkles className="w-4 h-4" />
              Change Program
            </button>
          )}
        </div>
      </div>

      {/* ASSESSMENT CARD */}
      <div className={`${style.bg} rounded-xl border-2 ${style.border} shadow-sm overflow-hidden`}>
        <div className="p-6">
          
          {/* Main heading with icon */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <RecommendationIcon className={`w-8 h-8 ${style.iconColor}`} />
              <h1 className={`text-3xl font-bold ${style.color}`}>
                {recommendation}
              </h1>
            </div>
            
            {/* Help box - integrated smoothly */}
            <div className="flex items-start gap-3 p-4 bg-white/60 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
              <HiInformationCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {getHelpText()}
              </p>
            </div>
          </div>

          {recommendation !== "Not Yet Started" && (
            <>
              <div className="flex items-start justify-between gap-6 flex-wrap lg:flex-nowrap">
                {/* Left: Assessment */}
                <div className="flex-1">
                  <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed mb-6 font-medium">
                    Based on your academic progress, <span className="font-bold text-lg">{summary.courses_transfer} courses</span> 
                    ({summary.uoc_transfer} UOC) will transfer to your target program. You will need to complete 
                    an additional <span className="font-bold text-lg">{summary.courses_needed} courses</span> totaling <span className="font-bold text-lg">{summary.uoc_needed} UOC</span>.
                  </p>

                  {/* Stats Grid - MUCH LARGER */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-5 border-2 border-slate-200 dark:border-slate-700 shadow-md">
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-bold uppercase tracking-wider">Course Transfer Rate</div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                        {transfer_analysis.transfer_rate}%
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold">of completed courses</div>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-5 border-2 border-slate-200 dark:border-slate-700 shadow-md">
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-bold uppercase tracking-wider">Target Program Progress</div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                        {summary.progress_percentage}%
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold">towards completion</div>
                    </div>
                    <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl p-5 border-2 border-slate-200 dark:border-slate-700 shadow-md">
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-bold uppercase tracking-wider">UOC Remaining</div>
                      <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                        {summary.uoc_needed}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 font-semibold">units left to complete</div>
                    </div>
                  </div>
                </div>

                {/* Right: Timeline - ENHANCED */}
                <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border-2 border-slate-300 dark:border-slate-600 min-w-[220px] shadow-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <HiClock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Timeline
                    </h3>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="text-5xl font-bold text-slate-900 dark:text-white mb-2">
                      {summary.estimated_terms}
                    </div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Terms Remaining
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-bold uppercase tracking-wide text-center">
                      Estimated Completion
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 text-center">
                      {summary.estimated_completion}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  <span>Degree Completion Progress</span>
                  <span>{summary.progress_percentage}%</span>
                </div>
                <div className="h-3 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden backdrop-blur-sm border border-slate-300 dark:border-slate-600">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-emerald-500 transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${summary.progress_percentage}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {recommendation === "Not Yet Started" && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <HiAcademicCap className="w-16 h-16 text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                Ready to Start Your Journey
              </p>
              <p className="text-base text-slate-600 dark:text-slate-400 max-w-md">
                You'll need to complete <span className="font-bold">{summary.courses_needed} courses</span> ({summary.uoc_needed} UOC) for this program. 
                Mark courses as completed in your Progress Page to see your transfer analysis.
              </p>
            </div>
          )}
        </div>
      </div>



      {/* TRANSFER ANALYSIS */}
      {recommendation !== "Not Yet Started" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-6">
          
          {/* Main heading with integrated help */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <HiTrendingUp className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Credit Transfer Analysis
              </h2>
            </div>
            
            {/* Help box - integrated smoothly */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <HiInformationCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Shows which completed courses will count toward your target program and which won't transfer.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Transferred Courses */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                <HiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Transferring Courses
                </h3>
                <span className="ml-auto text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                  {transfer_analysis.transferred_courses.length} courses
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {transfer_analysis.transferred_courses.map((course) => (
                  <div
                    key={course.code}
                    className="p-3 bg-emerald-50/40 dark:bg-emerald-950/10 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {course.code}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                          {course.uoc} UOC
                        </p>
                      </div>
                      {course.match_type === "equivalent" && (
                        <span className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
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
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                <HiXCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Non-Transferring Courses
                </h3>
                <span className="ml-auto text-xs font-bold text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  {transfer_analysis.wasted_courses.length} courses
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                {transfer_analysis.wasted_courses.length > 0 ? (
                  transfer_analysis.wasted_courses.map((course) => (
                    <div
                      key={course.code}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {course.code}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                        {course.uoc} UOC
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <HiAcademicCap className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mb-2" />
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      All courses transfer!
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Your completed coursework fully applies
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUIRED COURSES */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-6">
        
        {/* Main heading with integrated help */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HiBookOpen className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Outstanding Course Requirements
              </h2>
            </div>
            <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {summary.courses_needed} courses • {summary.uoc_needed} UOC
            </div>
          </div>
          
          {/* Help box - integrated smoothly */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <HiInformationCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Courses you still need to complete for your target program, organized by year level. Click each level to expand and see course details.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(requirements_by_level).map(([levelKey, levelGroup]) => {
            const isExpanded = expandedLevels[levelKey];
            
            return (
              <div key={levelKey} className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
                {/* Level Header */}
                <button
                  onClick={() => toggleLevel(levelKey)}
                  className="w-full px-5 py-4 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-1 h-10 rounded-full ${
                      levelGroup.has_prerequisite_issues 
                        ? "bg-gradient-to-b from-amber-400 to-amber-600" 
                        : "bg-gradient-to-b from-blue-400 to-blue-600"
                    }`} />
                    <div className="text-left">
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {levelGroup.level_name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-semibold">
                        {levelGroup.total_courses} courses • {levelGroup.total_uoc} UOC
                        {levelGroup.has_prerequisite_issues && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400">
                            ⚠ Prerequisites required
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <HiChevronUp className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    ) : (
                      <HiChevronDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    )}
                  </div>
                </button>

                {/* Course Grid */}
                {isExpanded && (
                  <div className="p-5 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {levelGroup.courses.map((course) => (
                      <div
                        key={course.code}
                        className={`p-4 rounded-lg border transition-all duration-200 shadow-sm ${
                          course.has_prereq_issue
                            ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-300 dark:border-amber-800 hover:shadow-md hover:border-amber-400 dark:hover:border-amber-700"
                            : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {course.code}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                              {course.name}
                            </p>
                          </div>
                          {course.has_prereq_issue && (
                            <HiExclamationCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {course.uoc} UOC
                          </span>
                          {course.category && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 truncate">
                              • {course.category}
                            </span>
                          )}
                        </div>

                        {course.missing_prerequisites && course.missing_prerequisites.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/50">
                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mb-1 uppercase tracking-wide">
                              {course.prereq_type === 'or' || course.prereq_type === 'mixed' 
                                ? 'Requires ONE of:' 
                                : 'Prerequisites:'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {course.missing_prerequisites.map((prereq, idx) => (
                                <React.Fragment key={prereq}>
                                  <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-bold">
                                    {prereq}
                                  </span>
                                  {idx < course.missing_prerequisites.length - 1 && 
                                   (course.prereq_type === 'or' || course.prereq_type === 'mixed') && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-500 font-bold">OR</span>
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
              <HiAcademicCap className="w-16 h-16 text-emerald-500 dark:text-emerald-400 mb-3" />
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                No additional courses required
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                You've completed all requirements for this program
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}