import { HiCheck, HiInformationCircle, HiSearch, HiX } from "react-icons/hi";

// Search dialog for adding completed courses that sit outside the program structure.
function CourseSearchModal({
  onClose,
  query,
  onQueryChange,
  results,
  loading,
  completedCourses,
  duplicateNotice,
  setDuplicateNotice,
  onAddCourse,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Add completed courses</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <HiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {duplicateNotice && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <HiInformationCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <span className="font-bold">{duplicateNotice.code}</span>{" "}
                is already marked as completed
                {duplicateNotice.reason === "program" ? " as part of your current program." : "."}
              </span>
            </div>
          )}
          <div className="relative mb-4">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search by course code or name..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-colors text-sm"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {results.length > 0 ? results.map((course) => {
              const existingCompleted = completedCourses.find(c => c.course_code === course.code);
              const isInExtras = !!existingCompleted && existingCompleted.category === "extra";
              const isInProgram = !!existingCompleted && existingCompleted.category !== "extra";
              const isAlreadyCompleted = !!existingCompleted;
              return (
                <button
                  key={course.code}
                  onClick={async () => {
                    if (isAlreadyCompleted) {
                      setDuplicateNotice({ code: course.code, reason: isInProgram ? "program" : "extras" });
                      return;
                    }
                    await onAddCourse(course);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                    isInExtras
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-600 cursor-not-allowed"
                      : isInProgram
                      ? "border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 cursor-not-allowed"
                      : "border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300"
                  }`}
                >
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">{course.code}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{course.title}</span>
                  </div>
                  {isInExtras ? (
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 ml-4 flex-shrink-0 flex items-center gap-1">
                      <HiCheck className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : isInProgram ? (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-4 flex-shrink-0 flex items-center gap-1">
                      <HiCheck className="w-3.5 h-3.5" /> Already completed
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-4 flex-shrink-0">+ Add</span>
                  )}
                </button>
              );
            }) : query.length >= 2 && !loading ? (
              <p className="text-center text-sm text-slate-400 py-8">No courses found</p>
            ) : (
              <p className="text-center text-sm text-slate-400 py-8">Type at least 2 characters to search</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseSearchModal;
