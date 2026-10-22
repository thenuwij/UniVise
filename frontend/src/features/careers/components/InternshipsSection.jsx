import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, GraduationCap, Megaphone } from "lucide-react";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import { sameCompany } from "@/features/roadmap/utils/hiringNow";
import { monthsUntilOpen } from "../utils/careersDates";
import AdRows from "./AdRows";
import { SubLabel } from "./CareersSection";

const SHOWN_PROGRAMS = 4;
const SHOWN_OPEN = 5;

function ProgramRow({ program }) {
  const details = [program.paid && "Paid", program.duration, program.timing].filter(Boolean).join(" · ");
  const searchOnly = program.apply_url?.startsWith("https://www.google.com/search");
  const Row = program.apply_url ? "a" : "div";
  const linkProps = program.apply_url ? { href: program.apply_url, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <li>
      <Row
        {...linkProps}
        className="group grid gap-x-6 gap-y-2 px-2 py-3 hover:bg-surface-tint transition-colors md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center"
      >
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-ink-strong group-hover:text-link">{program.program_name}</span>
          <span className="block mt-0.5 text-[13px] text-ink-muted">{[program.company, details].filter(Boolean).join(" · ")}</span>
        </span>
        <span className="text-[13px]">
          {program.application_period ? (
            <>
              <span className="text-ink-muted">Usually opens </span>
              <span className="font-semibold text-ink-strong">{program.application_period}</span>
              <span className="block text-xs text-ink-muted">{program.application_period_source ? "From the company's site" : "AI-suggested"}</span>
            </>
          ) : (
            <span className="text-ink-muted">Opening time unknown</span>
          )}
        </span>
        {program.apply_url && (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-link">
            {searchOnly ? "Search" : "Apply"}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        )}
      </Row>
    </li>
  );
}

export default function InternshipsSection({ industryExperience, openAds, savedIds, onToggleSave }) {
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllOpen, setShowAllOpen] = useState(false);

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
    <div className="space-y-12">
      <div>
        <SubLabel icon={Megaphone} hint="Live ads you can apply for today">Open now</SubLabel>
        <div className="mt-4">
          {openAds === null ? (
            <div className="h-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" aria-hidden />
          ) : openAds.length > 0 ? (
            <>
              <AdRows ads={showAllOpen ? openAds : openAds.slice(0, SHOWN_OPEN)} savedIds={savedIds} onToggleSave={onToggleSave} />
              {openAds.length > SHOWN_OPEN && (
                <ExpandToggle quiet open={showAllOpen} onClick={() => setShowAllOpen(!showAllOpen)}>
                  {showAllOpen ? "Show fewer" : `Show all ${openAds.length} internships`}
                </ExpandToggle>
              )}
            </>
          ) : (
            <p className="text-[15px] text-ink-muted">No internship ads open right now. The programs below show when they usually open.</p>
          )}
        </div>
      </div>

      {programs.length > 0 && (
        <div>
          <SubLabel icon={CalendarClock} hint="Programs that open at set times each year, soonest first">Annual programs</SubLabel>
          <ul className="mt-3 divide-y divide-line border-b border-line">
            {shownPrograms.map((program) => (
              <ProgramRow key={`${program.company}-${program.program_name}`} program={program} />
            ))}
          </ul>
          {programs.length > SHOWN_PROGRAMS && (
            <ExpandToggle quiet open={showAllPrograms} onClick={() => setShowAllPrograms(!showAllPrograms)}>
              {showAllPrograms ? "Show fewer" : `Show ${programs.length - SHOWN_PROGRAMS} more ${programs.length - SHOWN_PROGRAMS === 1 ? "program" : "programs"}`}
            </ExpandToggle>
          )}
        </div>
      )}

      {hasPlacements && (
        <div>
          <SubLabel icon={GraduationCap} hint="Work experience built into your degree">Placements in your degree</SubLabel>
          <div
            className={`mt-4 rounded-xl p-5 ${
              placements?.required
                ? "border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                : "bg-slate-50 dark:bg-slate-800/50"
            }`}
          >
            {placements?.required && (
              <p className="flex items-center gap-2 text-base font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                Required placement
              </p>
            )}
            {placements?.required && placements.details && (
              <p className="mt-2 text-[15px] text-ink leading-relaxed">{placements.details}</p>
            )}
            {listedCourses.length > 0 && (
              <div className={`flex flex-wrap gap-1.5 ${placements?.required ? "mt-3" : ""}`}>
                {listedCourses.map((code) => (
                  <span key={code} className="px-2.5 py-1 rounded-md text-[13px] font-semibold text-ink-strong bg-surface border border-line">
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
