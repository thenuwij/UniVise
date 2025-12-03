// src/components/progress/CourseSection.jsx
import { HiPlus } from "react-icons/hi";
import CourseRow from "./CourseRow";

export default function CourseSection({ section, completedCourses, userId, onCourseUpdate }) {
  const hasCourses = section.courses && section.courses.length > 0;
  
  // Check if section is for electives or general education
  const isElectiveSection = section.title.toLowerCase().includes("elective") || 
    section.title.toLowerCase().includes("general education");

  return (
    <div className="border-l-2 border-blue-400 dark:border-blue-600 pl-3 mb-3">
      {/* Super Compact Section Header */}
      <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {section.title}
        </h3>
        {section.uoc && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {section.uoc} UOC
          </span>
        )}
      </div>

      {/* Compact Description & Notes */}
      {(section.description || section.notes) && (
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 space-y-0.5">
          {section.description && <p>{section.description}</p>}
          {section.notes && (
            <p className="text-amber-600 dark:text-amber-400">
              <span className="font-semibold">Note:</span> {section.notes}
            </p>
          )}
        </div>
      )}

      {hasCourses ? (
        <>
          {/* 2-COLUMN GRID LAYOUT FOR COURSES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
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

          {/* Show Add Course button for elective sections */}
          {isElectiveSection && (
            <button
              onClick={() => {
                window.location.href = `/explore-by-course?section=${encodeURIComponent(section.title)}`;
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              <HiPlus className="w-3.5 h-3.5" />
              <span>Add More</span>
            </button>
          )}
        </>
      ) : (
        // No courses - show compact version
        <>
          {isElectiveSection ? (
            <div className="p-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                No predefined courses. Add from course detail pages.
              </p>
              <button
                onClick={() => {
                  window.location.href = `/explore-by-course?section=${encodeURIComponent(section.title)}`;
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition"
              >
                <HiPlus className="w-3.5 h-3.5" />
                <span>Add Course</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Courses vary by specialisation. Select above to see requirements.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}