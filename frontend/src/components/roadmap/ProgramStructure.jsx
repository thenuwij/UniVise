// src/components/roadmap/ProgramStructure.jsx
import { Layers, Info, Sparkles } from "lucide-react";

function YearSchool({ y }) {
  return (
    <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60
                    bg-gradient-to-br from-white to-slate-50/30
                    dark:from-slate-900 dark:to-slate-800/50
                    shadow-sm hover:shadow-md transition-all duration-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-sky-100 to-indigo-100
                        dark:from-sky-900/30 dark:to-indigo-900/30 flex-shrink-0">
          <Layers className="h-4 w-4 text-sky-700 dark:text-sky-400" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
          Year {y?.year ?? "—"}
        </h3>
      </div>
      {y?.overview ? (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {y.overview}
        </p>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          No description provided for this year.
        </p>
      )}
    </div>
  );
}

export default function ProgramStructure({ years = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60
                    dark:border-slate-700/60 shadow-xl overflow-hidden">
      
      {/* ========== HEADER ========== */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-8 py-6 border-b-2 border-slate-200 dark:border-slate-700">
        
        {/* Very subtle gradient accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent" />
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Layers className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Program Structure
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              General year-by-year study plan for this pathway
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-8 space-y-6">
        {/* User Guidance */}
        <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400
                        italic px-1">
          <Info className="h-4 w-4 text-sky-500 dark:text-sky-400 flex-shrink-0 mt-0.5" />
          <p>
            Each year outlines the key focus or subjects typically studied. 
            These are indicative only — check your school handbook for full details.
          </p>
        </div>

        {/* Year Sections */}
        {years.length > 0 ? (
          <div className="space-y-3">
            {years.map((y, i) => (
              <YearSchool key={i} y={y} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-5 rounded-xl
                          bg-slate-50 dark:bg-slate-800/50
                          border border-slate-200 dark:border-slate-700">
            <Sparkles className="h-5 w-5 text-sky-600 dark:text-sky-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No structure data available.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}