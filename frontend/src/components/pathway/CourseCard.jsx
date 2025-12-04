// src/components/pathway/CourseCard.jsx
import { Award, BookOpen, GraduationCap } from "lucide-react";

function CourseCard({ data }) {
  return (
    <div className="space-y-4">
      
      {/* Course Code & UOC */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {data.code && (
            <p className="text-base font-bold text-sky-700 dark:text-sky-300">
              {data.code}
            </p>
          )}
        </div>
        {data.uoc && (
          <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
            {data.uoc}
          </span>
        )}
      </div>

      {/* Faculty */}
      {data.faculty && (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {data.faculty}
          </span>
        </div>
      )}

      {/* Description */}
      {data.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4">
          {data.description}
        </p>
      )}

      {/* Study Level */}
      {data.study_level && (
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700">
          <Award className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {data.study_level}
          </span>
        </div>
      )}

      {/* Offering Terms */}
      {data.offering_terms && (
        <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-sky-700 dark:text-sky-300">Offered: </strong>
            {Array.isArray(data.offering_terms)
              ? data.offering_terms.join(", ")
              : data.offering_terms}
          </p>
        </div>
      )}

      {/* Field of Education */}
      {data.field_of_education && (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <BookOpen className="h-3 w-3" />
          <span>{data.field_of_education}</span>
        </div>
      )}
    </div>
  );
}

export default CourseCard;