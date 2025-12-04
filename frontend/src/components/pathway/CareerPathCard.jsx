// src/components/pathway/CareerPathCard.jsx
import { Briefcase, Building2, DollarSign, TrendingUp } from "lucide-react";

function CareerPathCard({ data }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
      
      {/* Level & Salary */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {data.level && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20">
            <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="text-sm font-medium text-sky-700 dark:text-sky-300">
              {data.level} level
            </span>
          </div>
        )}

        {data.salary_range && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Salary</p>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{data.salary_range}</p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {data.description}
        </p>
      )}

      {/* Requirements */}
      {data.requirements && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Requirements
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300">{data.requirements}</p>
        </div>
      )}

      {/* Key Skills */}
      {data.key_skills && data.key_skills.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Key Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {data.key_skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 text-xs font-medium rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hiring Companies */}
      {data.hiring_companies && data.hiring_companies.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Companies Hiring
          </p>
          <div className="flex flex-wrap gap-2">
            {data.hiring_companies.map((company, idx) => (
              <span
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <Building2 className="w-3 h-3" />
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Career Progression */}
      {data.career_progression && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Briefcase className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          <span>Progression: {data.career_progression}</span>
        </div>
      )}

      {/* Source */}
      {data.source && (
        <p className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
          Source: {data.source}
        </p>
      )}
    </div>
  );
}

export default CareerPathCard;