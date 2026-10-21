import { useMemo, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import SaveButton from "@/shared/ui/SaveButton";
import { SourceLink } from "@/features/roadmap/components/SourceTags";
import { sameCompany } from "@/features/roadmap/utils/hiringNow";
import { monthsUntilOpen } from "../utils/careersDates";
import AdRows, { AdzunaCredit } from "./AdRows";
import { SubLabel } from "./CareersSection";

const SHOWN_PROGRAMS = 4;

const RESOURCES = [
  { name: "UNSWConnect", desc: "Internships, part-time jobs and graduate roles", url: "https://unswconnect.unsw.edu.au" },
  { name: "UNSW Prosple", desc: "Graduate programs and early career opportunities", url: "https://unsw.prosple.com" },
];

function ProgramRow({ program }) {
  const details = [program.paid && "Paid", program.duration, program.timing].filter(Boolean).join(" · ");
  const searchOnly = program.apply_url?.startsWith("https://www.google.com/search");

  return (
    <li className="grid gap-x-6 gap-y-2 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-ink-strong">{program.program_name}</p>
        <p className="mt-0.5 text-[13px] text-ink-muted">{[program.company, details].filter(Boolean).join(" · ")}</p>
      </div>
      <div className="text-[13px]">
        {program.application_period ? (
          <>
            <span className="text-ink-muted">Usually opens </span>
            <span className="font-semibold text-ink-strong">{program.application_period}</span>
            <span className="block text-xs text-ink-muted">
              {program.application_period_source ? <SourceLink href={program.application_period_source}>Source</SourceLink> : "AI-suggested"}
            </span>
          </>
        ) : (
          <span className="text-ink-muted">Opening time unknown</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {program.apply_url && (
          <a
            href={program.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-link border border-line hover:border-blue-300 transition-colors"
          >
            {searchOnly ? "Search" : "Apply"}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <SaveButton itemType="internship" itemId={`${program.company}-${program.program_name}`} itemName={program.program_name} itemData={program} />
      </div>
    </li>
  );
}

export default function InternshipsSection({ industryExperience, openAds }) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  const programs = useMemo(() => {
    const list = (industryExperience?.internship_programs || []).filter(
      (program) => !(openAds || []).some((ad) => sameCompany(ad.organisation, program.company))
    );
    return list
      .map((program) => ({ program, months: monthsUntilOpen(program.application_period) }))
      .sort((a, b) => (a.months ?? 12) - (b.months ?? 12))
      .map(({ program }) => program);
  }, [industryExperience, openAds]);

  const placements = industryExperience?.mandatory_placements;
  const placementCodes = placements?.course_codes || [];
  const wilCodes = industryExperience?.wil_course_codes || [];
  const listedCourses = [...placementCodes, ...wilCodes.filter((code) => !placementCodes.includes(code))];
  const hasPlacements = placements?.required || listedCourses.length > 0;
  const shownPrograms = showAllPrograms ? programs : programs.slice(0, SHOWN_PROGRAMS);

  return (
    <div className="space-y-8">
      <div>
        <SubLabel action={openAds?.some((ad) => ad.source_site === "Adzuna") && <AdzunaCredit />}>Open now</SubLabel>
        <div className="mt-3">
          {openAds === null ? (
            <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" aria-hidden />
          ) : openAds.length > 0 ? (
            <AdRows ads={openAds} />
          ) : (
            <p className="text-sm text-ink-muted">No internship ads open right now. The programs below show when they usually open.</p>
          )}
        </div>
      </div>

      {programs.length > 0 && (
        <div>
          <SubLabel>Opening soon</SubLabel>
          <ul className="mt-1 divide-y divide-line border-b border-line">
            {shownPrograms.map((program) => (
              <ProgramRow key={`${program.company}-${program.program_name}`} program={program} />
            ))}
          </ul>
          {programs.length > SHOWN_PROGRAMS && (
            <ExpandToggle wide open={showAllPrograms} onClick={() => setShowAllPrograms(!showAllPrograms)}>
              {showAllPrograms ? "Show fewer" : `Show ${programs.length - SHOWN_PROGRAMS} more ${programs.length - SHOWN_PROGRAMS === 1 ? "program" : "programs"}`}
            </ExpandToggle>
          )}
        </div>
      )}

      {hasPlacements && (
        <div>
          <SubLabel>Placements in your degree</SubLabel>
          <div
            className={`mt-3 rounded-xl p-5 ${
              placements?.required
                ? "border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                : "bg-slate-50 dark:bg-slate-800/50"
            }`}
          >
            {placements?.required && (
              <p className="flex items-center gap-2 text-[15px] font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Required placement
              </p>
            )}
            {placements?.required && placements.details && (
              <p className="mt-2 text-sm text-ink leading-relaxed">{placements.details}</p>
            )}
            {listedCourses.length > 0 && (
              <div className={`flex flex-wrap gap-1.5 ${placements?.required ? "mt-3" : ""}`}>
                {listedCourses.map((code) => (
                  <span key={code} className="px-2.5 py-1 rounded-md text-xs font-semibold text-ink-strong bg-surface border border-line">
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <SubLabel>UNSW career resources</SubLabel>
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          {RESOURCES.map(({ name, desc, url }) => (
            <a
              key={name}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 hover:border-blue-300 hover:bg-surface-tint transition-colors"
            >
              <span>
                <span className="block text-[15px] font-medium text-ink-strong group-hover:text-link">{name}</span>
                <span className="block text-[13px] text-ink-muted">{desc}</span>
              </span>
              <ExternalLink className="h-4 w-4 flex-shrink-0 text-ink-muted group-hover:text-link" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
