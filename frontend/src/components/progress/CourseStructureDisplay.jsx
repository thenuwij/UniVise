// src/components/progress/CourseStructureDisplay.jsx
import CourseSection from "./CourseSection";

export default function CourseStructureDisplay({
  structure,
  completedCourses,
  userId,
  enrolledProgram,
  onCourseUpdate
}) {

  const getSourceType = (source) => {
    if (source === "program") return "program";
    if (source === "Major") return "major";
    if (source === "Minor") return "minor";
    if (source === "Honours") return "honours";
    return "program";
  };

  const getSourceCode = (section) => {
    if (section.source === "program") {
      return enrolledProgram?.degree_code || null;
    }
    const specNames = enrolledProgram?.specialisation_names || [];
    const specCodes = enrolledProgram?.specialisation_codes || [];
    const index = specNames.indexOf(section.sourceName);
    return index >= 0 ? specCodes[index] : null;
  };

  const programSections = structure.filter(s => s.source === "program");

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
    <div className="mt-4 space-y-4">

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
          colorTheme="blue"
        />
      ))}

      {Object.entries(specSectionsBySource).map(([key, group]) =>
        group.sections.map((section, idx) => (
          <CourseSection
            key={`${key}-${idx}`}
            section={section}
            completedCourses={completedCourses}
            userId={userId}
            courseSource={{
              source_type: getSourceType(section.source),
              source_code: getSourceCode(section)
            }}
            onCourseUpdate={onCourseUpdate}
            colorTheme="purple"
          />
        ))
      )}

      {structure.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            No course structure available
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your course structure will appear here once loaded
          </p>
        </div>
      )}
    </div>
  );
}
