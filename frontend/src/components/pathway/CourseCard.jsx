// src/components/pathway/CourseCard.jsx
import { Award, BookOpen, GraduationCap } from "lucide-react";

function CourseCard({ data }) {
  return (
    <div className="space-y-4">
      {/* COURSE CODE & UOC */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {data.code && (
            <p className="text-base font-bold text-purple-700 dark:text-purple-300">
              {data.code}
            </p>
          )}
        </div>

        {data.uoc && (
          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300">
            {data.uoc}
          </span>
        )}
      </div>

      {/* FACULTY */}
      {data.faculty && (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            {data.faculty}
          </span>
        </div>
      )}

      {/* DESCRIPTION */}
      {data.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-4">
          {data.description}
        </p>
      )}

      {/* STUDY LEVEL (if exists) */}
      {data.study_level && (
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
            {data.study_level}
          </span>
        </div>
      )}

      {/* OFFERING TERMS (if exists) */}
      {data.offering_terms && (
        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-purple-700 dark:text-purple-300">Offered: </strong>
            {Array.isArray(data.offering_terms) 
              ? data.offering_terms.join(", ") 
              : data.offering_terms}
          </p>
        </div>
      )}

      {/* FIELD OF EDUCATION (if exists) */}
      {data.field_of_education && (
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <BookOpen className="h-3 w-3" />
          <span>{data.field_of_education}</span>
        </div>
      )}
    </div>
  );
}

export default CourseCard;