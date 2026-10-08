import { useMemo, useState } from "react";
import { Building2, Calendar, ChevronDown, ChevronUp, ExternalLink, GraduationCap } from "lucide-react";
import SaveButton from "@/shared/ui/SaveButton";
import SectionHeading from "@/shared/ui/SectionHeading";
import { card, clickable } from "@/shared/ui/cardStyles";
import JobAdList from "./JobAdList";
import { SourceLink } from "./SourceTags";
import { useJobAds } from "../hooks/useHiringNow";
import { pickOpenNow, sameCompany } from "../utils/hiringNow";

const RESOURCES = [
  {
    name: "UNSWConnect",
    desc: "Internships, part-time jobs and graduate roles",
    url: "https://unswconnect.unsw.edu.au",
    tone: "border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-950/40 dark:to-sky-950/30 hover:border-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
  },
  {
    name: "UNSW Prosple",
    desc: "Graduate programs and early career opportunities",
    url: "https://unsw.prosple.com",
    tone: "border-blue-200 dark:border-blue-900/70 bg-gradient-to-br from-blue-100 to-sky-100 dark:from-blue-950/40 dark:to-sky-950/30 hover:border-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
  },
];

export default function IndustryExperience({ industryExperience, entryRoles }) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const jobAds = useJobAds(entryRoles);
  const adsLoading = jobAds === null;
  const openNow = useMemo(() => pickOpenNow(jobAds || []), [jobAds]);
  const internshipPrograms = (industryExperience?.internship_programs || []).filter(
    (program) => !openNow.some((ad) => sameCompany(ad.company, program.company))
  );
  const placements = industryExperience?.mandatory_placements;
  const placementCodes = placements?.course_codes || [];
  const wilCodes = industryExperience?.wil_course_codes || [];
  const listedCourses = [...placementCodes, ...wilCodes.filter((code) => !placementCodes.includes(code))];
  const showPlacements = placements?.required || listedCourses.length > 0;

  if (!adsLoading && !internshipPrograms.length && !showPlacements && !openNow.length) {
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

      {adsLoading && (
        <div className="space-y-3" aria-hidden>
          <div className="h-6 w-48 rounded-lg bg-slate-200/70 dark:bg-slate-800 animate-pulse" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-white/70 dark:bg-slate-900 border border-blue-100 dark:border-slate-800 animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {openNow.length > 0 && <JobAdList title="Open right now" ads={openNow} large />}

      {!adsLoading && internshipPrograms.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Keep a lookout</h4>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-400">Programs that open at set times each year.</p>
          <div className="mt-4 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {displayedPrograms.map((program, idx) => (
              <div key={idx} className={`${card} p-6 flex flex-col`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h5 className="text-lg font-bold text-ink-strong leading-snug">{program.program_name}</h5>
                    <p className="mt-1 flex items-center gap-1.5 text-base text-slate-600 dark:text-slate-400">
                      <Building2 className="h-4 w-4 flex-shrink-0" /> {program.company}
                    </p>
                  </div>
                  <SaveButton itemType="internship" itemId={`${program.company}-${program.program_name}`} itemName={program.program_name} itemData={program} />
                </div>

                {program.application_period && (
                  <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-ink-muted">Usually opens</span>
                    <span className="font-bold text-ink-strong">{program.application_period}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {program.application_period_source ? <SourceLink href={program.application_period_source}>Source</SourceLink> : "AI-suggested"}
                    </span>
                  </p>
                )}
                {(program.paid || program.duration || program.timing) && (
                  <p className="mt-2 text-sm text-ink-muted">
                    {[program.paid && "Paid", program.duration, program.timing].filter(Boolean).join(" · ")}
                  </p>
                )}

                {program.apply_url && (
                  <a
                    href={program.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 self-start inline-flex items-center gap-2 text-base font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                  >
                    {program.apply_url.startsWith("https://www.google.com/search") ? "Search for this program" : "Apply now"}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
          {internshipPrograms.length > 3 && (
            <button
              onClick={() => setShowAllPrograms(!showAllPrograms)}
              className="mt-5 w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-base font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-800 hover:bg-blue-200 hover:border-blue-400 dark:hover:bg-blue-900/50 transition-colors"
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
          {RESOURCES.map(({ name, desc, url, tone, icon }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${clickable} group rounded-2xl border ${tone} p-6 flex items-start justify-between gap-3`}
            >
              <span>
                <span className="block text-lg font-bold text-ink-strong leading-snug">{name}</span>
                <span className="mt-1 block text-base text-slate-600 dark:text-slate-400">{desc}</span>
              </span>
              <ExternalLink className={`h-5 w-5 flex-shrink-0 ${icon}`} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
