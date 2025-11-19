// src/components/pathway/CareerPathCard.jsx
import React from "react";
import { Briefcase, DollarSign, TrendingUp, Building2 } from "lucide-react";

function CareerPathCard({ data }) {
  return (
    <div className="space-y-4">
      {/* LEVEL & SALARY */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {data.level && (
            <p className="text-xs uppercase font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3" />
              {data.level} level
            </p>
          )}
        </div>

        {data.salary_range && (
          <div className="px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 shadow-sm text-center">
            <p className="text-xs uppercase font-semibold text-green-600 dark:text-green-400 flex items-center justify-center gap-1 mb-0.5">
              <DollarSign className="h-3 w-3" />
              Salary
            </p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">
              {data.salary_range}
            </p>
          </div>
        )}
      </div>

      {/* DESCRIPTION */}
      {data.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {data.description}
        </p>
      )}

      {/* REQUIREMENTS */}
      {data.requirements && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <p className="text-xs uppercase font-bold text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            Requirements
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {data.requirements}
          </p>
        </div>
      )}

      {/* KEY SKILLS (if exists) */}
      {data.key_skills && data.key_skills.length > 0 && (
        <div>
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2">
            Key Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {data.key_skills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-xs font-semibold text-green-700 dark:text-green-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* HIRING COMPANIES */}
      {data.hiring_companies && data.hiring_companies.length > 0 && (
        <div>
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Companies Hiring
          </p>
          <div className="flex flex-wrap gap-2">
            {data.hiring_companies.map((company, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CAREER PROGRESSION (if exists) */}
      {data.career_progression && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-blue-700 dark:text-blue-300">Progression: </strong>
            {data.career_progression}
          </p>
        </div>
      )}

      {/* SOURCE */}
      {data.source && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-2 border-t border-slate-200 dark:border-slate-700">
          Source: {data.source}
        </p>
      )}
    </div>
  );
}

export default CareerPathCard;