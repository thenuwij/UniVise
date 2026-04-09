// src/components/progress/CourseSection.jsx
import CourseRow from "./CourseRow";

export default function CourseSection({ section, completedCourses, userId, onCourseUpdate, colorTheme = "blue" }) {
  if (!section.courses || section.courses.length === 0) return null;

  const colors = {
    blue: {
      border: "border-blue-400 dark:border-blue-600",
      bg: "bg-gradient-to-r from-blue-50/20 to-transparent dark:from-blue-950/10 dark:to-transparent",
      badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
    purple: {
      border: "border-purple-400 dark:border-purple-600",
      bg: "bg-gradient-to-r from-purple-50/20 to-transparent dark:from-purple-950/10 dark:to-transparent",
      badge: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    }
  };

  const theme = colors[colorTheme];

  return (
    <div className={`border-l-4 ${theme.border} pl-4 mb-4 ${theme.bg} rounded-r-lg py-3`}>

      <div className="flex items-baseline gap-2 mb-2 flex-wrap">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {section.title}
        </h3>
        {section.uoc && (
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${theme.badge} border`}>
            {section.uoc} UOC
          </span>
        )}
      </div>

      {(section.description || section.notes) && (
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-3 space-y-1 font-medium">
          {section.description && <p>{section.description}</p>}
          {section.notes && (
            <p className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border-l-2 border-amber-500">
              <span className="font-bold">Note:</span> {section.notes}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
        {section.courses.map((course) => {
          const completed = completedCourses.find((c) => c.course_code === course.code);
          return (
            <CourseRow
              key={course.code}
              course={course}
              completed={completed}
              userId={userId}
              category={section.title}
              onUpdate={onCourseUpdate}
            />
          );
        })}
      </div>
    </div>
  );
}
