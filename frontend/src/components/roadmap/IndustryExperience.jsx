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

/**
 * Premium Industry Experience & Training Component
 * 
 * Sophisticated design with:
 * - Elegant blue/indigo/slate color palette
 * - Refined typography and spacing
 * - Professional card layouts
 * - Subtle shadows and borders
 */

export default function IndustryExperience({ industryExperience }) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  
  const mandatoryPlacements = industryExperience?.mandatory_placements;
  const internshipPrograms = industryExperience?.internship_programs || [];
  const topCompanies = industryExperience?.top_recruiting_companies || [];
  const careerFairs = industryExperience?.career_fairs;
  const wilOpportunities = industryExperience?.wil_opportunities;

  if (!mandatoryPlacements && !internshipPrograms.length && !topCompanies.length) {
    return null;
  }

  const displayedPrograms = showAllPrograms ? internshipPrograms : internshipPrograms.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 p-8 shadow-xl">
      
      {/* ========== HEADER ========== */}
      <div className="relative bg-slate-50/80 dark:bg-slate-800/60 
                      px-8 py-6 -mx-8 -mt-8 mb-8 border-b-2 border-slate-200 dark:border-slate-700
                      rounded-t-2xl">
        
        {/* Very subtle gradient accent */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:from-transparent dark:via-slate-600 dark:to-transparent rounded-t-2xl" />
        
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-800 dark:bg-slate-700 shadow-md">
            <Briefcase className="h-6 w-6 text-slate-50" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Industry Experience & Training
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Build your career through internships and real-world opportunities
            </p>
          </div>
        </div>
      </div>

      {/* ========== MANDATORY PLACEMENTS BANNER ========== */}
      
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

      {/* ========== UNSW CAREER RESOURCES ========== */}
      <div className="mb-8 p-6 rounded-xl border border-amber-200/60 dark:border-amber-800/60 
                    bg-gradient-to-br from-amber-50/40 via-yellow-50/30 to-orange-50/20 
                    dark:from-amber-900/15 dark:via-yellow-900/10 dark:to-orange-900/10 
                    shadow-sm">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/30 shadow-sm">
            <Briefcase className="h-5 w-5 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2 text-amber-900 dark:text-amber-300">
              UNSW Career Resources
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              Access internships, graduate programs, and career guidance through UNSW's official platforms
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">

          {/* UNSWConnect */}
          <a
            href="https://unswconnect.unsw.edu.au"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-5 rounded-xl 
                      bg-white dark:bg-slate-900/60
                      border-2 border-amber-300/60 dark:border-amber-700/60
                      hover:border-amber-400 dark:hover:border-amber-600
                      hover:shadow-lg hover:-translate-y-1
                      transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="text-base font-bold text-amber-900 dark:text-amber-300 mb-1 
                            group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">
                  UNSWConnect
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Find internships, part-time jobs, and graduate opportunities
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 
                            group-hover:bg-amber-200/60 dark:group-hover:bg-amber-900/30 
                            transition-colors">
                <svg
                  className="h-4 w-4 text-amber-700 dark:text-amber-400 
                          group-hover:translate-x-0.5 transition-transform"
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
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 
                            text-amber-800 dark:text-amber-300 
                            text-xs font-semibold rounded-md">
                Job Board
              </span>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 
                            text-amber-800 dark:text-amber-300 
                            text-xs font-semibold rounded-md">
                Internships
              </span>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 
                            text-amber-800 dark:text-amber-300 
                            text-xs font-semibold rounded-md">
                Events
              </span>
            </div>

            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
                          bg-gradient-to-br from-amber-50/50 to-yellow-50/50 
                          dark:from-amber-900/10 dark:to-yellow-900/10 
                          pointer-events-none transition-opacity duration-300" />
          </a>

          {/* UNSW Prosple */}
          <a
            href="https://unsw.prosple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative p-5 rounded-xl 
                      bg-white dark:bg-slate-900/60
                      border-2 border-amber-300/60 dark:border-amber-700/60
                      hover:border-amber-400 dark:hover:border-amber-600
                      hover:shadow-lg hover:-translate-y-1
                      transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h5 className="text-base font-bold text-amber-900 dark:text-amber-300 mb-1 
                            group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors">
                  UNSW Prosple
                </h5>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Explore graduate programs and early career opportunities
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 
                            group-hover:bg-amber-200/60 dark:group-hover:bg-amber-900/30 
                            transition-colors">
                <svg
                  className="h-4 w-4 text-amber-700 dark:text-amber-400 
                          group-hover:translate-x-0.5 transition-transform"
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
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 
                            text-amber-800 dark:text-amber-300 
                            text-xs font-semibold rounded-md">
                Grad Programs
              </span>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 
                            text-amber-800 dark:text-amber-300 
                            text-xs font-semibold rounded-md">
                Career Advice
              </span>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 
                            text-amber-800 dark:text-amber-300 
                            text-xs font-semibold rounded-md">
                Employer Profiles
              </span>
            </div>

            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 
                          bg-gradient-to-br from-amber-50/50 to-yellow-50/50 
                          dark:from-amber-900/10 dark:to-yellow-900/10 
                          pointer-events-none transition-opacity duration-300" />
          </a>

        </div>
      </div>


      {/* ========== INTERNSHIP PROGRAMS ========== */}
      {internshipPrograms.length > 0 && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Featured Internship Programs
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              Explore structured internship opportunities with leading organizations
            </p>
          </div>

          <div className="space-y-4">
            {displayedPrograms.map((program, idx) => (
              <div 
                key={idx}
                className="p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/60
                          bg-gradient-to-br from-slate-50 via-white to-slate-100/50
                          dark:bg-gradient-to-br dark:from-slate-800/50 dark:via-slate-800/40 dark:to-slate-900/50
                          shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex-1">
                    <div className="inline-block mb-2">
                      <h5 className="font-bold text-lg 
                                  bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 
                                  dark:from-blue-400 dark:via-sky-400 dark:to-indigo-400
                                  bg-clip-text text-transparent">
                        {program.program_name}
                      </h5>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">
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
                                  text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg
                                  shadow-sm">
                      Paid
                    </span>
                  )}
                </div>


                {/* Program Details Grid */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  {program.duration && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Duration
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                          {program.duration}
                        </span>
                      </div>
                    </div>
                  )}
                  {program.timing && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Timing
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
                          {program.timing}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Application Period */}
                {program.application_period && (
                  <div className="p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 
                                dark:from-blue-900/10 dark:to-indigo-900/10 
                                rounded-lg border border-blue-200/60 dark:border-blue-800/60 mb-4">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
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

          {/* Show More/Less Button */}
          {internshipPrograms.length > 3 && (
            <button
              onClick={() => setShowAllPrograms(!showAllPrograms)}
              className="mt-4 w-full py-3 text-sm font-bold text-slate-700 dark:text-slate-300
                       hover:text-slate-900 dark:hover:text-slate-100
                       transition-all flex items-center justify-center gap-2 
                       rounded-xl bg-slate-100 dark:bg-slate-800
                       hover:bg-slate-200 dark:hover:bg-slate-700
                       border-2 border-slate-300 dark:border-slate-600
                       hover:border-slate-400 dark:hover:border-slate-500
                       shadow-sm hover:shadow-md"
            >
              {showAllPrograms ? (
                <>Show Less <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Show {internshipPrograms.length - 3} More {internshipPrograms.length === 4 ? 'Program' : 'Programs'} <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
        </div>
      )}

      {/* ========== TOP RECRUITING COMPANIES ========== */}
      {topCompanies.length > 0 && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-500" />
              Top Recruiting Companies
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              Organizations actively hiring graduates from this program
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
                            text-slate-800 dark:text-slate-200
                            shadow-sm"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== CAREER FAIRS & EVENTS ========== */}
      {careerFairs && careerFairs !== "Information temporarily unavailable" && (
        <div className="mb-8">
          <div className="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2.5">
              <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              Career Fairs & Events
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
              Connect with employers at these key networking events
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-50/50 to-sky-50/50 
                        dark:from-blue-900/10 dark:to-sky-900/10 
                        rounded-xl border border-blue-200/60 dark:border-blue-700/60 shadow-sm">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {careerFairs}
            </p>
          </div>
        </div>
      )}

      {/* ========== WORK INTEGRATED LEARNING ========== */}
      {wilOpportunities && wilOpportunities !== "Information temporarily unavailable" && (
        <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 
                      dark:from-slate-800/50 dark:to-slate-800/30 
                      rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            Work Integrated Learning
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {wilOpportunities}
          </p>
        </div>
      )}
    </div>
  );
}