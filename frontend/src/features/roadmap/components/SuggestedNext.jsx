import { Sparkles } from "lucide-react";
import { MYPLAN_URL, useCoursePicks } from "@/features/mindmesh/hooks/useCoursePicks";

export default function SuggestedNext({ degreeCode, onCourseClick }) {
  const { picks, loading, failed, programCode, retry } = useCoursePicks();

  if (!loading && !failed && (programCode !== degreeCode || picks.length === 0)) return null;

  return (
    <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Suggested for you next</h3>
        </div>
        <a
          href={MYPLAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline flex-shrink-0"
        >
          Plan it in myPlan
        </a>
      </div>
      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">Finding courses that fit your goals...</p>
      ) : failed ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Suggestions couldn't be loaded.{" "}
          <button onClick={retry} className="font-semibold text-blue-700 dark:text-blue-300 hover:underline">
            Try again
          </button>
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-3">
          {picks.slice(0, 3).map((p) => (
            <button
              key={p.code}
              onClick={() => onCourseClick(p)}
              className="text-left rounded-xl px-4 py-3.5 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900 hover:border-amber-400 hover:-translate-y-0.5 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <span className="block text-[15px] font-bold text-blue-700 dark:text-blue-300">{p.code}</span>
              <span className="block text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{p.name}</span>
              <span className="block text-xs text-slate-600 dark:text-slate-400 mt-1 leading-snug">{p.reason}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
