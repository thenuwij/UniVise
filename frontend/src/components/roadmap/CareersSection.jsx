// src/components/roadmap/CareersSection.jsx
import { Sparkles, TrendingUp, Globe } from "lucide-react";

/**
 * Careers Section (School Version)
 * ----------------------------------------
 * Unified design matching IndustrySection / UNSW components
 */

export default function CareersSection({ roles = [], rolesHint, sources = [] }) {
  const hasAnything = (roles && roles.length) || rolesHint || (sources && sources.length);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 p-8 shadow-xl space-y-6 relative">

      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl" />

      {/* Header */}
      <div className="flex items-center gap-4 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 
                        dark:from-indigo-900/30 dark:to-purple-900/30 shadow-sm">
          <Sparkles className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Career Pathways
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Example roles and resources to explore career options.
          </p>
        </div>
      </div>

      {!hasAnything ? (
        <div className="text-slate-500 dark:text-slate-400 italic">
          No career information available for this program.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Roles */}
          {!!roles.length && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-50/70 via-blue-50/70 to-sky-50/70 
                            dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-sky-900/20
                            border border-indigo-200/40 dark:border-indigo-800/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Common Roles
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {roles.map((r, i) => (
                  <span key={i}
                    className="px-3 py-1 rounded-full border border-indigo-200/60 
                               dark:border-indigo-800/60 bg-white/50 dark:bg-slate-900/30
                               text-slate-800 dark:text-slate-200 text-sm font-medium shadow-sm">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Roles hint */}
          {rolesHint && !roles.length && (
            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Try roles like <span className="font-semibold">{rolesHint}</span>.
            </div>
          )}

          {/* Sources */}
          {!!sources.length && (
            <div className="p-5 rounded-xl bg-gradient-to-br from-purple-50/70 to-pink-50/70 
                            dark:from-purple-900/20 dark:to-pink-900/20 
                            border border-purple-200/40 dark:border-purple-800/40 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Explore Career Resources
                </h4>
              </div>
              <ul className="list-disc ml-5 space-y-1">
                {sources.map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-700 dark:text-indigo-300 hover:underline text-sm"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
