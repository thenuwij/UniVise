// src/components/CourseStructureDisplay.jsx
import React from "react";
import CourseSection from "./CourseSection";

export default function CourseStructureDisplay({ 
  structure, 
  completedCourses, 
  userId, 
  onCourseUpdate 
}) {
  // Separate program and specialisation sections
  const programSections = structure.filter(s => s.source === "program");
  const specialisationSections = structure.filter(s => s.source !== "program");

  return (
    <div className="mt-8 space-y-8">
      {/* Program Sections */}
      {programSections.length > 0 && (
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-12 bg-gradient-to-r from-blue-500 to-sky-500 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {programSections[0]?.sourceName}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-16">
              Program
            </p>
          </div>
          
          <div className="space-y-6">
            {programSections.map((section, idx) => (
              <CourseSection
                key={idx}
                section={section}
                completedCourses={completedCourses}
                userId={userId}
                onCourseUpdate={onCourseUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Specialisation Sections */}
      {specialisationSections.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {specialisationSections[0]?.sourceName}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-16">
              {specialisationSections[0]?.source}
            </p>
          </div>
          
          <div className="space-y-6">
            {specialisationSections.map((section, idx) => (
              <CourseSection
                key={idx}
                section={section}
                completedCourses={completedCourses}
                userId={userId}
                onCourseUpdate={onCourseUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {structure.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">No course structure available</p>
      )}
    </div>
  );
}