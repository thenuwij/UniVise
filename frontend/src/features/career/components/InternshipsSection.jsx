import SaveButton from "@/shared/ui/SaveButton";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CircleCheck, Megaphone } from "lucide-react";
import { UserAuth } from "@/app/AuthContext";
import { supabase } from "@/shared/lib/supabase";
import { setCourseCompleted } from "@/features/transfer/utils/completedCourses";
import ExpandToggle from "@/shared/ui/ExpandToggle";
import { sameCompany } from "../utils/hiringNow";
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
    <li className="flex items-center gap-2">
      <Row
        {...linkProps}
        className="group min-w-0 flex-1 grid gap-x-6 gap-y-2 px-2 py-3 hover:bg-surface-tint transition-colors md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] md:items-center"
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
      <SaveButton itemType="internship" itemId={`${program.company}-${program.program_name}`} itemName={program.program_name} itemData={program} />
    </li>
  );
}

function usePlacementCompletion(code, enabled) {
  const { session } = UserAuth();
  const userId = session?.user?.id;
  const [row, setRow] = useState(undefined);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled || !code || !userId) return;
    let active = true;
    supabase
      .from("user_completed_courses")
      .select("*")
      .eq("user_id", userId)
      .eq("course_code", code)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setRow(error ? undefined : data || null);
        setChecked(true);
      });
    return () => { active = false; };
  }, [code, enabled, userId]);

  const toggle = async () => {
    if (!userId || row === undefined) return;
    setSaving(true);
    try {
      const { data: course } = await supabase.from("unsw_courses").select("code, title, uoc").eq("code", code).maybeSingle();
      const saved = await setCourseCompleted({
        userId,
        course: { code, name: course?.title || code, uoc: course?.uoc },
        existing: row,
        isCompleted: true,
      });
      setRow(saved);
    } catch (err) {
      console.error("Placement update failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const waiting = enabled && !!code && !!userId && !checked;
  return { waiting, ready: enabled && !!code && row !== undefined, done: !!row?.is_completed, saving, toggle };
}

export default function InternshipsSection({ industryExperience, openAds, savedIds, onToggleSave, personal }) {
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
  const placement = usePlacementCompletion(placements?.required ? placementCodes[0] : null, !!personal);

  return (
    <div className="space-y-12">
      {hasPlacements && !placement.waiting && (
        <div>
          <div
            className={`rounded-xl p-5 ${
              placements?.required
                ? placement.done
                  ? "border border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                  : "border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                : "bg-slate-50 dark:bg-slate-800/50"
            }`}
          >
            {placements?.required && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className={`flex items-center gap-2 text-base font-semibold ${placement.done ? "text-green-900 dark:text-green-200" : "text-amber-900 dark:text-amber-200"}`}>
                  {placement.done ? <CircleCheck className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {placement.done ? "Required placement completed" : "Required placement"}
                </p>
                {placement.ready && !placement.done && (
                  <button
                    type="button"
                    onClick={placement.toggle}
                    disabled={placement.saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60 dark:bg-amber-500 dark:text-amber-950"
                  >
                    Mark {placementCodes[0]} as completed
                  </button>
                )}
              </div>
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
          <SubLabel hint="Programs that open at set times each year, soonest first">Annual programs</SubLabel>
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

    </div>
  );
}
