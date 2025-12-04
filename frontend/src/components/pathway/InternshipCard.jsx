// src/components/pathway/InternshipCard.jsx
import { Building2, Calendar, Clock, AlertCircle } from "lucide-react";

function InternshipCard({ data }) {
  return (
    <div className="space-y-4">

      {/* Company & Paid Status */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {data.company && (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              {data.company}
            </p>
          )}
        </div>
        {data.paid && (
          <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
            Paid
          </span>
        )}
      </div>

      {/* Program Details Grid */}
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300">
        {data.duration && (
          <div>
            <p className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 tracking-wide">
              <Clock className="h-3 w-3" />
              Duration
            </p>
            <p className="font-medium">{data.duration}</p>
          </div>
        )}
        {data.timing && (
          <div>
            <p className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1 tracking-wide">
              <Calendar className="h-3 w-3" />
              Timing
            </p>
            <p className="font-medium">{data.timing}</p>
          </div>
        )}
        {data.application_period && (
          <div className="col-span-2">
            <p className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400 mb-1 tracking-wide">
              Application Period
            </p>
            <p className="font-medium">{data.application_period}</p>
          </div>
        )}
      </div>

      {/* Competitiveness Note */}
      {data.competitiveness && (
        <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-sky-700 dark:text-sky-300">Note: </strong>
              {data.competitiveness}
            </span>
          </p>
        </div>
      )}

      {/* Description */}
      {data.description && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {data.description}
        </p>
      )}

      {/* Skills Required */}
      {data.skills_required && data.skills_required.length > 0 && (
        <div>
          <p className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400 mb-2 tracking-wide">
            Skills Required
          </p>
          <div className="flex flex-wrap gap-2">
            {data.skills_required.map((skill, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-900/30 text-xs font-medium text-sky-700 dark:text-sky-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Application Info */}
      {data.application_info && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
          <p className="text-xs text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Application Info: </strong>
            {data.application_info}
          </p>
        </div>
      )}
    </div>
  );
}

export default InternshipCard;