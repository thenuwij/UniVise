import { useState } from "react";
import SaveButton from "../SaveButton";

import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
} from "lucide-react";


export default function IndustryExperience({ industryExperience }) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const internshipPrograms = industryExperience?.internship_programs || [];
  const topCompanies = industryExperience?.top_recruiting_companies || [];

  if (!internshipPrograms.length && !topCompanies.length) {
    return null;
  }

  const displayedPrograms = showAllPrograms ? internshipPrograms : internshipPrograms.slice(0, 3);

  return (
    <div className="p-6 space-y-8">

      {/* HEADER */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60
                      px-6 py-4 -mx-6 -mt-6 mb-5 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">

        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Briefcase className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Internship Programs
          </h3>
        </div>
      </div>

      {/* INTERNSHIP PROGRAMS SECTION */}
      {internshipPrograms.length > 0 && (
        <div className="space-y-4">
          {displayedPrograms.map((program, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              {/* Top row — name, company, paid badge, save */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h5 className="font-semibold text-lg text-slate-900 dark:text-slate-100 leading-snug">
                    {program.program_name}
                  </h5>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Building2 className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <p className="text-base text-slate-600 dark:text-slate-400 font-medium">{program.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {program.paid && (
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg">
                      Paid
                    </span>
                  )}
                  <SaveButton itemType="internship" itemId={`${program.company}-${program.program_name}`} itemName={program.program_name} itemData={program} />
                </div>
              </div>

              {/* Compact info row */}
              <div className="flex flex-wrap gap-3 mb-3">
                {program.duration && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-medium">{program.duration}</span>
                  </div>
                )}
                {program.timing && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    <span className="font-medium">{program.timing}</span>
                  </div>
                )}
                {program.application_period && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-medium">Apply: {program.application_period}</span>
                  </div>
                )}
              </div>

              {/* Apply button */}
              {program.apply_url && (
                <a
                  href={program.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all duration-200"
                >
                  Apply Now
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
          ))}

          {/* Show More/Less Button */}
          {internshipPrograms.length > 3 && (
            <button
              onClick={() => setShowAllPrograms(!showAllPrograms)}
              className="mt-5 w-full py-2.5 text-sm font-bold
                       text-white dark:text-white
                       transition-all flex items-center justify-center gap-2
                       rounded-xl bg-blue-600 dark:bg-blue-600
                       hover:bg-blue-700 dark:hover:bg-blue-700
                       border-2 border-blue-700 dark:border-blue-800
                       shadow-md hover:shadow-lg hover:scale-105"
            >
              {showAllPrograms ? (
                <>Show Less <ChevronUp className="h-5 w-5" /></>
              ) : (
                <>Show {internshipPrograms.length - 3} More {internshipPrograms.length === 4 ? 'Program' : 'Programs'} <ChevronDown className="h-5 w-5" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* UNSW CAREER RESOURCES SECTION */}
      <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700 shadow-md">
        <div className="flex items-start gap-4 mb-5 pb-4 border-b-2 border-blue-200 dark:border-blue-600">
          <div className="p-2.5 rounded-xl bg-blue-600 dark:bg-blue-600 shadow-md flex-shrink-0">
            <Info className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
              UNSW Career Resources
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Official platforms for internships and graduate opportunities
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* UNSWConnect */}
          <a
            href="https://unswconnect.unsw.edu.au"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 rounded-xl
                      bg-white dark:bg-slate-900
                      border-2 border-slate-300 dark:border-slate-600
                      hover:border-blue-400 dark:hover:border-blue-500
                      hover:shadow-lg hover:scale-105
                      transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  UNSWConnect
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Find internships, part-time jobs, and graduate opportunities
                </p>
              </div>
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2
                        group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </a>

          {/* UNSW Prosple */}
          <a
            href="https://unsw.prosple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-4 rounded-xl
                      bg-white dark:bg-slate-900
                      border-2 border-slate-300 dark:border-slate-600
                      hover:border-blue-400 dark:hover:border-blue-500
                      hover:shadow-lg hover:scale-105
                      transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  UNSW Prosple
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  Explore graduate programs and early career opportunities
                </p>
              </div>
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2
                        group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </a>
        </div>
      </div>

    </div>
  );
}
