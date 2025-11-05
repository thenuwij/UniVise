// src/components/roadmap/EntryRequirementsCard.jsx
import { GraduationCap, BookOpen, Target } from "lucide-react";

export default function EntryRequirementsCardUnsw({ atar, selectionRank, subjects = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 p-8 shadow-xl space-y-8">

      {/* ---------- HEADER ---------- */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30 shadow-sm">
          <GraduationCap className="h-6 w-6 text-blue-700 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Key Entry Requirements
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Check the latest UNSW Handbook or UAC website for other thresholds.
          </p>
        </div>
      </div>

      {/* ---------- REQUIREMENT STATS ---------- */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* ATAR */}
        <div className="group p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                        bg-gradient-to-br from-blue-50/70 via-sky-50/70 to-indigo-50/70 
                        dark:from-blue-900/20 dark:via-sky-900/20 dark:to-indigo-900/20
                        hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Entry ATAR
            </span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {atar || "Check university"}
          </p>
        </div>

        {/* Selection Rank */}
        <div className="group p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                        bg-gradient-to-br from-indigo-50/70 via-blue-50/70 to-sky-50/70 
                        dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-sky-900/20
                        hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Selection Rank
            </span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {selectionRank || "Varies"}
          </p>
        </div>

        {/* Assumed Knowledge */}
        <div className="group p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                        bg-gradient-to-br from-sky-50/70 via-blue-50/70 to-indigo-50/70 
                        dark:from-sky-900/20 dark:via-blue-900/20 dark:to-indigo-900/20
                        hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Assumed Knowledge
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
            {subjects.length ? subjects.join(", ") : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
