import { Sparkles } from "lucide-react";
import { MYPLAN_URL } from "../hooks/useCoursePicks";

export default function PicksPanel({ picks, loading, failed, onRetry, onSelect, canAdd, onAdd, saving }) {
  return (
    <div className="hidden sm:block absolute top-4 right-4 z-10 w-72 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recommended for you</h3>
      </div>
      {loading ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Finding courses that fit your goals...</p>
      ) : failed ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Recommendations couldn't be loaded.{" "}
          <button onClick={onRetry} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Try again
          </button>
        </p>
      ) : picks.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No recommendations yet. Mark the courses you've finished as done in your roadmap to see what fits next.
        </p>
      ) : (
        <ul className="space-y-2.5">
          {picks.map((p) => (
            <li key={p.code}>
              <button onClick={() => onSelect(p.code)} className="text-left group">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300 group-hover:underline">{p.code}</span>
                <span className="text-xs text-slate-700 dark:text-slate-300"> {p.name}</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{p.reason}</p>
              </button>
              {canAdd?.(p.code) && (
                <button
                  onClick={() => onAdd(p.code)}
                  disabled={saving}
                  className="mt-1 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline disabled:opacity-50"
                >
                  Add to CourseMesh
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <a
        href={MYPLAN_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-3 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline"
      >
        Plan it in myPlan
      </a>
    </div>
  );
}
