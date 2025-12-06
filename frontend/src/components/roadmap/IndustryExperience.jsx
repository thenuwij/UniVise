import { useState } from "react";
import SaveButton from "../SaveButton";

import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  TrendingUp
} from "lucide-react";

export default function IndustryExperience({ industryExperience }) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  
  const mandatoryPlacements = industryExperience?.mandatory_placements;
  const internshipPrograms = industryExperience?.internship_programs || [];
  const topCompanies = industryExperience?.top_recruiting_companies || [];
  const careerFairs = industryExperience?.career_fairs;

  if (!mandatoryPlacements && !internshipPrograms.length && !topCompanies.length) {
    return null;
  }

  const displayedPrograms = showAllPrograms ? internshipPrograms : internshipPrograms.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-6 shadow-xl space-y-8">
      
      {/* Top Accent Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl" />
      
      {/* HEADER - COMPACT */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-6 py-4 -mx-6 -mt-6 mb-5 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">
        
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
        
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Briefcase className="h-5 w-5 text-slate-50" strokeWidth={2.5} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Industry Experience & Training
          </h3>
        </div>
      </div>

      {/*  MANDATORY PLACEMENTS SECTION */}
      {mandatoryPlacements && (
        <div className={`p-6 rounded-2xl border-2 shadow-md ${
          mandatoryPlacements.required 
            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
            : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
        }`}>
          <div className="flex items-start gap-4 pb-4 mb-4 border-b-2 ${
            mandatoryPlacements.required 
              ? 'border-amber-200 dark:border-amber-600'
              : 'border-emerald-200 dark:border-emerald-600'
          }">
            <div className={`p-3 rounded-xl shadow-md flex-shrink-0 ${
              mandatoryPlacements.required 
                ? 'bg-amber-600 dark:bg-amber-600'
                : 'bg-emerald-600 dark:bg-emerald-600'
            }`}>
              {mandatoryPlacements.required ? (
                <AlertCircle className="h-6 w-6 text-white" strokeWidth={2.5} />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-white" strokeWidth={2.5} />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {mandatoryPlacements.required ? 'Mandatory Placements' : 'Placements Optional'}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {mandatoryPlacements.required 
                  ? 'Required work placements for this program'
                  : 'Voluntary placement opportunities available'}
              </p>
            </div>
          </div>
          <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
            {mandatoryPlacements.details}
          </p>
        </div>
      )}

      {/* UNSW CAREER RESOURCES SECTION */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-300 dark:border-blue-700 shadow-md">
        <div className="flex items-start gap-4 mb-5 pb-4 border-b-2 border-blue-200 dark:border-blue-600">
          <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-600 shadow-md flex-shrink-0">
            <Info className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              UNSW Career Resources
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              Official platforms for internships and graduate opportunities
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-sm mb-5">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
            Access job boards, internship listings, and career guidance through these official UNSW platforms.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* UNSWConnect */}
          <a
            href="https://unswconnect.unsw.edu.au"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-5 rounded-xl 
                      bg-white dark:bg-slate-900
                      border-2 border-slate-300 dark:border-slate-600
                      hover:border-blue-400 dark:hover:border-blue-500
                      hover:shadow-lg hover:scale-105
                      transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                  UNSWConnect
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
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

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700
                            text-slate-800 dark:text-slate-200
                            border-2 border-slate-300 dark:border-slate-600
                            text-sm font-semibold rounded-lg">
                Job Board
              </span>
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700
                            text-slate-800 dark:text-slate-200
                            border-2 border-slate-300 dark:border-slate-600
                            text-sm font-semibold rounded-lg">
                Internships
              </span>
            </div>
          </a>

          {/* UNSW Prosple */}
          <a
            href="https://unsw.prosple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group p-5 rounded-xl 
                      bg-white dark:bg-slate-900
                      border-2 border-slate-300 dark:border-slate-600
                      hover:border-blue-400 dark:hover:border-blue-500
                      hover:shadow-lg hover:scale-105
                      transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
                  UNSW Prosple
                </h5>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
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

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700
                            text-slate-800 dark:text-slate-200
                            border-2 border-slate-300 dark:border-slate-600
                            text-sm font-semibold rounded-lg">
                Grad Programs
              </span>
              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700
                            text-slate-800 dark:text-slate-200
                            border-2 border-slate-300 dark:border-slate-600
                            text-sm font-semibold rounded-lg">
                Career Advice
              </span>
            </div>
          </a>
        </div>
      </div>

      {/* INTERNSHIP PROGRAMS SECTION */}
      {internshipPrograms.length > 0 && (
        <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
          <div className="mb-5 pb-5 border-b-2 border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-600 shadow-md flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Featured Internship Programs
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Structured opportunities with leading organizations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-sm">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                Apply directly through these internship programs to gain hands-on industry experience.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {displayedPrograms.map((program, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-xl border-2 border-slate-300 dark:border-slate-600
                          bg-white dark:bg-slate-800
                          shadow-md hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500
                          transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                  <div className="flex-1">
                    <h5 className="font-bold text-xl text-blue-700 dark:text-blue-400 mb-2">
                      {program.program_name}
                    </h5>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      <p className="text-base text-slate-900 dark:text-slate-100 font-bold">
                        {program.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {program.paid && (
                      <span className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30
                                    border-2 border-emerald-300 dark:border-emerald-700
                                    text-emerald-700 dark:text-emerald-300 text-sm font-bold rounded-lg
                                    shadow-sm">
                        Paid
                      </span>
                    )}
                    
                    <SaveButton
                      itemType="internship"
                      itemId={`${program.company}-${program.program_name}`} 
                      itemName={program.program_name}
                      itemData={program}
                    />
                  </div>
                </div>

                {/* Program Details Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {program.duration && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Duration
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-bold">
                          {program.duration}
                        </span>
                      </div>
                    </div>
                  )}
                  {program.timing && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                          Timing
                        </span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 font-bold">
                          {program.timing}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Period */}
                {program.application_period && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20
                                rounded-xl border-2 border-blue-300/50 dark:border-blue-700/50 shadow-sm mb-4">
                    <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
                      <span className="font-bold text-blue-700 dark:text-blue-300 text-base">
                        Application Period:{" "}
                      </span>
                      {program.application_period}
                    </p>
                  </div>
                )}

                {/* Apply URL Link */}
                {program.apply_url && (
                  <a
                    href={program.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3
                              bg-blue-600 hover:bg-blue-700
                              dark:bg-blue-600 dark:hover:bg-blue-700
                              text-white text-base font-bold rounded-xl
                              shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                  >
                    <span>Apply Now</span>
                    <svg
                      className="h-5 w-5"
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
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {internshipPrograms.length > 3 && (
            <button
              onClick={() => setShowAllPrograms(!showAllPrograms)}
              className="mt-5 w-full py-4 text-base font-bold 
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

      {/* TOP RECRUITING COMPANIES SECTION */}
      {topCompanies.length > 0 && (
        <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
          <div className="mb-5 pb-5 border-b-2 border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4 mb-3">
              <div className="p-3 rounded-xl bg-blue-600 dark:bg-blue-600 shadow-md flex-shrink-0">
                <Building2 className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Top Recruiting Companies
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Organizations actively hiring from this program
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-sm">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                These companies regularly recruit graduates and may offer internships, graduate programs, and full-time positions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {topCompanies.map((company, idx) => (
              <span 
                key={idx}
                className="px-5 py-3 rounded-xl text-base font-bold
                          bg-white dark:bg-slate-800
                          border-2 border-slate-300 dark:border-slate-600
                          text-slate-900 dark:text-slate-100
                          shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500
                          transition-all duration-200"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CAREER FAIRS & EVENTS SECTION */}
      {careerFairs && careerFairs !== "Information temporarily unavailable" && (
        <div className="pt-6 border-t-4 border-slate-200 dark:border-slate-700">
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border-2 border-green-300 dark:border-green-700 shadow-md">
            <div className="flex items-start gap-4 mb-4 pb-4 border-b-2 border-green-200 dark:border-green-600">
              <div className="p-3 rounded-xl bg-green-600 dark:bg-green-600 shadow-md flex-shrink-0">
                <Calendar className="h-6 w-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  Career Fairs & Events
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Network with employers and explore opportunities
                </p>
              </div>
            </div>
            <p className="text-base text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
              {careerFairs}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}