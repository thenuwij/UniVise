// src/components/pathway/InternshipCard.jsx
import React from "react";
import { Building2, Calendar, Clock, AlertCircle } from "lucide-react";

function InternshipCard({ data }) {
  return (
    <div className="space-y-4">
      {/* COMPANY & PAID STATUS */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {data.company && (
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {data.company}
            </p>
          )}
        </div>

        {data.paid && (
          <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 shadow-sm">
            Paid
          </span>
        )}
      </div>

      {/* PROGRAM DETAILS GRID */}
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300">
        {data.duration && (
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duration
            </p>
            <p className="font-medium">{data.duration}</p>
          </div>
        )}

        {data.timing && (
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Timing
            </p>
            <p className="font-medium">{data.timing}</p>
          </div>
        )}

        {data.application_period && (
          <div className="col-span-2">
            <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">
              Application Period
            </p>
            <p className="font-medium">{data.application_period}</p>
          </div>
        )}
      </div>

      {/* COMPETITIVENESS NOTE */}
      {data.competitiveness && (
        <div className="mt-4 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-indigo-700 dark:text-indigo-300">Note: </strong>
              {data.competitiveness}
            </span>
          </p>
        </div>
      )}

      {/* DESCRIPTION (if exists) */}
      {data.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {data.description}
        </p>
      )}

      {/* SKILLS REQUIRED (if exists) */}
      {data.skills_required && data.skills_required.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.skills_required.map((skill, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/30 text-xs font-semibold text-indigo-700 dark:text-indigo-300"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* APPLICATION INFO (if exists) */}
      {data.application_info && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-slate-100">Application Info: </strong>
            {data.application_info}
          </p>
        </div>
      )}
    </div>
  );
}

export default InternshipCard;