// src/components/pathway/SpecialisationCard.jsx
import { Award, BookOpen, GraduationCap } from "lucide-react";

function SpecialisationCard({ data, itemType }) {
  // Determine the type (Honours, Major, Minor)
  const getSpecType = () => {
    if (data.specialisation_type) return data.specialisation_type;
    if (itemType === "major") return "Major";
    if (itemType === "minor") return "Minor";
    return "Specialisation";
  };

  const specType = getSpecType();

  // Color scheme based on type
  const getColorScheme = () => {
    if (specType === "Honours") {
      return {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-700",
        text: "text-amber-700 dark:text-amber-300",
        badge: "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
        icon: "text-amber-600 dark:text-amber-400"
      };
    }
    if (specType === "Major") {
      return {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-700",
        text: "text-blue-700 dark:text-blue-300",
        badge: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
        icon: "text-blue-600 dark:text-blue-400"
      };
    }
    // Minor
    return {
      bg: "bg-purple-50 dark:bg-purple-900/20",
      border: "border-purple-200 dark:border-purple-700",
      text: "text-purple-700 dark:text-purple-300",
      badge: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
      icon: "text-purple-600 dark:text-purple-400"
    };
  };

  const colors = getColorScheme();

  return (
    <div className="space-y-4">
      {/* TYPE BADGE */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${colors.badge} border`}>
          {specType === "Honours" ? (
            <Award className="h-3 w-3" />
          ) : (
            <GraduationCap className="h-3 w-3" />
          )}
          {specType}
        </span>
      </div>

      {/* FACULTY */}
      {data.faculty && (
        <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className={colors.text}>Faculty: </strong>
            {data.faculty}
          </p>
        </div>
      )}

      {/* DETAILS GRID */}
      <div className="space-y-2 text-sm">
        {(data.major_code || data.minor_code || data.honours_code) && (
          <p className="text-slate-700 dark:text-slate-300">
            <strong>Code: </strong>
            {data.major_code || data.minor_code || data.honours_code}
          </p>
        )}

        {data.uoc_required && (
          <p className="text-slate-700 dark:text-slate-300">
            <strong>UOC Required: </strong>
            {data.uoc_required}
          </p>
        )}

        {data.duration && (
          <p className="text-slate-700 dark:text-slate-300">
            <strong>Duration: </strong>
            {data.duration}
          </p>
        )}
      </div>

      {/* DESCRIPTION */}
      {data.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {data.description}
        </p>
      )}

      {/* REQUIREMENTS */}
      {data.requirements && (
        <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className={colors.text}>Requirements: </strong>
            {data.requirements}
          </p>
        </div>
      )}

      {/* CORE COURSES */}
      {data.core_courses && data.core_courses.length > 0 && (
        <div>
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Core Courses
          </p>
          <div className="flex flex-wrap gap-2">
            {data.core_courses.map((course, i) => (
              <span
                key={i}
                className={`px-2.5 py-1 rounded-md ${colors.badge} border text-xs font-semibold`}
              >
                {course}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CAREER PATHWAYS */}
      {data.career_pathways && (
        <div className={`p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700`}>
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong>Career Pathways: </strong>
            {data.career_pathways}
          </p>
        </div>
      )}
    </div>
  );
}

export default SpecialisationCard;