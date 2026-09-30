import { STATUS } from "../utils/availability";

export default function StatusLegend() {
  return (
    <div className="absolute top-4 left-4 z-10 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-3 max-w-[240px]">
      <div className="space-y-1.5">
        {Object.entries(STATUS).map(([key, { label, color }]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
        Based on prerequisite courses and the courses you marked as done. UOC and program rules are checked in myPlan.
      </p>
    </div>
  );
}
