import SpecialisationSelectionPanel from "./SpecialisationSelectionPanel";
import StepHeader from "./StepHeader";

// Step 1: confirm the enrolled program and capture the current WAM.
function StepCurrentProgram({
  enrolledProgram,
  userId,
  onRefresh,
  onReselectProgram,
  wamInput,
  setWamInput,
  onSaveWam,
}) {
  return (
    <div className="max-w-6xl mx-auto mt-10 px-4 space-y-4">
      <StepHeader stepNum={1} title="What's your current program?" subtitle="" />
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3">
          <SpecialisationSelectionPanel
            enrolledProgram={enrolledProgram}
            userId={userId}
            onUpdate={onRefresh}
            onReselectProgram={onReselectProgram}
          />
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex items-center gap-6">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            Current WAM <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" max="100" step="0.1"
              value={wamInput}
              onChange={(e) => setWamInput(e.target.value)}
              onBlur={(e) => onSaveWam(e.target.value)}
              placeholder="e.g. 75.5"
              className="w-28 px-3 py-2 text-base font-semibold rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-0 outline-none transition-colors"
            />
            <span className="text-sm text-slate-400">/ 100</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StepCurrentProgram;
