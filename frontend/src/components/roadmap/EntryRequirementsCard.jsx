// src/components/roadmap/EntryRequirementsCard.jsx (School version)
import { GraduationCap, BookOpen, Target, Info } from "lucide-react";

export default function EntryRequirementsCard({ atar, selectionRank, subjects = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 shadow-xl overflow-hidden">
      
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-8 py-6 border-b-2 border-slate-200 dark:border-slate-700">
        
        {/* Very subtle gradient accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent" />
        
        <div className="relative flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <GraduationCap className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Entry Requirements
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Check the latest university handbook for complete admission criteria
            </p>
          </div>
        </div>
      </div>

      {/* ---------- REQUIREMENT STATS ---------- */}
      <div className="p-8">
        <div className="grid sm:grid-cols-3 gap-4">
          {/* ATAR */}
          <div className="group p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                          bg-gradient-to-br from-blue-50/70 via-sky-50/70 to-indigo-50/70 
                          dark:from-blue-900/20 dark:via-sky-900/20 dark:to-indigo-900/20
                          shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Entry ATAR
              </span>
              <div className="relative group/tooltip ml-1">
                <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 
                              bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg 
                              opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible
                              transition-all duration-200 shadow-lg z-10
                              pointer-events-none w-[220px]">
                  <div className="whitespace-normal leading-relaxed">
                    Australian Tertiary Admission Rank - the lowest ATAR score typically accepted
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 
                                border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                </div>
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {atar || "Check university"}
            </p>
          </div>

          {/* Selection Rank */}
          <div className="group p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                          bg-gradient-to-br from-indigo-50/70 via-blue-50/70 to-sky-50/70 
                          dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-sky-900/20
                          shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Selection Rank
              </span>
              <div className="relative group/tooltip ml-1">
                <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 
                              bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg 
                              opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible
                              transition-all duration-200 shadow-lg z-10
                              pointer-events-none w-[220px]">
                  <div className="whitespace-normal leading-relaxed">
                    Minimum combined score needed for entry - includes ATAR plus any bonus points
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 
                                border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                </div>
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {selectionRank || "Varies"}
            </p>
          </div>

          {/* Assumed Knowledge */}
          <div className="group p-5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 
                          bg-gradient-to-br from-sky-50/70 via-blue-50/70 to-indigo-50/70 
                          dark:from-sky-900/20 dark:via-blue-900/20 dark:to-indigo-900/20
                          shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Assumed Knowledge
              </span>
              <div className="relative group/tooltip ml-1">
                <Info className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 
                              bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg 
                              opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible
                              transition-all duration-200 shadow-lg z-10
                              pointer-events-none w-[220px]">
                  <div className="whitespace-normal leading-relaxed">
                    High school subjects you should have studied for this degree
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 
                                border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
                </div>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {subjects.length ? subjects.join(", ") : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}