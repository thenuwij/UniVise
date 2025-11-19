// src/components/RecommendedDegrees.jsx
import React from "react";
import { HiAcademicCap, HiCheckCircle } from "react-icons/hi";

function RecommendedDegrees({
  userType,
  recommendations,
  loading,
  selectedDegreeId,
  setSelectedDegreeId,
  setSelectedDegreeObject,
}) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 dark:text-slate-300 italic">
          Generating recommendations...
        </p>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 dark:text-slate-400 italic">
          No recommendations available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const isSelected = selectedDegreeId === rec.id;

        return (
          <div
            key={rec.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              setSelectedDegreeId(rec.id);
              const degreeObj = {
                source:
                  userType === "high_school"
                    ? "hs_recommendation"
                    : "uni_recommendation",
                ...rec,
              };
              setSelectedDegreeObject(degreeObj);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setSelectedDegreeId(rec.id);
                setSelectedDegreeObject({
                  source:
                    userType === "high_school"
                      ? "hs_recommendation"
                      : "uni_recommendation",
                  ...rec,
                });
              }
            }}
            className={`relative transition-all duration-300 cursor-pointer rounded-lg p-4 border 
              ${
                isSelected
                  ? "border-sky-500 bg-sky-50 dark:bg-sky-900/40 shadow-md"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700"
              }`}
          >
            {/* Selection Badge */}
            {isSelected && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                <HiCheckCircle className="w-5 h-5" />
                <span>Selected</span>
              </div>
            )}

            {/* Content */}
            <div className="pr-20">
              {/* Header with Icon and Degree Name */}
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-shrink-0 p-1.5 rounded-md bg-sky-100 dark:bg-sky-900/40 mt-0.5">
                  <HiAcademicCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <h3
                  className={`text-base font-bold leading-snug flex-1 ${
                    isSelected
                      ? "text-sky-700 dark:text-sky-300"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {rec.program_name || rec.degree_name}
                </h3>
              </div>

              {/* University */}
              {userType === "high_school" && rec.university_name && (
                <p className="text-sm italic text-slate-500 dark:text-slate-400 mb-2">
                  {rec.university_name}
                </p>
              )}

              {/* Reason */}
              {rec.reason && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {rec.reason}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(RecommendedDegrees);