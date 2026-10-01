import { useState } from "react";
import { AlertCircle, Building2, Calendar, ChevronDown, ChevronUp, Clock, ExternalLink, GraduationCap } from "lucide-react";
import SaveButton from "@/shared/ui/SaveButton";
import SectionHeading from "@/shared/ui/SectionHeading";
import { card, clickable } from "@/shared/ui/cardStyles";

const RESOURCES = [
  ["UNSWConnect", "Internships, part-time jobs and graduate roles", "https://unswconnect.unsw.edu.au"],
  ["UNSW Prosple", "Graduate programs and early career opportunities", "https://unsw.prosple.com"],
];

export default function IndustryExperience({ industryExperience }) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const internshipPrograms = industryExperience?.internship_programs || [];
  const topCompanies = industryExperience?.top_recruiting_companies || [];
  const placements = industryExperience?.mandatory_placements;
  const placementCodes = placements?.course_codes || [];
  const wilCodes = industryExperience?.wil_course_codes || [];
  const listedCourses = [...placementCodes, ...wilCodes.filter((code) => !placementCodes.includes(code))];
  const showPlacements = placements?.required || listedCourses.length > 0;

  if (!internshipPrograms.length && !topCompanies.length && !showPlacements) {
    return (
      <p className="text-base text-slate-600 dark:text-slate-400">
        No internship or placement information for this program yet. Try the UNSW career resources at UNSWConnect.
      </p>
    );
  }

  const displayedPrograms = showAllPrograms ? internshipPrograms : internshipPrograms.slice(0, 3);

  return (
    <section className="space-y-6">
      <SectionHeading>
        Internships and placements
      </SectionHeading>

      {showPlacements && (
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30">
          <p className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            Placements and work-integrated learning
          </p>
          {placements?.required && placements.details && (
            <p className="mt-2 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold">Required placement: </span>
              {placements.details}
            </p>
          )}
          {listedCourses.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {listedCourses.map((code) => (
                <span key={code} className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-amber-800 dark:text-amber-200 bg-white dark:bg-slate-800 ring-1 ring-amber-200 dark:ring-amber-800 shadow-sm">
                  {code}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {internshipPrograms.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Internship programs</h4>
          <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayedPrograms.map((program, idx) => (
              <div key={idx} className={`${card} p-6 flex flex-col`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">{program.program_name}</h5>
                    <p className="mt-1 flex items-center gap-1.5 text-base text-slate-600 dark:text-slate-400">
                      <Building2 className="h-4 w-4 flex-shrink-0" /> {program.company}
                    </p>
                  </div>
                  <SaveButton itemType="internship" itemId={`${program.company}-${program.program_name}`} itemName={program.program_name} itemData={program} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {program.paid && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800">Paid</span>
                  )}
                  {program.duration && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60">
                      <Clock className="h-3.5 w-3.5" /> {program.duration}
                    </span>
                  )}
                  {program.timing && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/60">
                      <Calendar className="h-3.5 w-3.5" /> {program.timing}
                    </span>
                  )}
                </div>
                {program.application_period && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <AlertCircle className="h-4 w-4 text-amber-500" /> Apply: {program.application_period}
                  </p>
                )}

                {program.apply_url && (
                  <a
                    href={program.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 self-start inline-flex items-center gap-2 text-base font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                  >
                    Apply now <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
          {internshipPrograms.length > 3 && (
            <button
              onClick={() => setShowAllPrograms(!showAllPrograms)}
              className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 hover:border-blue-400 dark:hover:bg-blue-900/50 transition-colors"
            >
              {showAllPrograms ? (
                <>Show fewer <ChevronUp className="h-5 w-5" /></>
              ) : (
                <>Show {internshipPrograms.length - 3} more {internshipPrograms.length === 4 ? "program" : "programs"} <ChevronDown className="h-5 w-5" /></>
              )}
            </button>
          )}
        </div>
      )}

      <div>
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">UNSW career resources</h4>
        <div className="mt-4 grid sm:grid-cols-2 gap-5">
          {RESOURCES.map(([name, desc, url]) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${card} ${clickable} group p-6 flex items-start justify-between gap-3`}
            >
              <span>
                <span className="block text-lg font-semibold text-slate-900 dark:text-white">{name}</span>
                <span className="mt-1 block text-base text-slate-600 dark:text-slate-400">{desc}</span>
              </span>
              <ExternalLink className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
