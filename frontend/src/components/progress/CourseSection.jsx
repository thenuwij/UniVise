// src/components/CourseSection.jsx
import React from "react";
import CourseRow from "./CourseRow";
import { HiPlus } from "react-icons/hi";

export default function CourseSection({ section, completedCourses, userId, onCourseUpdate }) {
  const hasCourses = section.courses && section.courses.length > 0;
  
  // Check if section is for electives or general education
  const isElectiveSection = section.title.toLowerCase().includes("elective") || 
                           section.title.toLowerCase().includes("general education");

  return (
    <div className="border-l-4 border-blue-500 dark:border-blue-600 pl-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {section.title}
        </h3>
        {section.uoc && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Required: {section.uoc} UOC
          </p>
        )}
        {section.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {section.description}
          </p>
        )}
        {section.notes && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Note: {section.notes}
          </p>
        )}
      </div>

      {hasCourses ? (
        <>
          <div className="space-y-2">
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
          
          {/* Show Add Course button for elective sections even if they have courses */}
          {isElectiveSection && (
            <div className="mt-3">
              <button
                onClick={() => {
                  window.location.href = "/explore-by-course";
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-600 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-sm"
              >
                <HiPlus className="w-4 h-4" />
                <span>Add More Courses</span>
              </button>
            </div>
          )}
        </>
      ) : (
        // No courses - show Add Course button if it's elective section, otherwise just show info
        <>
          {isElectiveSection ? (
            <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                No predefined courses for this section. Add courses from the course detail pages.
              </p>
              <button
                onClick={() => {
                  window.location.href = "/explore-by-course";
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition text-sm"
              >
                <HiPlus className="w-4 h-4" />
                <span>Add Course</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This section's courses vary by specialisation. Select your specialisation above to see specific requirements.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}