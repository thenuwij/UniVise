// src/components/RecommendedDegrees.jsx
import React from "react";

function RecommendedDegrees({
  userType,
  recommendations,
  loading,
  selectedDegreeId,
  setSelectedDegreeId,
  setSelectedDegreeObject,
}) {

  console.log("Recommendations received:", recommendations);

  if (loading) {
    return (
      <p className="italic text-secondary">Generating recommendations...</p>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <p className="italic text-secondary">No recommendations available.</p>
    );
  }

  return (
    <section className="w-full mb-12">
      <h2 className="heading-lg mt-12 mb-6 text-primary">Recommended Degrees</h2>
      <div
        className={`grid grid-cols-1 ${
          userType === "high_school"
            ? "md:grid-cols-2"
            : "sm:grid-cols-2 lg:grid-cols-3"
        } gap-8`}
      >
        {recommendations.map((rec) => (
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
              console.log("🎯 Setting selectedDegreeObject to:", degreeObj);
              console.log("🔑 Keys in degreeObj:", Object.keys(degreeObj));
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
            className={`cursor-pointer card-flex transition-transform duration-300 ${
              selectedDegreeId === rec.id
                ? "border-2 border-sky-600 dark:border-sky-400 bg-sky-50 dark:bg-slate-800 scale-[1.02]"
                : "hover:shadow-md hover:scale-[1.01]"
            }`}
          >
            <h3 className="heading-md mb-2 text-brand">{rec.program_name || rec.degree_name}</h3>

            {userType === "high_school" && rec.university_name && (
              <p className="text-sm italic text-secondary">{rec.university_name}</p>
            )}

            {rec.reason && <p className="text-sm text-primary">{rec.reason}</p>}
          </div>
        ))}

      </div>
    </section>
  );
}

export default React.memo(RecommendedDegrees);
