// src/components/roadmap/IndustrySection.jsx
import { useState } from "react";
import SaveButton from "../SaveButton";

import { 
  Briefcase, 
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";

export default function IndustrySection({ industryExperience }) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  // Backend-aligned fields
  const mandatoryPlacements = industryExperience?.mandatory_placements;
  const internshipPrograms = industryExperience?.internship_programs || [];
  const topCompanies = industryExperience?.top_recruiting_companies || [];
  const careerFairs = industryExperience?.career_fairs;
  const wilOpportunities = industryExperience?.wil_opportunities;

  const hasData =
    mandatoryPlacements ||
    internshipPrograms.length > 0 ||
    topCompanies.length > 0 ||
    careerFairs ||
    wilOpportunities;

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                      dark:border-slate-700/60 p-8 shadow-xl">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          No industry information available.
        </p>
      </div>
    );
  }

  const displayedPrograms = showAllPrograms ? internshipPrograms : internshipPrograms.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 
                    dark:border-slate-700/60 p-8 shadow-xl">

      {/* Header */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-8 py-6 -mx-8 -mt-8 mb-8 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-600" />
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Briefcase className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Industry Experience & Training
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Internships, placements, and industry connections
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory placements */}
      {mandatoryPlacements && (
        <div className={`mb-8 p-6 rounded-xl border shadow-sm ${
          mandatoryPlacements.required 
            ? 'bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200/60 dark:border-amber-800/60'
            : 'bg-gradient-to-br from-emerald-50/50 to-green-50/30 dark:from-emerald-900/10 dark:to-green-900/10 border-emerald-200/60 dark:border-emerald-800/60'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-lg ${
              mandatoryPlacements.required 
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-emerald-100 dark:bg-emerald-900/30'
            }`}>
              {mandatoryPlacements.required ? (
                <AlertCircle className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${
                mandatoryPlacements.required
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-emerald-800 dark:text-emerald-300'
              }`}>
                {mandatoryPlacements.required ? 'Mandatory Placements' : 'Placements Optional'}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {mandatoryPlacements.details}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Internship programs */}
      {internshipPrograms.length > 0 && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Featured Internship Programs
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Structured internship opportunities for early career development
            </p>
          </div>

          <div className="space-y-4">
            {displayedPrograms.map((program, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/60
                          bg-gradient-to-br from-slate-50 via-white to-slate-100/50
                          dark:from-slate-800/50 dark:via-slate-800/40 dark:to-slate-900/50
                          shadow-sm"
              >
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex-1">
                    <h5 className="font-bold text-lg bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 
                                  dark:from-blue-400 dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">
                      {program.program_name}
                    </h5>

                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {program.company}
                      </p>
                    </div>
                  </div>

                  <SaveButton
                    itemType="internship"
                    itemId={`${program.company}-${program.program_name}`}
                    itemName={program.program_name}
                    itemData={program}
                  />

                  {program.paid && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 
                                  dark:from-emerald-900/20 dark:to-green-900/20 
                                  border border-emerald-200 dark:border-emerald-700
                                  text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg">
                      Paid
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {program.duration && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                          Duration
                        </span>
                        <span className="text-sm font-semibold">
                          {program.duration}
                        </span>
                      </div>
                    </div>
                  )}

                  {program.timing && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <span className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                          Timing
                        </span>
                        <span className="text-sm font-semibold">
                          {program.timing}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {program.application_period && (
                  <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 
                                dark:from-blue-900/10 dark:to-indigo-900/10 
                                rounded-lg border border-blue-200/60 dark:border-blue-800/60 mb-4">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                        Application Period:
                      </span>{" "}
                      {program.application_period}
                    </p>
                  </div>
                )}

                {program.competitiveness && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                    {program.competitiveness}
                  </p>
                )}

                {/* Apply Now Button */}
                {program.apply_url && (
                  <a
                    href={program.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 
                              bg-gradient-to-r from-blue-600 to-indigo-600 
                              hover:from-blue-700 hover:to-indigo-700
                              text-white text-sm font-bold rounded-lg
                              shadow-md hover:shadow-lg transition-all duration-200
                              border border-blue-500"
                  >
                    <span>Apply Now</span>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}

              </div>
            ))}
          </div>

          {internshipPrograms.length > 3 && (
            <button
              onClick={() => setShowAllPrograms(!showAllPrograms)}
              className="mt-4 w-full py-3 text-sm font-bold rounded-xl bg-slate-100 dark:bg-slate-800
                         border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-200 
                         dark:hover:bg-slate-700 hover:shadow-md transition-all flex items-center justify-center gap-2"
            >
              {showAllPrograms ? (
                <>Show Less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show {internshipPrograms.length - 3} More <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Top companies */}
      {topCompanies.length > 0 && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-500" />
              Top Recruiting Companies
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Companies hiring graduates in this field
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 
                        dark:from-indigo-900/10 dark:to-purple-900/10 
                        rounded-xl border border-indigo-200/60 dark:border-indigo-700/60 shadow-sm">
            <div className="flex flex-wrap gap-2.5">
              {topCompanies.map((company, idx) => (
                <span 
                  key={idx}
                  className="px-4 py-2 rounded-lg text-sm font-semibold
                            bg-white dark:bg-slate-900 
                            border-2 border-slate-200 dark:border-slate-700
                            text-slate-800 dark:text-slate-200 shadow-sm"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Career fairs */}
      {careerFairs && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Career Fairs & Events
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Employer networking and career development events
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-50/50 to-sky-50/50 
                        dark:from-blue-900/10 dark:to-sky-900/10 
                        rounded-xl border border-blue-200/60 dark:border-blue-700/60 shadow-sm">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {careerFairs}
            </p>
          </div>
        </div>
      )}

      {/* Work integrated learning */}
      {wilOpportunities && (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 
                      dark:from-slate-800/50 dark:to-slate-800/30 
                      rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <h4 className="text-base font-bold flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            Work Integrated Learning
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
            {wilOpportunities}
          </p>
        </div>
      )}

    </div>
  );
}
