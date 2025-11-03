import { useState } from "react";
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
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl shadow-sm">
          <Briefcase className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Industry Experience & Training
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build your career through internships and real-world opportunities
          </p>
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

      {/* ========== INTERNSHIP PROGRAMS ========== */}
      {internshipPrograms.length > 0 && (
        <div className="mb-8">
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2.5">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            Featured Internship Programs
          </h4>
          <div className="space-y-4">
            {displayedPrograms.map((program, idx) => (
              <div 
                key={idx}
                className="group p-6 rounded-xl border border-slate-200/60 dark:border-slate-700/60
                           bg-gradient-to-br from-white to-slate-50/30 dark:from-slate-900 dark:to-slate-800/50
                           shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Program Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h5 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2">
                      {program.program_name}
                    </h5>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                      {program.company}
                    </p>
                  </div>
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

                {/* Competitiveness Note */}
                {program.competitiveness && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                    <span className="font-semibold">Note:</span> {program.competitiveness}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {internshipPrograms.length > 3 && (
            <button
              onClick={() => setShowAllPrograms(!showAllPrograms)}
              className="mt-4 w-full py-3 text-sm font-semibold text-slate-600 dark:text-slate-400 
                       hover:text-slate-900 dark:hover:text-slate-200 
                       transition-colors flex items-center justify-center gap-2 
                       rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800
                       border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
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
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-500" />
            Top Recruiting Companies
          </h4>
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
                           shadow-sm hover:shadow-md hover:-translate-y-0.5
                           hover:border-slate-900 dark:hover:border-slate-100
                           transition-all duration-200"
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
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-5 flex items-center gap-2.5">
            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            Career Fairs & Events
          </h4>
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