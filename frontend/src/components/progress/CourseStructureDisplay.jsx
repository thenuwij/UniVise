// src/components/progress/CourseStructureDisplay.jsx
import React from "react";
import CourseSection from "./CourseSection";

export default function CourseStructureDisplay({ 
  structure, 
  completedCourses, 
  userId, 
  onCourseUpdate 
}) {
  // Group sections by source (program vs specialisations)
  const programSections = structure.filter(s => s.source === "program");
  
  // Group specialisation sections by source name (each major/minor/honours)
  const specSectionsBySource = {};
  structure.filter(s => s.source !== "program").forEach(section => {
    const key = `${section.source}-${section.sourceName}`;
    if (!specSectionsBySource[key]) {
      specSectionsBySource[key] = {
        type: section.source,
        name: section.sourceName,
        sections: []
      };
    }
    specSectionsBySource[key].sections.push(section);
  });

  return (
    <div className="mt-8 space-y-12">
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
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-16">Program</p>
          </div>
          
          <div className="space-y-8">
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

      {/* Specialisation Sections - Grouped by source */}
      {Object.entries(specSectionsBySource).map(([key, group]) => (
        <div key={key}>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {group.name}
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 ml-16 capitalize">
              {group.type}
            </p>
          </div>
          
          <div className="space-y-8">
            {group.sections.map((section, idx) => (
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
      ))}

      {structure.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">
          No course structure available
        </p>
      )}
    </div>
  );
}