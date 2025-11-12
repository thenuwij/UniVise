// src/components/roadmap/IndustrySection.jsx
import { Briefcase, Building2, Users, CheckCircle2 } from "lucide-react";

export default function IndustrySection({ internships = [], trainingInfo, societies = [] }) {
  const hasData = internships.length || trainingInfo || societies.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 p-8 shadow-xl space-y-6 relative">

      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 rounded-t-2xl" />

      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 
                        dark:from-slate-800 dark:to-slate-700 shadow-sm">
          <Briefcase className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Industry Exposure
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore work experience, internships, and professional communities.
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="space-y-5">

          {/* Internships */}
          {!!internships.length && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50/70 to-sky-50/70 
                            dark:from-blue-900/20 dark:to-sky-900/20 
                            border border-blue-200/40 dark:border-blue-800/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Internship Sites
                </h4>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {internships.join(", ")}
              </p>
            </div>
          )}

          {/* Training Info */}
          {trainingInfo && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/70 to-blue-50/70 
                            dark:from-indigo-900/20 dark:to-blue-900/20 
                            border border-indigo-200/40 dark:border-indigo-800/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Industrial Training
                </h4>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {trainingInfo}
              </p>
            </div>
          )}

          {/* Societies */}
          {!!societies.length && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-sky-50/70 to-indigo-50/70 
                            dark:from-sky-900/20 dark:to-indigo-900/20 
                            border border-sky-200/40 dark:border-sky-800/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Relevant Societies
                </h4>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {societies.join(", ")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 
                        border border-slate-200 dark:border-slate-700">
          <Briefcase className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400 italic">
            No industry information available for this school.
          </p>
        </div>
      )}
    </div>
  );
}
