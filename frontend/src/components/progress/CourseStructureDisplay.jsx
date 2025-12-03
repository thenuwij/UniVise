// src/components/progress/CourseStructureDisplay.jsx
import CourseSection from "./CourseSection";

export default function CourseStructureDisplay({ 
  structure, 
  completedCourses, 
  userId, 
  enrolledProgram, 
  onCourseUpdate 
}) {

  // Helper to get source type from section source
  const getSourceType = (source) => {
    if (source === "program") return "program";
    if (source === "Major") return "major";
    if (source === "Minor") return "minor";
    if (source === "Honours") return "honours";
    return "program";
  };

  // Helper to get source code for a section
  const getSourceCode = (section) => {

    // For program courses, return the degree code
    if (section.source === "program") {
      return enrolledProgram?.degree_code || null;
    }
    // For specialisations, find the major_code from enrolled program
    const specNames = enrolledProgram?.specialisation_names || [];
    const specCodes = enrolledProgram?.specialisation_codes || [];
    const index = specNames.indexOf(section.sourceName);
    
    return index >= 0 ? specCodes[index] : null;
  };

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
                courseSource={{
                  source_type: getSourceType(section.source),
                  source_code: getSourceCode(section)
                }}
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
                courseSource={{
                  source_type: getSourceType(section.source),
                  source_code: getSourceCode(section)
                }}
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