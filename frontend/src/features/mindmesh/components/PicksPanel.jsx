import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { MYPLAN_URL } from "../hooks/useCoursePicks";

export default function PicksPanel({ picks, loading, failed, onRetry, onSelect, canAdd, onAdd, saving }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hidden sm:block absolute top-4 right-4 z-10 w-72">
      <button
        data-tour="suggested"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-blue-700 dark:text-blue-300 bg-white/95 dark:bg-slate-900/95 border border-blue-200 dark:border-blue-800 shadow-sm hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
      >
        <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        Suggested next{!loading && !failed && picks.length > 0 ? ` (${picks.length})` : ""}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-blue-100 dark:border-slate-700 shadow-lg p-4">
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
      )}
    </div>
  );
}
