import { HiX } from "react-icons/hi";
import AdvisorReport from "../advisor/AdvisorReport";

// Step 4: loading, error and result states for the transfer recommendation.
function StepTransferReport({
  reportLoading,
  reportError,
  comparisonData,
  aiReport,
  onRetry,
  baseProgram,
  targetProgram,
  baseSelectedSpecs,
  targetSelectedSpecs,
  baseSpecsOptions,
  targetSpecsOptions,
}) {
  return (
    <div>
      {reportLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-8">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Generating Your Report
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md text-center leading-relaxed">
            Comparing course requirements, checking prerequisites, and generating your transfer recommendation...
          </p>
          <div className="mt-6 flex items-center gap-3">
            {[0, 0.2, 0.4].map((d) => (
              <div
                key={d}
                className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce"
                style={{ animationDelay: `${d}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {reportError && !reportLoading && (
        <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900 p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <HiX className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-6 max-w-md mx-auto">
            {reportError}
          </p>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {!reportLoading && !reportError && comparisonData && aiReport && (
        <AdvisorReport
          comparisonData={comparisonData}
          aiReport={aiReport}
          currentProgram={baseProgram}
          targetProgram={targetProgram}
          baseSelectedSpecs={baseSelectedSpecs}
          targetSelectedSpecs={targetSelectedSpecs}
          baseSpecsOptions={baseSpecsOptions}
          targetSpecsOptions={targetSpecsOptions}
        />
      )}
    </div>
  );
}

export default StepTransferReport;
