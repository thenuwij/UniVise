import { GraduationCap, BookOpen, Target } from "lucide-react";
import RoadmapCard from "./RoadmapCard";

export default function EntryRequirementsCard({ atar, selectionRank, subjects = [] }) {
  return (
    <RoadmapCard
      title="Key Entry Requirements"
      subtitle="Check the latest university handbook for precise thresholds."
    >
      <div className="grid sm:grid-cols-3 gap-4 text-primary">
        {/* ATAR */}
        <div className="p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                        bg-gradient-to-br from-blue-50/70 via-sky-50/70 to-indigo-50/70 
                        dark:from-blue-900/20 dark:via-sky-900/20 dark:to-indigo-900/20 
                        shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Entry ATAR
            </span>
          </div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {atar || "Check university"}
          </p>
        </div>

        {/* Selection Rank */}
        <div className="p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                        bg-gradient-to-br from-indigo-50/70 via-blue-50/70 to-sky-50/70 
                        dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-sky-900/20 
                        shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Selection Rank
            </span>
          </div>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {selectionRank || "Varies"}
          </p>
        </div>

        {/* Assumed Knowledge */}
        <div className="p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                        bg-gradient-to-br from-sky-50/70 via-blue-50/70 to-indigo-50/70 
                        dark:from-sky-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 
                        shadow-sm">
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
    </RoadmapCard>
  );
}
