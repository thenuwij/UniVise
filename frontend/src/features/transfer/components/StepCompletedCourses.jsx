import { HiCheckCircle, HiPlus, HiX } from "react-icons/hi";
import CourseStructureDisplay from "./CourseStructureDisplay";
import CourseSearchModal from "./CourseSearchModal";
import StepHeader from "./StepHeader";

// Step 2: tick off completed courses and add any taken outside the program.
function StepCompletedCourses({
  enrolledProgram,
  userId,
  courseStructure,
  completedCourses,
  onRefresh,
  extraCourses,
  onRemoveExtraCourse,
  showCourseModal,
  setShowCourseModal,
  courseQuery,
  setCourseQuery,
  courseResults,
  setCourseResults,
  courseSearchLoading,
  duplicateNotice,
  setDuplicateNotice,
  onSearchCourses,
  onAddExtraCourse,
}) {
  return (
    <div className="space-y-4">
      <StepHeader stepNum={2} title="Which courses have you completed?" subtitle="" />
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Tick each course you've completed
            </p>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">
              {completedCourses.length} completed
            </span>
          </div>
          <div className="px-5 py-4 max-h-96 overflow-y-auto">
            <CourseStructureDisplay
              structure={courseStructure}
              completedCourses={completedCourses}
              userId={userId}
              enrolledProgram={enrolledProgram}
              onCourseUpdate={onRefresh}
            />
          </div>
        </div>
      </div>

      {/* Add extra courses button */}
      <div className="max-w-5xl mx-auto px-4 mb-4">
        <button
          onClick={() => setShowCourseModal(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-bold text-base"
        >
          <HiPlus className="w-5 h-5" />
          Add other completed courses
        </button>
      </div>

      {/* Extra courses display */}
      {extraCourses.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 border-l-4 border-emerald-400 dark:border-emerald-600 pl-4 rounded-r-lg py-3 bg-gradient-to-r from-emerald-50/20 to-transparent dark:from-emerald-950/10">
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Other Completed Courses</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {extraCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center p-2.5 rounded-lg border border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-600 shadow-sm"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 bg-green-500 border-green-500">
                    <HiCheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {course.course_code} - {course.course_name}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-0.5">
                      {course.uoc} UOC
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveExtraCourse(course.id)}
                  className="ml-2 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <HiX className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCourseModal && (
        <CourseSearchModal
          onClose={() => {
            setShowCourseModal(false);
            setCourseQuery("");
            setCourseResults([]);
            setDuplicateNotice(null);
          }}
          query={courseQuery}
          onQueryChange={onSearchCourses}
          results={courseResults}
          loading={courseSearchLoading}
          completedCourses={completedCourses}
          duplicateNotice={duplicateNotice}
          setDuplicateNotice={setDuplicateNotice}
          onAddCourse={onAddExtraCourse}
        />
      )}
    </div>
  );
}

export default StepCompletedCourses;
