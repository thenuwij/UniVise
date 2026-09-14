// src/components/pathway/SpecialisationCard.jsx
import { Award, BookOpen, GraduationCap } from "lucide-react";

function SpecialisationCard({ data, itemType }) {
  const getSpecType = () => {
    if (data.specialisation_type) return data.specialisation_type;
    if (itemType === "major") return "Major";
    if (itemType === "minor") return "Minor";
    return "Specialisation";
  };

  const specType = getSpecType();

  return (
    <div className="space-y-4">

      {/* Type Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
          {specType === "Honours" ? (
            <Award className="h-3 w-3" />
          ) : (
            <GraduationCap className="h-3 w-3" />
          )}
          {specType}
        </span>
      </div>

      {/* Faculty */}
      {data.faculty && (
        <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-sky-700 dark:text-sky-300">Faculty: </strong>
            {data.faculty}
          </p>
        </div>
      )}

      {/* Details Grid */}
      <div className="space-y-2 text-sm">
        {(data.major_code || data.minor_code || data.honours_code) && (
          <p className="text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Code: </strong>
            {data.major_code || data.minor_code || data.honours_code}
          </p>
        )}

        {data.uoc_required && (
          <p className="text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">UOC Required: </strong>
            {data.uoc_required}
          </p>
        )}

        {data.duration && (
          <p className="text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Duration: </strong>
            {data.duration}
          </p>
        )}
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {data.description}
        </p>
      )}

      {/* Requirements */}
      {data.requirements && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Requirements: </strong>
            {data.requirements}
          </p>
        </div>
      )}

      {/* Core Courses */}
      {data.core_courses && data.core_courses.length > 0 && (
        <div>
          <p className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 tracking-wide">
            <BookOpen className="h-3 w-3" />
            Core Courses
          </p>
          <div className="flex flex-wrap gap-2">
            {data.core_courses.map((course, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-xs font-medium text-sky-700 dark:text-sky-300"
              >
                {course}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Career Pathways */}
      {data.career_pathways && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Career Pathways: </strong>
            {data.career_pathways}
          </p>
        </div>
      )}
    </div>
  );
}

export default SpecialisationCard;