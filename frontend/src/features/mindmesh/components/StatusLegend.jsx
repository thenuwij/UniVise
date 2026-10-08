import { Info } from "lucide-react";
import { STATUS } from "../utils/availability";

export default function StatusLegend() {
  return (
    <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 border border-blue-100 dark:border-slate-700 shadow-sm px-4 py-2">
      {Object.entries(STATUS).map(([key, { label, color }]) => (
        <span key={key} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          {label}
        </span>
      ))}
      <span
        title="Based on prerequisite courses and the courses you marked as done. UOC and program rules are checked in myPlan."
        className="inline-flex text-slate-400 dark:text-slate-500"
      >
        <Info className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}
